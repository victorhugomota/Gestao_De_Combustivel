/**
 * Lógica de combustível: normalização de tipo, regra dos 70%
 * (etanol vs gasolina) e comparação por consumo real quando disponível.
 */

export const TIPOS_COMBUSTIVEL = ['Gasolina', 'Etanol'];

/** Normaliza 'gasolina', 'GASOLINA', ' Gasolina ' -> 'Gasolina'. */
export function normalizarTipoCombustivel(valor) {
  const t = String(valor || '').trim().toLowerCase();
  if (t.startsWith('gaso')) return 'Gasolina';
  if (t.startsWith('etan') || t.startsWith('alco') || t === 'e100') return 'Etanol';
  return 'Gasolina';
}

/**
 * Regra clássica: o etanol compensa quando seu preço é até ~70% do preço
 * da gasolina (o etanol rende ~30% menos por litro num flex típico).
 *
 * Quando o app já tem consumo real medido para cada combustível, usamos
 * a razão real de eficiência no lugar do 0,70 fixo.
 *
 * @param {number} precoGasolina  R$/L
 * @param {number} precoEtanol    R$/L
 * @param {number} [razaoEficiencia=0.70]  kmL_etanol / kmL_gasolina
 * @returns {{
 *   recomendado: 'Etanol'|'Gasolina'|null,
 *   percentual: number|null,          // preço etanol / preço gasolina (0-1)
 *   limite: number,                   // razão de equilíbrio usada
 *   economiaPorLitroRodadoRS: number|null, // diferença de custo por km equivalente
 *   custoKmGasolina: number|null,
 *   custoKmEtanol: number|null,
 *   baseReal: boolean                 // se usou consumo medido
 * }}
 */
export function compararCombustiveis(precoGasolina, precoEtanol, razaoEficiencia) {
  const pg = Number(precoGasolina) || 0;
  const pe = Number(precoEtanol) || 0;

  const razaoValida = Number(razaoEficiencia) > 0 && Number(razaoEficiencia) < 1.2;
  const limite = razaoValida ? Number(razaoEficiencia) : 0.7;
  const baseReal = razaoValida;

  if (pg <= 0 || pe <= 0) {
    return {
      recomendado: null,
      percentual: null,
      limite,
      economiaPorLitroRodadoRS: null,
      custoKmGasolina: null,
      custoKmEtanol: null,
      baseReal,
    };
  }

  const percentual = pe / pg;
  const recomendado = percentual <= limite ? 'Etanol' : 'Gasolina';

  // Custo relativo para percorrer a mesma distância.
  // Referência: 1 unidade de distância com gasolina custa `pg`.
  // Com etanol, para a mesma distância, gasta 1/limite litros -> custa pe / limite.
  const custoRelGasolina = pg;
  const custoRelEtanol = pe / limite;
  const economiaPorLitroRodadoRS = Math.abs(custoRelGasolina - custoRelEtanol);

  return {
    recomendado,
    percentual,
    limite,
    economiaPorLitroRodadoRS,
    custoKmGasolina: custoRelGasolina,
    custoKmEtanol: custoRelEtanol,
    baseReal,
  };
}

/**
 * A partir do consumo médio real por combustível, deriva a razão de
 * eficiência etanol/gasolina. Se faltar dado de um dos lados, retorna null.
 */
export function razaoEficienciaReal(kmLGasolina, kmLEtanol) {
  const g = Number(kmLGasolina) || 0;
  const e = Number(kmLEtanol) || 0;
  if (g <= 0 || e <= 0) return null;
  const r = e / g;
  // Sanidade: um flex real fica entre 0,6 e 0,85. Fora disso provavelmente
  // é ruído de poucas amostras -> ignoramos.
  if (r < 0.55 || r > 0.9) return null;
  return r;
}
