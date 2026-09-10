import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * Selo padronizado para diferenciar número medido de número estimado.
 * Use `estimado` = true quando o valor depende de constantes-chute
 * (10 km/L, R$ 5,50/L) ou de fallback de distância (haversine).
 */
export default function EstimativaBadge({ estimado, textoReal = 'Dados reais', textoEstimado = 'Estimativa', motivo }) {
  if (estimado) {
    return (
      <span
        title={motivo || 'Valor aproximado — registre mais dados para precisão'}
        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200"
      >
        <AlertTriangle className="w-3 h-3" />
        {textoEstimado}
      </span>
    );
  }
  return (
    <span
      title={motivo || 'Calculado a partir dos seus registros'}
      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"
    >
      <CheckCircle2 className="w-3 h-3" />
      {textoReal}
    </span>
  );
}
