export function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function gerarUrlGoogleMaps(waypoints) {
  if (!waypoints || waypoints.length < 2) return '';
  const coordsStr = waypoints.map(p => `${p.latitude},${p.longitude}`).join('/');
  return `https://www.google.com/maps/dir/${coordsStr}`;
}

/**
 * Consulta a API OSRM de roteamento viário real (Driving)
 * para obter as distâncias exatas de rua/rodovia entre os pontos
 */
export async function obterDistanciasReaisOSRM(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  try {
    const coordsStr = waypoints.map(p => `${p.longitude},${p.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code === 'Ok' && data.routes && data.routes[0]) {
      const route = data.routes[0];
      const legsKm = (route.legs || []).map(l => l.distance / 1000);
      return {
        legsKm,
        totalKm: route.distance / 1000,
        sucesso: true
      };
    }
    return null;
  } catch (err) {
    console.warn('Não foi possível obter distância OSRM, usando estimativa viária:', err);
    return null;
  }
}

/**
 * Monta o circuito completo de ida e volta conforme especificado pelo usuário:
 *
 * IDA:
 * Casa -> Destino mais perto
 * Destino mais perto -> Destino mais longe
 *
 * VOLTA:
 * Destino mais longe -> Destino mais perto
 * Destino mais perto -> Casa
 */
export function montarSequenciaCircuito(casa, rotas = []) {
  const latCasa = casa?.latCasa || -21.2687653;
  const lngCasa = casa?.lngCasa || -47.8197413;
  const nomeCasa = casa?.nomeCasa || 'Casa - Lar Grécia';
  const enderecoCasa = casa?.enderecoCasa || 'Rua Alfredo Pucci, 80 - Bonfim Paulista, Ribeirão Preto - SP';

  if (!rotas || rotas.length === 0) {
    return {
      destinosOrdenados: [],
      waypointsCompletos: [],
      paresIda: [],
      paresVolta: []
    };
  }

  // 1. Calcular distância de cada destino até a Casa
  const rotasComDistancia = rotas.map(r => ({
    ...r,
    distanciaCasaCalculada: calcularDistanciaKm(latCasa, lngCasa, r.latitude, r.longitude)
  }));

  // 2. Ordenar do mais próximo ao mais distante de Casa
  const destinosOrdenados = [...rotasComDistancia].sort(
    (a, b) => a.distanciaCasaCalculada - b.distanciaCasaCalculada
  );

  const pontoCasa = {
    nome: nomeCasa,
    endereco: enderecoCasa,
    latitude: latCasa,
    longitude: lngCasa,
    isCasa: true
  };

  // 3. Montar pares de IDA:
  // Casa -> D1 (mais perto)
  // D1 -> D2 (mais longe)...
  const pontosIda = [pontoCasa, ...destinosOrdenados];
  const paresIda = [];
  for (let i = 0; i < pontosIda.length - 1; i++) {
    paresIda.push({
      origem: pontosIda[i],
      destino: pontosIda[i + 1],
      tipo: 'ida'
    });
  }

  // 4. Montar pares de VOLTA:
  // D_longe -> D_perto
  // D_perto -> Casa
  const destinosInversos = [...destinosOrdenados].reverse();
  const pontosVolta = [...destinosInversos, pontoCasa];
  const paresVolta = [];
  for (let i = 0; i < pontosVolta.length - 1; i++) {
    paresVolta.push({
      origem: pontosVolta[i],
      destino: pontosVolta[i + 1],
      tipo: 'volta'
    });
  }

  // Sequência contínua de waypoints para o Leaflet / Google Maps:
  // [Casa, D1, D2, ..., Dn, Dn-1, ..., D1, Casa]
  const waypointsCompletos = [pontoCasa, ...destinosOrdenados];
  if (destinosOrdenados.length > 1) {
    for (let i = destinosOrdenados.length - 2; i >= 0; i--) {
      waypointsCompletos.push(destinosOrdenados[i]);
    }
  }
  waypointsCompletos.push(pontoCasa);

  return {
    destinosOrdenados,
    waypointsCompletos,
    paresIda,
    paresVolta
  };
}

/**
 * Calcula os custos de cada trecho (Ida e Volta) usando as distâncias reais de rodovia (OSRM)
 */
export function calcularCustosCircuito(sequenciaInfo, mediaKmPorLitro = 10, precoLitroMedio = 5.50, distanciasOSRM = null) {
  const avgKmL = mediaKmPorLitro > 0 ? mediaKmPorLitro : 10;
  const avgPreco = precoLitroMedio > 0 ? precoLitroMedio : 5.50;

  const { destinosOrdenados, waypointsCompletos, paresIda, paresVolta } = sequenciaInfo;

  if (!waypointsCompletos || waypointsCompletos.length < 2) {
    return {
      trechosIda: [],
      trechosVolta: [],
      distanciaIdaKm: 0,
      distanciaVoltaKm: 0,
      distanciaTotalKm: 0,
      custoIdaRS: 0,
      custoVoltaRS: 0,
      custoTotalDiarioRS: 0,
      custoTotalMensalRS: 0,
      googleMapsUrl: '',
      avgKmL,
      avgPreco,
      isDistanciaReal: false
    };
  }

  const todosPares = [...paresIda, ...paresVolta];
  const legsOSRM = distanciasOSRM?.legsKm || null;
  const isDistanciaReal = Array.isArray(legsOSRM) && legsOSRM.length === todosPares.length;

  // Fator de calibração viária sobre linha reta (~1.35x a 1.4x) para quando a API estiver carregando
  const FATOR_VIA_REAL = 1.38;

  let distanciaIdaKm = 0;
  let distanciaVoltaKm = 0;

  const processarTrecho = (par, indiceGlobal) => {
    let distKm = 0;
    if (isDistanciaReal) {
      distKm = legsOSRM[indiceGlobal];
    } else {
      const haversine = calcularDistanciaKm(
        par.origem.latitude,
        par.origem.longitude,
        par.destino.latitude,
        par.destino.longitude
      );
      distKm = haversine * FATOR_VIA_REAL;
    }

    const custoRS = (distKm / avgKmL) * avgPreco;

    return {
      origemNome: par.origem.nome,
      destinoNome: par.destino.nome,
      distanciaKm: distKm,
      custoRS: custoRS,
      origemCoords: { lat: par.origem.latitude, lng: par.origem.longitude },
      destinoCoords: { lat: par.destino.latitude, lng: par.destino.longitude }
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

  const DIAS_UTEIS_MES = 22;
  const custoTotalMensalRS = custoTotalDiarioRS * DIAS_UTEIS_MES;

  const googleMapsUrl = gerarUrlGoogleMaps(waypointsCompletos);

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
    custoTotalMensalRS,
    diasUteis: DIAS_UTEIS_MES,
    googleMapsUrl,
    avgKmL,
    avgPreco,
    isDistanciaReal
  };
}

/**
 * Função de conveniência para calcular o circuito
 */
export function calcularCircuito(casa, rotas = [], mediaKmPorLitro = 10, precoLitroMedio = 5.50, distanciasOSRM = null) {
  const sequenciaInfo = montarSequenciaCircuito(casa, rotas);
  return calcularCustosCircuito(sequenciaInfo, mediaKmPorLitro, precoLitroMedio, distanciasOSRM);
}
