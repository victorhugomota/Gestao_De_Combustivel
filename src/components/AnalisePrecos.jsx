import React from 'react';
import { TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function AnalisePrecos({ abastecimentos, historicoPrecos = { gasolina: [], etanol: [] }, ultimaVariacaoGasolina, ultimaVariacaoEtanol }) {
  const getPrecoMaisRecente = (tipo) => {
    if (!abastecimentos || !abastecimentos.length) return null;
    return abastecimentos.find(a => (a.tipoCombustivel || '').toLowerCase() === tipo.toLowerCase());
  };

  const getHistorico = (tipo) => {
    const key = tipo.toLowerCase();
    const hist = historicoPrecos[key] || [];
    return hist.slice(-5).reverse();
  };

  const RenderSecao = ({ tipo, maisRecente, variacao, historico, colorClasses }) => {
    if (!maisRecente) return <div className="text-sm text-gray-500 italic mt-2">Nenhum registro para {tipo.toLowerCase()}</div>;

    return (
      <div className="flex-1">
        <h3 className="font-semibold text-gray-700 mb-2">{tipo}</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl font-bold text-gray-900">
            {maisRecente.valorLitro ? maisRecente.valorLitro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00'}
          </div>
          {variacao != null && variacao !== 0 && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              variacao > 0 ? 'bg-red-100 text-red-700' : variacao < 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
            }`}>
              {variacao > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : variacao < 0 ? <ArrowDown className="w-3 h-3 mr-1" /> : <Minus className="w-3 h-3 mr-1" />}
              {Math.abs(variacao).toFixed(1)}%
            </div>
          )}
        </div>
        <div className="space-y-2">
          {historico.length > 0 ? historico.map((h, i) => (
            <div key={i} className="flex justify-between items-center text-sm border-b border-gray-50 pb-1">
              <span className="text-gray-500">{h.data}</span>
              <span className={`font-medium ${colorClasses.text}`}>{(h.valorLitro || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          )) : (
            <div className="text-sm text-gray-500">Apenas um registro.</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-gray-800">Análise de Preços</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-8 md:gap-4">
        <RenderSecao 
          tipo="Gasolina" 
          maisRecente={getPrecoMaisRecente('Gasolina')}
          variacao={ultimaVariacaoGasolina}
          historico={getHistorico('Gasolina')}
          colorClasses={{ text: 'text-amber-600' }}
        />
        <div className="hidden md:block w-px bg-gray-100"></div>
        <RenderSecao 
          tipo="Etanol" 
          maisRecente={getPrecoMaisRecente('Etanol')}
          variacao={ultimaVariacaoEtanol}
          historico={getHistorico('Etanol')}
          colorClasses={{ text: 'text-green-600' }}
        />
      </div>
    </div>
  );
}
