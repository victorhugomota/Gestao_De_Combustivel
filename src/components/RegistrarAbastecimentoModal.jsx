import React, { useState, useEffect, useMemo } from 'react';
import { Fuel, X, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react';
import { toLocalISODate } from '../utils/dataUtils';
import { normalizarTipoCombustivel } from '../utils/combustivel';

const brl = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function RegistrarAbastecimentoModal({
  isOpen,
  onClose,
  onSubmit,
  ultimoAbastecimento,
  itemParaEditar,
  postos = [],
}) {
  const [data, setData] = useState(toLocalISODate());
  const [odometroKm, setOdometroKm] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [tipoCombustivel, setTipoCombustivel] = useState('Gasolina');
  const [totalLitros, setTotalLitros] = useState('');
  const [tanqueCheio, setTanqueCheio] = useState(true);
  const [posto, setPosto] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (itemParaEditar) {
      let dataFmt = toLocalISODate();
      if (itemParaEditar.data) {
        if (itemParaEditar.data.toDate) dataFmt = toLocalISODate(itemParaEditar.data.toDate());
        else if (typeof itemParaEditar.data === 'string') dataFmt = itemParaEditar.data.split('T')[0];
      }
      setData(dataFmt);
      setOdometroKm(itemParaEditar.odometroKm != null ? String(itemParaEditar.odometroKm) : '');
      setValorTotal(itemParaEditar.valorTotal != null ? String(itemParaEditar.valorTotal) : '');
      setTipoCombustivel(normalizarTipoCombustivel(itemParaEditar.tipoCombustivel));
      setTotalLitros(itemParaEditar.totalLitros != null ? String(itemParaEditar.totalLitros) : '');
      setTanqueCheio(itemParaEditar.tanqueCheio !== false);
      setPosto(itemParaEditar.posto || '');
    } else {
      setData(toLocalISODate());
      setOdometroKm('');
      setValorTotal('');
      setTipoCombustivel('Gasolina');
      setTotalLitros('');
      setTanqueCheio(true);
      setPosto('');
    }
    setErro('');
  }, [itemParaEditar, isOpen]);

  const vTotalNum = parseFloat(valorTotal) || 0;
  const tLitrosNum = parseFloat(totalLitros) || 0;
  const odoNum = parseFloat(odometroKm) || 0;
  const valorLitro = tLitrosNum > 0 ? vTotalNum / tLitrosNum : 0;

  const odoAnterior = !itemParaEditar ? Number(ultimoAbastecimento?.odometroKm) || 0 : 0;

  const avisoOdometro = useMemo(() => {
    if (!odoNum || !odoAnterior) return '';
    const delta = odoNum - odoAnterior;
    if (delta < 0) return `O odômetro informado é menor que o do último abastecimento (${odoAnterior.toLocaleString('pt-BR')} km).`;
    if (delta === 0) return 'Odômetro igual ao do último abastecimento — o consumo deste registro não será calculado.';
    if (delta > 1500) return `Diferença de ${delta.toLocaleString('pt-BR')} km desde o último abastecimento. Confirme se está correto.`;
    return '';
  }, [odoNum, odoAnterior]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    if (!(vTotalNum > 0) || !(tLitrosNum > 0) || !odometroKm) {
      setErro('Preencha odômetro, valor total e litros com valores válidos.');
      return;
    }
    onSubmit(
      {
        data,
        odometroKm: odoNum,
        valorTotal: vTotalNum,
        tipoCombustivel,
        totalLitros: tLitrosNum,
        valorLitro,
        tanqueCheio,
        posto: posto.trim(),
      },
      itemParaEditar?.id
    );
    onClose();
  };

  let comparacao = null;
  if (
    ultimoAbastecimento &&
    normalizarTipoCombustivel(ultimoAbastecimento.tipoCombustivel) === tipoCombustivel &&
    valorLitro > 0 &&
    ultimoAbastecimento.valorLitro > 0
  ) {
    const variacao = ((valorLitro - ultimoAbastecimento.valorLitro) / ultimoAbastecimento.valorLitro) * 100;
    if (variacao > 0.1)
      comparacao = (
        <span className="flex items-center gap-1 text-red-500 text-sm mt-1">
          <ArrowUp className="w-4 h-4" /> Aumento de {variacao.toFixed(1)}%
        </span>
      );
    else if (variacao < -0.1)
      comparacao = (
        <span className="flex items-center gap-1 text-green-500 text-sm mt-1">
          <ArrowDown className="w-4 h-4" /> Redução de {Math.abs(variacao).toFixed(1)}%
        </span>
      );
    else comparacao = <span className="text-gray-500 text-sm mt-1">Sem variação relevante</span>;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Fuel className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-bold text-gray-800">
              {itemParaEditar ? 'Editar Abastecimento' : 'Novo Abastecimento'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
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
              onChange={(e) => setData(e.target.value)}
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
              onChange={(e) => setOdometroKm(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 ${
                avisoOdometro
                  ? 'border-amber-400 focus:ring-amber-400 focus:border-amber-400'
                  : 'border-gray-300 focus:ring-emerald-500 focus:border-emerald-500'
              }`}
            />
            {avisoOdometro && (
              <p className="text-xs text-amber-700 mt-1 flex items-start gap-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {avisoOdometro}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Combustível</label>
            <div className="grid grid-cols-2 gap-3">
              {['Gasolina', 'Etanol'].map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`text-center py-2 px-4 rounded-lg border transition-colors ${
                    tipoCombustivel === t
                      ? t === 'Gasolina'
                        ? 'bg-amber-100 border-amber-500 text-amber-800'
                        : 'bg-green-100 border-green-500 text-green-800'
                      : 'bg-gray-50 border-gray-200 text-gray-600'
                  }`}
                  onClick={() => setTipoCombustivel(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <input
              type="checkbox"
              checked={tanqueCheio}
              onChange={(e) => setTanqueCheio(e.target.checked)}
              className="w-4 h-4 accent-emerald-500"
            />
            <span className="text-sm text-gray-700">
              Enchi o tanque até o final
              <span className="block text-[11px] text-gray-400">
                Necessário para o cálculo correto de consumo (km/L)
              </span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$)</label>
              <input
                type="number"
                required
                step="0.01"
                min="0.01"
                value={valorTotal}
                onChange={(e) => setValorTotal(e.target.value)}
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
                onChange={(e) => setTotalLitros(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Posto (opcional)</label>
            <input
              type="text"
              list="lista-postos"
              placeholder="Ex: Shell Av. Brasil"
              value={posto}
              onChange={(e) => setPosto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
            <datalist id="lista-postos">
              {postos.map((p) => (
                <option key={p.id} value={p.nome} />
              ))}
            </datalist>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor por Litro</label>
            <div className="text-2xl font-bold text-gray-900">{brl(valorLitro)}</div>
            {comparacao && (
              <div className="mt-2 text-sm text-gray-600">
                Comparado ao último abastecimento:
                {comparacao}
              </div>
            )}
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 font-medium shadow-sm"
            >
              {itemParaEditar ? 'Salvar Alterações' : 'Salvar Abastecimento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
