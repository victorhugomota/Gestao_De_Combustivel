/**
 * Helpers de data que trabalham sempre no fuso local do usuário.
 *
 * Bug corrigido: `new Date().toISOString().split('T')[0]` devolve a data em UTC.
 * Um abastecimento lançado às 22h (BRT) era gravado no dia seguinte.
 */

const pad = (n) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' no fuso local. */
export function toLocalISODate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Normaliza qualquer formato de data usado no app (Firestore Timestamp,
 * string 'YYYY-MM-DD', string ISO completa, Date) para um Date local à meia-noite.
 * Retorna null se não for possível interpretar.
 */
export function parseDataFlexivel(valor) {
  if (!valor) return null;

  // Firestore Timestamp
  if (typeof valor === 'object' && typeof valor.toDate === 'function') {
    const d = valor.toDate();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  if (valor instanceof Date) {
    if (isNaN(valor)) return null;
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  if (typeof valor === 'string') {
    const somenteData = valor.split('T')[0];
    const m = somenteData.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    const d = new Date(valor);
    if (!isNaN(d)) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  return null;
}

/** 'YYYY-MM-DD' ou similar -> 'DD/MM/YYYY' para exibição. */
export function formatarDataBR(valor) {
  const d = parseDataFlexivel(valor);
  if (!d) return '--';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Diferença em dias inteiros entre duas datas (b - a). */
export function diffDias(a, b) {
  const da = parseDataFlexivel(a);
  const db = parseDataFlexivel(b);
  if (!da || !db) return null;
  return Math.round((db - da) / 86400000);
}
