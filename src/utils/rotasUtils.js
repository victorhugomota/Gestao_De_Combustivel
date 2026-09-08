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

/**
 * Ordena os destinos a partir de Casa por proximidade:
 * Casa -> Destino mais próximo -> Destino seguinte mais distante -> ... -> Retorno para Casa
 */
export function calcularCircuito(casa, rotas = [], mediaKmPorLitro = 10, precoLitroMedio = 5.50) {
  const latCasa = casa?.latCasa || -21.2687653;
  const lngCasa = casa?.lngCasa || -47.8197413;
  const nomeCasa = casa?.nomeCasa || 'Casa - Lar Grécia';

  const avgKmL = mediaKmPorLitro > 0 ? mediaKmPorLitro : 10;
  const avgPreco = precoLitroMedio > 0 ? precoLitroMedio : 5.50;

  if (!rotas || rotas.length === 0) {
    return {
      pontosOrdenados: [],
      waypointsCompletos: [],
      trechos: [],
      distanciaTotalKm: 0,
      custoTotalDiarioRS: 0,
      custoTotalMensalRS: 0,
      avgKmL,
      avgPreco
    };
  }

  // 1. Calcular distância de cada destino até a Casa
  const rotasComDistanciaCasa = rotas.map(r => ({
    ...r,
    distanciaCasaCalculada: calcularDistanciaKm(latCasa, lngCasa, r.latitude, r.longitude)
  }));

  // 2. Ordenar do mais próximo ao mais distante de Casa
  const destinosOrdenados = [...rotasComDistanciaCasa].sort(
    (a, b) => a.distanciaCasaCalculada - b.distanciaCasaCalculada
  );

  // 3. Montar a sequência completa de waypoints:
  // [Casa, Destino 1 (mais próximo), Destino 2, ..., Casa (retorno)]
  const pontoCasa = {
    nome: nomeCasa,
    latitude: latCasa,
    longitude: lngCasa,
    isCasa: true
  };

  const pontosSequencia = [pontoCasa, ...destinosOrdenados, pontoCasa];

  // 4. Calcular cada trecho individual
  const trechos = [];
  let distanciaTotalKm = 0;

  for (let i = 0; i < pontosSequencia.length - 1; i++) {
    const origem = pontosSequencia[i];
    const destino = pontosSequencia[i + 1];

    const distKm = calcularDistanciaKm(
      origem.latitude,
      origem.longitude,
      destino.latitude,
      destino.longitude
    );

    distanciaTotalKm += distKm;

    const custoTrechoRS = (distKm / avgKmL) * avgPreco;

    trechos.push({
      indice: i + 1,
      origemNome: origem.nome,
      destinoNome: destino.nome,
      distanciaKm: distKm,
      custoRS: custoTrechoRS,
      origemCoords: { lat: origem.latitude, lng: origem.longitude },
      destinoCoords: { lat: destino.latitude, lng: destino.longitude },
      isRetorno: i === pontosSequencia.length - 2
    });
  }

  // 5. Custo total diário (ida + paradas intermediárias + volta)
  const custoTotalDiarioRS = (distanciaTotalKm / avgKmL) * avgPreco;

  // 6. Custo mensal estimado considerando 22 dias úteis
  const DIAS_UTEIS_MES = 22;
  const custoTotalMensalRS = custoTotalDiarioRS * DIAS_UTEIS_MES;

  return {
    pontosOrdenados: destinosOrdenados,
    waypointsCompletos: pontosSequencia,
    trechos,
    distanciaTotalKm,
    custoTotalDiarioRS,
    custoTotalMensalRS,
    diasUteis: DIAS_UTEIS_MES,
    avgKmL,
    avgPreco
  };
}
