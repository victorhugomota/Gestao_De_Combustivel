/**
 * Feriados nacionais brasileiros (fixos + móveis derivados da Páscoa).
 * Cobrimos apenas os feriados nacionais que caem em dia útil e afetam
 * o deslocamento de trabalho. Feriados municipais/estaduais podem ser
 * adicionados manualmente em `feriadosExtras`.
 */

// Feriados municipais/estaduais adicionais no formato 'MM-DD' ou 'YYYY-MM-DD'.
// Ex.: Ribeirão Preto - 19/06 (aniversário da cidade).
export const feriadosExtras = ['06-19'];

/** Domingo de Páscoa pelo algoritmo de Meeus/Jones/Butcher. */
export function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function addDias(data, dias) {
  const nova = new Date(data);
  nova.setDate(nova.getDate() + dias);
  return nova;
}

const pad = (n) => String(n).padStart(2, '0');
const chave = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Retorna um Set com as datas 'YYYY-MM-DD' de todos os feriados nacionais do ano. */
export function feriadosDoAno(ano) {
  const pascoa = calcularPascoa(ano);
  const fixos = [
    new Date(ano, 0, 1), // Confraternização Universal
    new Date(ano, 3, 21), // Tiradentes
    new Date(ano, 4, 1), // Dia do Trabalho
    new Date(ano, 8, 7), // Independência
    new Date(ano, 9, 12), // Nossa Senhora Aparecida
    new Date(ano, 10, 2), // Finados
    new Date(ano, 10, 15), // Proclamação da República
    new Date(ano, 11, 25), // Natal
  ];
  const moveis = [
    addDias(pascoa, -47), // Carnaval (terça)
    addDias(pascoa, -46), // Quarta-feira de Cinzas (ponto facultativo, mas contamos)
    addDias(pascoa, -2), // Sexta-feira Santa
    addDias(pascoa, 60), // Corpus Christi
  ];

  const set = new Set([...fixos, ...moveis].map(chave));

  feriadosExtras.forEach((f) => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(f)) set.add(f);
    else if (/^\d{2}-\d{2}$/.test(f)) set.add(`${ano}-${f}`);
  });

  return set;
}

/** true se a data (Date) for feriado nacional. */
export function ehFeriado(data) {
  return feriadosDoAno(data.getFullYear()).has(chave(data));
}

/** true se for sábado ou domingo. */
export function ehFimDeSemana(data) {
  const d = data.getDay();
  return d === 0 || d === 6;
}

/** true se for dia útil (não fim de semana e não feriado). */
export function ehDiaUtil(data) {
  return !ehFimDeSemana(data) && !ehFeriado(data);
}

/**
 * Conta dias úteis num intervalo [inicio, fim] inclusive.
 * inicio/fim são Date.
 */
export function contarDiasUteis(inicio, fim) {
  let count = 0;
  const cursor = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate());
  const limite = new Date(fim.getFullYear(), fim.getMonth(), fim.getDate());
  while (cursor <= limite) {
    if (ehDiaUtil(cursor)) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}
