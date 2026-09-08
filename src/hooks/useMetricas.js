import { useMemo } from 'react';
import { format } from 'date-fns';

export function useMetricas(abastecimentos) {
  return useMemo(() => {
    const defaultMetrics = {
      mediaKmPorLitro: 0,
      custoPorKm: 0,
      precoMedioLitro: 0,
      totalGastoRS: 0,
      totalLitrosAbastecidos: 0,
      totalKmRegistrados: 0,
      qtdAbastecimentos: 0,
      historicoPrecos: { gasolina: [], etanol: [] },
      ultimaVariacaoGasolina: 0,
      ultimaVariacaoEtanol: 0,
      dadosGrafico: []
    };

    if (!abastecimentos || abastecimentos.length === 0) {
      return defaultMetrics;
    }

    // Ordenar de forma crescente por data para cálculo correto
    const ordenados = [...abastecimentos].sort((a, b) => {
      const dataA = a.data?.toDate ? a.data.toDate().getTime() : new Date(a.data).getTime();
      const dataB = b.data?.toDate ? b.data.toDate().getTime() : new Date(b.data).getTime();
      return dataA - dataB;
    });

    let totalGasto = 0;
    let totalLitros = 0;
    let somaKmPorLitro = 0;
    let qtdCalculosKmL = 0;
    
    const historicoPrecosGasolina = [];
    const historicoPrecosEtanol = [];
    const dadosGrafico = [];

    ordenados.forEach((abast, i) => {
      const valorTotal = Number(abast.valorTotal || 0);
      const litros = Number(abast.totalLitros || 0);
      const valorLitro = Number(abast.valorLitro || (litros > 0 ? valorTotal / litros : 0));

      totalGasto += valorTotal;
      totalLitros += litros;

      const dataObj = abast.data?.toDate ? abast.data.toDate() : new Date(abast.data);
      const dataStr = dataObj instanceof Date && !isNaN(dataObj) ? format(dataObj, 'dd/MM') : '';

      // Cálculo de consumo com base na diferença do odômetro entre abastecimentos consecutivos
      let kmPorLitro = 0;
      if (i > 0) {
        const anterior = ordenados[i - 1];
        const kmRodados = Number(abast.odometroKm || 0) - Number(anterior.odometroKm || 0);

        if (kmRodados > 0 && litros > 0) {
          kmPorLitro = kmRodados / litros;
          somaKmPorLitro += kmPorLitro;
          qtdCalculosKmL++;

          dadosGrafico.push({
            data: dataStr,
            kmPorLitro: Number(kmPorLitro.toFixed(2)),
            gastoRS: valorTotal
          });
        }
      }

      const precoItem = { data: dataStr, valorLitro };
      const tipo = (abast.tipoCombustivel || '').toLowerCase();
      if (tipo === 'gasolina') {
        historicoPrecosGasolina.push(precoItem);
      } else if (tipo === 'etanol') {
        historicoPrecosEtanol.push(precoItem);
      }
    });

    // Média real de consumo em km/L
    let mediaKmPorLitro = 0;
    if (ordenados.length > 1) {
      const primeiroOdometro = Number(ordenados[0].odometroKm || 0);
      const ultimoOdometro = Number(ordenados[ordenados.length - 1].odometroKm || 0);
      const kmTotal = ultimoOdometro - primeiroOdometro;
      
      // Soma dos litros do 2º abastecimento em diante (que completaram os km rodados)
      const litrosConsumidos = ordenados.slice(1).reduce((acc, curr) => acc + Number(curr.totalLitros || 0), 0);

      if (kmTotal > 0 && litrosConsumidos > 0) {
        mediaKmPorLitro = kmTotal / litrosConsumidos;
      } else if (qtdCalculosKmL > 0) {
        mediaKmPorLitro = somaKmPorLitro / qtdCalculosKmL;
      }
    } else if (ordenados.length === 1 && qtdCalculosKmL > 0) {
      mediaKmPorLitro = somaKmPorLitro / qtdCalculosKmL;
    }

    // Preço médio pago por litro
    const precoMedioLitro = totalLitros > 0 ? totalGasto / totalLitros : 0;

    // Custo por quilômetro rodado (R$ / km)
    const custoPorKm = mediaKmPorLitro > 0 ? precoMedioLitro / mediaKmPorLitro : 0;

    const calcVariacao = (historico) => {
      if (historico.length < 2) return 0;
      const ultimo = historico[historico.length - 1].valorLitro;
      const penultimo = historico[historico.length - 2].valorLitro;
      if (penultimo === 0) return 0;
      return ((ultimo - penultimo) / penultimo) * 100;
    };

    return {
      mediaKmPorLitro: Number(mediaKmPorLitro.toFixed(2)),
      custoPorKm: Number(custoPorKm.toFixed(2)),
      precoMedioLitro: Number(precoMedioLitro.toFixed(2)),
      totalGastoRS: totalGasto,
      totalLitrosAbastecidos: Number(totalLitros.toFixed(1)),
      qtdAbastecimentos: ordenados.length,
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
