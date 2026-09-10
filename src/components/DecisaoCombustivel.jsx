import React, { useState, useMemo, useEffect } from 'react';
import { Droplets, Fuel, TrendingDown, Info } from 'lucide-react';
import { compararCombustiveis } from '../utils/combustivel';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Cartão "Abastecer com Gasolina ou Etanol?".
 * Usa a regra dos 70% — ou a razão de eficiência real do carro, se já medida.
 */
export default function DecisaoCombustivel({
  precoGasolinaSugerido = 0,
  precoEtanolSugerido = 0,
  razaoEtanolGasolina = null,
  kmLGasolina = 0,
  kmLEtanol = 0,
}) {
  const [precoG, setPrecoG] = useState('');
  const [precoE, setPrecoE] = useState('');

  useEffect(() => {
    if (precoGasolinaSugerido > 0) setPrecoG(String(precoGasolinaSugerido.toFixed(2)));
    if (precoEtanolSugerido > 0) setPrecoE(String(precoEtanolSugerido.toFixed(2)));
  }, [precoGasolinaSugerido, precoEtanolSugerido]);

  const pg = Number(String(precoG).replace(',', '.')) || 0;
  const pe = Number(String(precoE).replace(',', '.')) || 0;

  const resultado = useMemo(
    () => compararCombustiveis(pg, pe, razaoEtanolGasolina),
    [pg, pe, razaoEtanolGasolina]
  );

  const limitePct = (resultado.limite * 100).toFixed(0);
  const precoEquilibrio = pg > 0 ? pg * resultado.limite : 0;
  const atualPct = resultado.percentual != null ? (resultado.percentual * 100).toFixed(1) : null;

  const recEtanol = resultado.recomendado === 'Etanol';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-1">
        <Droplets className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-gray-800">Gasolina ou Etanol?</h2>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        {resultado.baseReal
          ? `Usando o rendimento real do seu carro: etanol faz ${(resultado.limite * 100).toFixed(0)}% do que a gasolina faz.`
          : `Regra dos ${limitePct}%: registre abastecimentos dos dois tipos para calibrar com o consumo real.`}
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="block">
          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
            <Fuel className="w-3.5 h-3.5" /> Gasolina (R$/L)
          </span>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={precoG}
            onChange={(e) => setPrecoG(e.target.value)}
            placeholder="5,89"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
            <Fuel className="w-3.5 h-3.5" /> Etanol (R$/L)
          </span>
          <input
            type="number"
            step="0.01"
            inputMode="decimal"
            value={precoE}
            onChange={(e) => setPrecoE(e.target.value)}
            placeholder="3,99"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none"
          />
        </label>
      </div>

      {resultado.recomendado ? (
        <div
          className={`rounded-2xl p-4 border ${
            recEtanol
              ? 'bg-green-50 border-green-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">Compensa abastecer com</span>
            <span
              className={`text-lg font-black ${recEtanol ? 'text-green-700' : 'text-amber-700'}`}
            >
              {resultado.recomendado}
            </span>
          </div>

          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Proporção etanol/gasolina agora</span>
              <span className="font-semibold">{atualPct}%</span>
            </div>
            <div className="flex justify-between">
              <span>Ponto de equilíbrio (etanol até)</span>
              <span className="font-semibold">{brl(precoEquilibrio)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5" /> Economia por litro-equivalente
              </span>
              <span className="font-bold">{brl(resultado.economiaPorLitroRodadoRS)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-4 bg-gray-50 border border-gray-200 text-sm text-gray-500 flex items-center gap-2">
          <Info className="w-4 h-4 flex-shrink-0" />
          Informe os dois preços para ver a recomendação.
        </div>
      )}

      {(kmLGasolina > 0 || kmLEtanol > 0) && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
            Consumo gasolina: <b className="text-gray-700">{kmLGasolina > 0 ? `${kmLGasolina.toFixed(1)} km/L` : '—'}</b>
          </div>
          <div className="bg-gray-50 rounded-lg px-2 py-1.5">
            Consumo etanol: <b className="text-gray-700">{kmLEtanol > 0 ? `${kmLEtanol.toFixed(1)} km/L` : '—'}</b>
          </div>
        </div>
      )}
    </div>
  );
}
