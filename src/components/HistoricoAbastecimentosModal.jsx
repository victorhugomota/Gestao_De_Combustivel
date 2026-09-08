import React, { useState } from 'react';
import { History, X, Edit2, Trash2, Fuel, Calendar, Gauge, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function HistoricoAbastecimentosModal({
  isOpen,
  onClose,
  abastecimentos = [],
  onEditar,
  onExcluir,
  onNovo
}) {
  const [excluindoId, setExcluindoId] = useState(null);

  if (!isOpen) return null;

  const formatarData = (dataVal) => {
    if (!dataVal) return '--';
    try {
      if (dataVal.toDate) {
        return format(dataVal.toDate(), 'dd/MM/yyyy');
      }
      if (typeof dataVal === 'string' && dataVal.includes('-')) {
        const parts = dataVal.split('-');
        if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
      }
      return format(new Date(dataVal), 'dd/MM/yyyy');
    } catch {
      return String(dataVal);
    }
  };

  const handleConfirmarExclusao = async (id) => {
    try {
      await onExcluir(id);
      setExcluindoId(null);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Histórico de Abastecimentos</h2>
              <p className="text-xs text-gray-500">
                {abastecimentos.length} {abastecimentos.length === 1 ? 'registro encontrado' : 'registros encontrados'} • Gerencie ou edite os abastecimentos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-3">
          {abastecimentos.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto mb-4">
                <Fuel className="w-8 h-8 opacity-60" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Nenhum abastecimento registrado</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                Registre os abastecimentos do seu veículo para calcular as médias de consumo e estimativas de rotas.
              </p>
              {onNovo && (
                <button
                  onClick={() => { onClose(); onNovo(); }}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-sm transition-all"
                >
                  Registrar Agora
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {abastecimentos.map((item) => {
                const isGasolina = (item.tipoCombustivel || '').toLowerCase() === 'gasolina';
                const vLitro = item.valorLitro || (item.totalLitros > 0 ? item.valorTotal / item.totalLitros : 0);

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    {/* Data e Combustível */}
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-600 flex-shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-gray-800 text-sm block">
                          {formatarData(item.data)}
                        </span>
                        <span
                          className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 ${
                            isGasolina
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {item.tipoCombustivel || 'Gasolina'}
                        </span>
                      </div>
                    </div>

                    {/* Odômetro */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[120px]">
                      <Gauge className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-400 block">Odômetro</span>
                        <span className="font-medium text-gray-800">
                          {item.odometroKm != null ? `${Number(item.odometroKm).toLocaleString('pt-BR')} km` : '--'}
                        </span>
                      </div>
                    </div>

                    {/* Litros e Preço/L */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 min-w-[140px]">
                      <Fuel className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-400 block">Volume & Preço/L</span>
                        <span className="font-medium text-gray-800">
                          {Number(item.totalLitros || 0).toFixed(2)} L
                        </span>
                        <span className="text-xs text-gray-500 ml-1">
                          ({vLitro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/L)
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center gap-2 text-sm min-w-[120px]">
                      <DollarSign className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div>
                        <span className="text-xs text-gray-400 block">Valor Total</span>
                        <span className="font-bold text-gray-900 text-base">
                          {Number(item.valorTotal || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <button
                        onClick={() => onEditar(item)}
                        className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1"
                        title="Editar abastecimento"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      {excluindoId === item.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in">
                          <button
                            onClick={() => handleConfirmarExclusao(item.id)}
                            className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors"
                          >
                            Sim, apagar
                          </button>
                          <button
                            onClick={() => setExcluindoId(null)}
                            className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setExcluindoId(item.id)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors"
                          title="Excluir abastecimento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Dica: mantenha os odômetros sempre crescentes para maior precisão das médias.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
