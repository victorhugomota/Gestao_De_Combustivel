import React, { useState } from 'react';
import { Fuel, X, ArrowUp, ArrowDown } from 'lucide-react';

export default function RegistrarAbastecimentoModal({ isOpen, onClose, onSubmit, ultimoAbastecimento }) {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [odometroKm, setOdometroKm] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('Gasolina');
  const [totalLitros, setTotalLitros] = useState('');
  
  if (!isOpen) return null;

  const vTotalNum = parseFloat(valorTotal) || 0;
  const tLitrosNum = parseFloat(totalLitros) || 0;
  const valorLitro = tLitrosNum > 0 ? (vTotalNum / tLitrosNum) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (vTotalNum > 0 && tLitrosNum > 0 && odometroKm) {
      onSubmit({
        data,
        odometroKm: parseFloat(odometroKm),
        valorTotal: vTotalNum,
        tipoCombustivel,
        totalLitros: tLitrosNum,
        valorLitro
      });
      // Reset form
      setData(new Date().toISOString().split('T')[0]);
      setOdometroKm('');
      setValorTotal('');
      setTipoCombustivel('Gasolina');
      setTotalLitros('');
    }
  };

  let comparacaoElement = null;
  if (ultimoAbastecimento && ultimoAbastecimento.tipoCombustivel === tipoCombustivel && valorLitro > 0) {
    const ultimoValorLitro = ultimoAbastecimento.valorLitro;
    if (ultimoValorLitro > 0) {
      const variacao = ((valorLitro - ultimoValorLitro) / ultimoValorLitro) * 100;
      if (variacao > 0) {
        comparacaoElement = (
          <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
            <ArrowUp className="w-4 h-4" />
            <span>Aumento de {variacao.toFixed(1)}%</span>
          </div>
        );
      } else if (variacao < 0) {
        comparacaoElement = (
          <div className="flex items-center gap-1 text-green-500 text-sm mt-1">
            <ArrowDown className="w-4 h-4" />
            <span>Redução de {Math.abs(variacao).toFixed(1)}%</span>
          </div>
        );
      } else {
        comparacaoElement = <div className="text-gray-500 text-sm mt-1">Sem variação</div>;
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Fuel className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-gray-800">Novo Abastecimento</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input 
              type="date" 
              required
              value={data}
              onChange={e => setData(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Odômetro (km)</label>
            <input 
              type="number"
              required
              step="0.1"
              placeholder="Ex: 45230.5"
              value={odometroKm}
              onChange={e => setOdometroKm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Combustível</label>
            <div className="grid grid-cols-2 gap-3">
              <div 
                className={`cursor-pointer text-center py-2 px-4 rounded-lg border transition-colors ${tipoCombustivel === 'Gasolina' ? 'bg-amber-100 border-amber-500 text-amber-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                onClick={() => setTipoCombustivel('Gasolina')}
              >
                Gasolina
              </div>
              <div 
                className={`cursor-pointer text-center py-2 px-4 rounded-lg border transition-colors ${tipoCombustivel === 'Etanol' ? 'bg-green-100 border-green-500 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                onClick={() => setTipoCombustivel('Etanol')}
              >
                Etanol
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
              <input 
                type="number"
                required
                step="0.01"
                min="0.01"
                value={valorTotal}
                onChange={e => setValorTotal(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total de Litros</label>
              <input 
                type="number"
                required
                step="0.01"
                min="0.01"
                value={totalLitros}
                onChange={e => setTotalLitros(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Litro</label>
            <div className="text-2xl font-bold text-gray-900">
              {valorLitro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            {ultimoAbastecimento && (
              <div className="mt-2 text-sm text-gray-600">
                Comparado ao último abastecimento:
                {comparacaoElement}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium"
            >
              Salvar Abastecimento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
