import { useMemo } from 'react';
import { format, differenceInDays } from 'date-fns';

export function useMetricas(abastecimentos) {
  return useMemo(() => {
    const defaultMetrics = {
      mediaKmPorLitro: 0,
      mediaDiaria: { kmPorLitro: 0, gastoRS: 0 },
      mediaSemanal: { kmPorLitro: 0, gastoRS: 0 },
      mediaMensal: { kmPorLitro: 0, gastoRS: 0 },
      historicoPrecos: { gasolina: [], etanol: [] },
      ultimaVariacaoGasolina: 0,
      ultimaVariacaoEtanol: 0,
      dadosGrafico: []
    };

    if (!abastecimentos || abastecimentos.length === 0) {
      return defaultMetrics;
    }

    // Ordenar de forma crescente para o cálculo de métricas
    const ordenados = [...abastecimentos].sort((a, b) => {
      const dataA = a.data?.toDate ? a.data.toDate().getTime() : new Date(a.data).getTime();
      const dataB = b.data?.toDate ? b.data.toDate().getTime() : new Date(b.data).getTime();
      return dataA - dataB;
    });

    let somaKmPorLitro = 0;
    let qtdKmPorLitro = 0;
    let totalGasto = 0;
    
    const historicoPrecosGasolina = [];
    const historicoPrecosEtanol = [];
    const dadosGrafico = [];

    ordenados.forEach((abast, i) => {
      totalGasto += Number(abast.valorTotal || 0);

      const dataObj = abast.data?.toDate ? abast.data.toDate() : new Date(abast.data);
      const dataStr = dataObj instanceof Date && !isNaN(dataObj) ? format(dataObj, 'dd/MM') : '';

      let kmPorLitro = 0;
      if (i > 0) {
        const anterior = ordenados[i - 1];
        const kmRodados = abast.odometroKm - anterior.odometroKm;
        if (kmRodados > 0 && abast.totalLitros > 0) {
          kmPorLitro = kmRodados / abast.totalLitros;
          somaKmPorLitro += kmPorLitro;
          qtdKmPorLitro++;
          
          dadosGrafico.push({
            data: dataStr,
            kmPorLitro: Number(kmPorLitro.toFixed(2)),
            gastoRS: Number(abast.valorTotal || 0)
          });
        }
      }

      const valorLitro = Number(abast.valorLitro || 0);
      const precoItem = { data: dataStr, valorLitro };

      if (abast.tipoCombustivel?.toLowerCase() === 'gasolina') {
        historicoPrecosGasolina.push(precoItem);
      } else if (abast.tipoCombustivel?.toLowerCase() === 'etanol') {
        historicoPrecosEtanol.push(precoItem);
      }
    });

    const mediaKmPorLitro = qtdKmPorLitro > 0 ? somaKmPorLitro / qtdKmPorLitro : 0;

    let dias = 1;
    if (ordenados.length > 1) {
      const primeiraData = ordenados[0].data?.toDate ? ordenados[0].data.toDate() : new Date(ordenados[0].data);
      const ultimaData = ordenados[ordenados.length - 1].data?.toDate ? ordenados[ordenados.length - 1].data.toDate() : new Date(ordenados[ordenados.length - 1].data);
      const diff = differenceInDays(ultimaData, primeiraData);
      dias = diff > 0 ? diff : 1;
    }

    const gastoDiario = totalGasto / dias;

    const mediaDiaria = { kmPorLitro: mediaKmPorLitro, gastoRS: gastoDiario };
    const mediaSemanal = { kmPorLitro: mediaKmPorLitro, gastoRS: gastoDiario * 7 };
    const mediaMensal = { kmPorLitro: mediaKmPorLitro, gastoRS: gastoDiario * 30 };

    const calcVariacao = (historico) => {
      if (historico.length < 2) return 0;
      const ultimo = historico[historico.length - 1].valorLitro;
      const penultimo = historico[historico.length - 2].valorLitro;
      if (penultimo === 0) return 0;
      return ((ultimo - penultimo) / penultimo) * 100;
    };

    return {
      mediaKmPorLitro: Number(mediaKmPorLitro.toFixed(2)),
      mediaDiaria,
      mediaSemanal,
      mediaMensal,
      historicoPrecos: { 
        gasolina: historicoPrecosGasolina, 
        etanol: historicoPrecosEtanol 
      },
      ultimaVariacaoGasolina: calcVariacao(historicoPrecosGasolina),
      ultimaVariacaoEtanol: calcVariacao(historicoPrecosEtanol),
      dadosGrafico
    };
  }, [abastecimentos]);
}
