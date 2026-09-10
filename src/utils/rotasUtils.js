import { preverMes } from './previsao';

// Constantes de fallback — usadas SÓ quando ainda não há dados reais.
// Toda saída que depender delas vem marcada com isConsumoEstimado / isPrecoEstimado.
export const KML_FALLBACK = 10;
export const PRECO_LITRO_FALLBACK = 5.5;
// Linha reta -> via real: fator médio urbano/rodoviário quando o OSRM não responde.
export const FATOR_VIA_REAL = 1.38;

export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function gerarUrlGoogleMaps(waypoints) {
  if (!waypoints || waypoints.length < 2) return '';
  const coordsStr = waypoints.map((p) => `${p.latitude},${p.longitude}`).join('/');
  return `https://www.google.com/maps/dir/${coordsStr}`;
}

/**
 * Consulta a API pública OSRM (demo) para distâncias viárias reais.
 * ATENÇÃO: o servidor demo não tem SLA nem garantia de disponibilidade.
 * Quando falha, o app cai para haversine * FATOR_VIA_REAL e marca isDistanciaReal=false.
 */
export async function obterDistanciasReaisOSRM(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  try {
    const coordsStr = waypoints.map((p) => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const legsKm = (route.legs || []).map((l) => l.distance / 1000);
      return { legsKm, totalKm: route.distance / 1000, sucesso: true };
    }
    return null;
  } catch (err) {
    console.warn('OSRM indisponível, usando estimativa viária:', err);
    return null;
  }
}

/**
 * Monta o circuito Casa -> mais perto -> ... -> mais longe -> ... -> Casa.
 * A ordenação é por distância em linha reta de Casa (heurística, não é
 * roteirização ótima — ver isOrdemHeuristica na saída).
 */
export function montarSequenciaCircuito(casa, rotas = []) {
  const latCasa = casa?.latCasa ?? -21.2687653;
  const lngCasa = casa?.lngCasa ?? -47.8197413;
  const nomeCasa = casa?.nomeCasa || 'Casa';
  const enderecoCasa = casa?.enderecoCasa || '';

  if (!rotas || rotas.length === 0) {
    return { destinosOrdenados: [], waypointsCompletos: [], paresIda: [], paresVolta: [] };
  }

  const rotasComDistancia = rotas.map((r) => ({
    ...r,
    distanciaCasaCalculada: calcularDistanciaKm(latCasa, lngCasa, r.latitude, r.longitude),
  }));

  const destinosOrdenados = [...rotasComDistancia].sort(
    (a, b) => a.distanciaCasaCalculada - b.distanciaCasaCalculada
  );

  const pontoCasa = {
    nome: nomeCasa,
    endereco: enderecoCasa,
    latitude: latCasa,
    longitude: lngCasa,
    isCasa: true,
  };

  const pontosIda = [pontoCasa, ...destinosOrdenados];
  const paresIda = [];
  for (let i = 0; i < pontosIda.length - 1; i++) {
    paresIda.push({ origem: pontosIda[i], destino: pontosIda[i + 1], tipo: 'ida' });
  }

  const destinosInversos = [...destinosOrdenados].reverse();
  const pontosVolta = [...destinosInversos, pontoCasa];
  const paresVolta = [];
  for (let i = 0; i < pontosVolta.length - 1; i++) {
    paresVolta.push({ origem: pontosVolta[i], destino: pontosVolta[i + 1], tipo: 'volta' });
  }

  const waypointsCompletos = [pontoCasa, ...destinosOrdenados];
  if (destinosOrdenados.length > 1) {
    for (let i = destinosOrdenados.length - 2; i >= 0; i--) {
      waypointsCompletos.push(destinosOrdenados[i]);
    }
  }
  waypointsCompletos.push(pontoCasa);

  return { destinosOrdenados, waypointsCompletos, paresIda, paresVolta };
}

/**
 * @param {Object} sequenciaInfo  saída de montarSequenciaCircuito
 * @param {Object} opts
 * @param {number} [opts.mediaKmPorLitro]  consumo real (0/undefined -> fallback + flag)
 * @param {number} [opts.precoLitroMedio]  preço real (0/undefined -> fallback + flag)
 * @param {Object} [opts.distanciasOSRM]   saída de obterDistanciasReaisOSRM
 * @param {Array}  [opts.viagens]          para a previsão mensal
 * @param {Array}  [opts.abastecimentos]   para a faixa de incerteza
 */
