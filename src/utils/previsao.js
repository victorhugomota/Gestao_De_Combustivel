/**
 * Módulo ÚNICO de previsão de gastos mensais.
 *
 * Antes existiam dois cálculos divergentes: `rotasUtils` usava 22 dias fixos
 * e o calendário filtrava só fins de semana. Agora todas as telas chamam
 * `preverMes()`.
 *
 * Considera:
 *  - dias úteis reais do mês (exclui fins de semana E feriados nacionais)
 *  - mês corrente parcial (dias já decorridos x restantes)
 *  - viagens agendadas dentro do mês
 *  - faixa de incerteza quando o consumo/preço ainda tem poucas amostras
 */

import { contarDiasUteis, ehDiaUtil } from './feriados';
import { parseDataFlexivel } from './dataUtils';

/**
 * @param {Object} opts
 * @param {Date}   opts.mesReferencia  qualquer data dentro do mês desejado
 * @param {number} opts.custoDiarioTrabalho  R$/dia útil (circuito ida+volta)
 * @param {Array}  [opts.viagens]  viagens agendadas ({startDate, endDate, transport})
 * @param {Array}  [opts.abastecimentos]  usado só para medir confiança
 * @param {boolean}[opts.custoEhEstimativa]  true se o custo diário veio de constantes-chute
 * @param {Date}   [opts.hoje]  injeção para testes
 */
export function preverMes({
  mesReferencia = new Date(),
  custoDiarioTrabalho = 0,
  viagens = [],
  abastecimentos = [],
  custoEhEstimativa = false,
  hoje = new Date(),
}) {
  const ano = mesReferencia.getFullYear();
  const mes = mesReferencia.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const diasUteisMes = contarDiasUteis(primeiroDia, ultimoDia);

  // Particionar em decorridos x restantes se for o mês corrente
  const ehMesCorrente = hoje.getFullYear() === ano && hoje.getMonth() === mes;
  const ehMesPassado =
    hoje.getFullYear() > ano || (hoje.getFullYear() === ano && hoje.getMonth() > mes);

  let diasUteisDecorridos = 0;
  let diasUteisRestantes = diasUteisMes;

  if (ehMesPassado) {
    diasUteisDecorridos = diasUteisMes;
    diasUteisRestantes = 0;
  } else if (ehMesCorrente) {
    const ontem = new Date(ano, mes, hoje.getDate());
    diasUteisDecorridos = contarDiasUteis(primeiroDia, ontem);
    // o próprio dia de hoje conta como restante se ainda for útil
    diasUteisRestantes = diasUteisMes - diasUteisDecorridos;
  } else {
    // mês futuro: tudo restante
    diasUteisDecorridos = 0;
    diasUteisRestantes = diasUteisMes;
  }

  const custoTrabalhoMes = diasUteisMes * custoDiarioTrabalho;
  const custoTrabalhoRestante = diasUteisRestantes * custoDiarioTrabalho;

  // Viagens agendadas que começam dentro do mês
  const viagensDoMes = (viagens || []).filter((v) => {
    const d = parseDataFlexivel(v.startDate || v.dataInicio || v.data);
    return d && d.getFullYear() === ano && d.getMonth() === mes;
  });

  const custoViagensMes = viagensDoMes.reduce((acc, v) => {
    const custo =
      Number(v.transport?.calculatedFuelCost) ||
      Number(v.custoCombustivel) ||
      Number(v.combustivelEstimado) ||
      0;
    return acc + custo;
  }, 0);

  const custoTotalPrevisto = custoTrabalhoMes + custoViagensMes;

  // Confiança: nº de abastecimentos completos com odômetro
  const amostras = (abastecimentos || []).filter(
    (a) => Number(a.odometroKm) > 0 && Number(a.totalLitros) > 0
  ).length;

  let incertezaPct;
  if (custoEhEstimativa || amostras < 2) incertezaPct = 0.4;
  else if (amostras < 4) incertezaPct = 0.25;
  else if (amostras < 8) incertezaPct = 0.15;
  else incertezaPct = 0.08;

  const faixaMin = custoTotalPrevisto * (1 - incertezaPct);
  const faixaMax = custoTotalPrevisto * (1 + incertezaPct);

  return {
    ano,
    mes,
    diasUteisMes,
    diasUteisDecorridos,
    diasUteisRestantes,
    ehMesCorrente,
    ehMesPassado,
    custoDiarioTrabalho,
    custoTrabalhoMes,
    custoTrabalhoRestante,
    viagensDoMes,
    custoViagensMes,
    custoTotalPrevisto,
    incertezaPct,
    faixaMin,
    faixaMax,
    confiancaAmostras: amostras,
    isEstimativa: custoEhEstimativa || amostras < 4,
  };
}

/** Projeção anual simples (12x o mês típico, sem feriados de fim de ano ponderados). */
export function preverAno({ custoDiarioTrabalho = 0, viagens = [], abastecimentos = [] }) {
  const hoje = new Date();
  let total = 0;
  const meses = [];
  for (let m = 0; m < 12; m++) {
    const p = preverMes({
      mesReferencia: new Date(hoje.getFullYear(), m, 1),
      custoDiarioTrabalho,
      viagens,
      abastecimentos,
    });
    meses.push(p);
    total += p.custoTotalPrevisto;
  }
  return { total, meses };
}

export { ehDiaUtil };
