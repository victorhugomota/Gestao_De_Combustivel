import { useMemo } from 'react';
import { parseDataFlexivel } from '../utils/dataUtils';
import { normalizarTipoCombustivel, razaoEficienciaReal } from '../utils/combustivel';

const pad = (n) => String(n).padStart(2, '0');
const rotuloDia = (d) => (d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)}` : '');

export function useMetricas(abastecimentos) {
  return useMemo(() => {
    const base = {
      mediaKmPorLitro: 0,
      custoPorKm: 0,
      precoMedioLitro: 0,
      totalGastoRS: 0,
      totalLitrosAbastecidos: 0,
      totalKmRegistrados: 0,
      qtdAbastecimentos: 0,
      kmLGasolina: 0,
      kmLEtanol: 0,
      razaoEtanolGasolina: null,
      precoAtualGasolina: 0,
      precoAtualEtanol: 0,
      historicoPrecos: { gasolina: [], etanol: [] },
      ultimaVariacaoGasolina: 0,
      ultimaVariacaoEtanol: 0,
      dadosGrafico: [],
      alertasDados: [],
      temDadosSuficientes: false,
    };

    if (!abastecimentos || abastecimentos.length === 0) return base;

    const ordenados = [...abastecimentos]
      .map((a) => ({ ...a, _data: parseDataFlexivel(a.data) }))
      .sort((a, b) => (a._data?.getTime() || 0) - (b._data?.getTime() || 0));

    const alertas = [];
    let totalGasto = 0;
    let totalLitros = 0;

    const historicoPrecosGasolina = [];
    const historicoPrecosEtanol = [];
    const dadosGrafico = [];

    // acumuladores por combustível para consumo
    const consumo = {
      Gasolina: { km: 0, litros: 0 },
      Etanol: { km: 0, litros: 0 },
    };
    let kmTotalValidos = 0;
    let litrosTotalValidos = 0;

    ordenados.forEach((abast, i) => {
      const valorTotal = Number(abast.valorTotal) || 0;
      const litros = Number(abast.totalLitros) || 0;
      const valorLitro =
        Number(abast.valorLitro) > 0
          ? Number(abast.valorLitro)
          : litros > 0
          ? valorTotal / litros
          : 0;
      const tipo = normalizarTipoCombustivel(abast.tipoCombustivel);
      const tanqueCheio = abast.tanqueCheio !== false; // default: considera cheio (compatível com dados antigos)

      totalGasto += valorTotal;
      totalLitros += litros;

      const dataStr = rotuloDia(abast._data);

      if (i > 0) {
        const anterior = ordenados[i - 1];
        const odoAtual = Number(abast.odometroKm) || 0;
        const odoAnterior = Number(anterior.odometroKm) || 0;
        const kmRodados = odoAtual - odoAnterior;
        const tipoAnterior = normalizarTipoCombustivel(anterior.tipoCombustivel);

        if (kmRodados < 0) {
          alertas.push(
            `Odômetro em ${dataStr} (${odoAtual} km) é menor que o anterior (${odoAnterior} km) — registro ignorado no cálculo de consumo.`
          );
        } else if (kmRodados === 0 && litros > 0) {
          alertas.push(`Odômetro repetido em ${dataStr} — sem km rodados para medir consumo.`);
        } else if (kmRodados > 0 && litros > 0) {
          // sanidade: consumo plausível para carro de passeio (3 a 25 km/L)
          const kmL = kmRodados / litros;
          if (kmL > 30 || kmL < 2) {
            alertas.push(
              `Consumo fora do comum em ${dataStr} (${kmL.toFixed(1)} km/L) — verifique odômetro/litros.`
            );
          } else {
            kmTotalValidos += kmRodados;
            litrosTotalValidos += litros;

            // atribui o trecho ao combustível apenas se os dois abastecimentos
            // que delimitam o trecho forem do mesmo tipo (tanque não misturado)
            if (tanqueCheio && tipo === tipoAnterior) {
              consumo[tipo].km += kmRodados;
              consumo[tipo].litros += litros;
            }

            dadosGrafico.push({
              data: dataStr,
              kmPorLitro: Number(kmL.toFixed(2)),
              gastoRS: valorTotal,
              tipo,
            });
          }
        }

        if (!tanqueCheio) {
          // não gera alerta (é escolha do usuário), só não entra no consumo por tipo
        }
      }

      const precoItem = { data: dataStr, valorLitro, _ts: abast._data?.getTime() || 0 };
      if (tipo === 'Gasolina') historicoPrecosGasolina.push(precoItem);
      else if (tipo === 'Etanol') historicoPrecosEtanol.push(precoItem);
    });

    // Consumo médio geral: método odômetro (primeiro x último) com fallback pela soma dos trechos
    let mediaKmPorLitro = 0;
    if (litrosTotalValidos > 0 && kmTotalValidos > 0) {
      mediaKmPorLitro = kmTotalValidos / litrosTotalValidos;
    }

    const kmLGasolina =
      consumo.Gasolina.litros > 0 ? consumo.Gasolina.km / consumo.Gasolina.litros : 0;
    const kmLEtanol = consumo.Etanol.litros > 0 ? consumo.Etanol.km / consumo.Etanol.litros : 0;
    const razaoEtanolGasolina = razaoEficienciaReal(kmLGasolina, kmLEtanol);

    const precoMedioLitro = totalLitros > 0 ? totalGasto / totalLitros : 0;
    const custoPorKm = mediaKmPorLitro > 0 ? precoMedioLitro / mediaKmPorLitro : 0;

    const ultimoPreco = (hist) => (hist.length ? hist[hist.length - 1].valorLitro : 0);
    const calcVariacao = (hist) => {
      if (hist.length < 2) return 0;
      const ult = hist[hist.length - 1].valorLitro;
      const pen = hist[hist.length - 2].valorLitro;
      if (!pen) return 0;
      return ((ult - pen) / pen) * 100;
    };

    const qtd = ordenados.length;

    return {
      mediaKmPorLitro: Number(mediaKmPorLitro.toFixed(2)),
      custoPorKm: Number(custoPorKm.toFixed(2)),
      precoMedioLitro: Number(precoMedioLitro.toFixed(2)),
      totalGastoRS: totalGasto,
      totalLitrosAbastecidos: Number(totalLitros.toFixed(1)),
      totalKmRegistrados: kmTotalValidos,
      qtdAbastecimentos: qtd,
      kmLGasolina: Number(kmLGasolina.toFixed(2)),
      kmLEtanol: Number(kmLEtanol.toFixed(2)),
      razaoEtanolGasolina,
      precoAtualGasolina: ultimoPreco(historicoPrecosGasolina),
      precoAtualEtanol: ultimoPreco(historicoPrecosEtanol),
      historicoPrecos: { gasolina: historicoPrecosGasolina, etanol: historicoPrecosEtanol },
      ultimaVariacaoGasolina: calcVariacao(historicoPrecosGasolina),
      ultimaVariacaoEtanol: calcVariacao(historicoPrecosEtanol),
      dadosGrafico,
      alertasDados: alertas,
      temDadosSuficientes: dadosGrafico.length >= 3,
    };
  }, [abastecimentos]);
}