export function calcularCustosCircuito(sequenciaInfo, opts = {}) {
  const {
    mediaKmPorLitro,
    precoLitroMedio,
    distanciasOSRM = null,
    viagens = [],
    abastecimentos = [],
  } = opts;

  const isConsumoEstimado = !(Number(mediaKmPorLitro) > 0);
  const isPrecoEstimado = !(Number(precoLitroMedio) > 0);
  const avgKmL = isConsumoEstimado ? KML_FALLBACK : Number(mediaKmPorLitro);
  const avgPreco = isPrecoEstimado ? PRECO_LITRO_FALLBACK : Number(precoLitroMedio);

  const { destinosOrdenados, waypointsCompletos, paresIda, paresVolta } = sequenciaInfo;

  const vazio = {
    destinosOrdenados: destinosOrdenados || [],
    waypointsCompletos: waypointsCompletos || [],
    trechosIda: [],
    trechosVolta: [],
    distanciaIdaKm: 0,
    distanciaVoltaKm: 0,
    distanciaTotalKm: 0,
    custoIdaRS: 0,
    custoVoltaRS: 0,
    custoTotalDiarioRS: 0,
    custoTotalMensalRS: 0,
    previsao: null,
    googleMapsUrl: '',
    avgKmL,
    avgPreco,
    isDistanciaReal: false,
    isConsumoEstimado,
    isPrecoEstimado,
    isOrdemHeuristica: (destinosOrdenados || []).length > 2,
  };

  if (!waypointsCompletos || waypointsCompletos.length < 2) return vazio;

  const todosPares = [...paresIda, ...paresVolta];
  const legsOSRM = distanciasOSRM?.legsKm || null;
  const isDistanciaReal = Array.isArray(legsOSRM) && legsOSRM.length === todosPares.length;

  let distanciaIdaKm = 0;
  let distanciaVoltaKm = 0;

  const processarTrecho = (par, indiceGlobal) => {
    let distKm;
    if (isDistanciaReal) {
      distKm = legsOSRM[indiceGlobal];
    } else {
      distKm =
        calcularDistanciaKm(
          par.origem.latitude,
          par.origem.longitude,
          par.destino.latitude,
          par.destino.longitude
        ) * FATOR_VIA_REAL;
    }
    const custoRS = (distKm / avgKmL) * avgPreco;
    return {
      origemNome: par.origem.nome,
      destinoNome: par.destino.nome,
      distanciaKm: distKm,
      custoRS,
      origemCoords: { lat: par.origem.latitude, lng: par.origem.longitude },
      destinoCoords: { lat: par.destino.latitude, lng: par.destino.longitude },
    };
  };

  const trechosIda = paresIda.map((par, i) => {
    const t = processarTrecho(par, i);
    distanciaIdaKm += t.distanciaKm;
    return t;
  });

  const trechosVolta = paresVolta.map((par, i) => {
    const t = processarTrecho(par, paresIda.length + i);
    distanciaVoltaKm += t.distanciaKm;
    return t;
  });

  const distanciaTotalKm = distanciaIdaKm + distanciaVoltaKm;
  const custoIdaRS = (distanciaIdaKm / avgKmL) * avgPreco;
  const custoVoltaRS = (distanciaVoltaKm / avgKmL) * avgPreco;
  const custoTotalDiarioRS = (distanciaTotalKm / avgKmL) * avgPreco;

  const previsao = preverMes({
    mesReferencia: new Date(),
    custoDiarioTrabalho: custoTotalDiarioRS,
    viagens,
    abastecimentos,
    custoEhEstimativa: isConsumoEstimado || isPrecoEstimado || !isDistanciaReal,
  });

  return {
    destinosOrdenados,
    waypointsCompletos,
    trechosIda,
    trechosVolta,
    distanciaIdaKm,
    distanciaVoltaKm,
    distanciaTotalKm,
    custoIdaRS,
    custoVoltaRS,
    custoTotalDiarioRS,
    custoTotalMensalRS: previsao.custoTotalPrevisto,
    custoTrabalhoMensalRS: previsao.custoTrabalhoMes,
    previsao,
    diasUteis: previsao.diasUteisMes,
    googleMapsUrl: gerarUrlGoogleMaps(waypointsCompletos),
    avgKmL,
    avgPreco,
    isDistanciaReal,
    isConsumoEstimado,
    isPrecoEstimado,
    isOrdemHeuristica: (destinosOrdenados || []).length > 2,
  };
}

/** Conveniência: monta a sequência e calcula custos numa chamada. */
export function calcularCircuito(casa, rotas = [], opts = {}) {
  const sequenciaInfo = montarSequenciaCircuito(casa, rotas);
  return calcularCustosCircuito(sequenciaInfo, opts);
}
