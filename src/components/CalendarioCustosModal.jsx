import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight, Briefcase, Fuel, Plane } from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isWeekend,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { preverMes } from '../utils/previsao';
import { ehDiaUtil } from '../utils/feriados';

export default function CalendarioCustosModal({
  isOpen,
  onClose,
  circuito,
  abastecimentos = [],
  viagens = []
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const custoDiarioTrabalho = circuito?.custoTotalDiarioRS || 0;

  // Gerar dias do calendário para o mês exibido
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Domingo
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = useMemo(() => {
    try {
      return eachDayOfInterval({ start: startDate, end: endDate });
    } catch (e) {
      console.error('Erro ao calcular intervalo de dias:', e);
      return [];
    }
  }, [startDate, endDate]);

  // Mapear abastecimentos por data (formato YYYY-MM-DD)
  const abastecimentosPorDia = useMemo(() => {
    const map = new Map();
    (abastecimentos || []).forEach(abast => {
      try {
        let dataIso = '';
        if (abast.data?.toDate) {
          dataIso = format(abast.data.toDate(), 'yyyy-MM-dd');
        } else if (typeof abast.data === 'string') {
          dataIso = abast.data.split('T')[0];
        } else if (abast.data instanceof Date && !isNaN(abast.data)) {
          dataIso = format(abast.data, 'yyyy-MM-dd');
        }
        if (dataIso) {
          if (!map.has(dataIso)) map.set(dataIso, []);
          map.get(dataIso).push(abast);
        }
      } catch (err) {
        console.warn('Erro ao mapear data do abastecimento:', err);
      }
    });
    return map;
  }, [abastecimentos]);

  // Mapear viagens por data
  const viagensPorDia = useMemo(() => {
    const map = new Map();
    (viagens || []).forEach(v => {
      try {
        let dStr = '';
        if (typeof v.startDate === 'string') {
          dStr = v.startDate.split('T')[0];
        } else if (v.startDate?.toDate) {
          dStr = format(v.startDate.toDate(), 'yyyy-MM-dd');
        }
        if (dStr) {
          if (!map.has(dStr)) map.set(dStr, []);
          map.get(dStr).push(v);
        }
      } catch (err) {
        console.warn('Erro ao mapear data da viagem:', err);
      }
    });
    return map;
  }, [viagens]);

  // Previsão unificada do mês exibido (mesma lógica das outras telas)
  const previsao = useMemo(
    () =>
      preverMes({
        mesReferencia: currentDate,
        custoDiarioTrabalho,
        viagens,
        abastecimentos,
        custoEhEstimativa: circuito?.isConsumoEstimado || circuito?.isPrecoEstimado || !circuito?.isDistanciaReal,
      }),
    [currentDate, custoDiarioTrabalho, viagens, abastecimentos, circuito]
  );

  const diasUteisDoMes = previsao.diasUteisMes;
  const totalGastoTrabalhoMes = previsao.custoTrabalhoMes;

  const totalAbastecidoMes = useMemo(() => {
    return (abastecimentos || []).reduce((acc, curr) => {
      try {
        let dataObj;
        if (curr.data?.toDate) dataObj = curr.data.toDate();
        else if (typeof curr.data === 'string') dataObj = parseISO(curr.data);
        else dataObj = new Date(curr.data);

        if (dataObj && !isNaN(dataObj) && isSameMonth(dataObj, currentDate)) {
          return acc + Number(curr.valorTotal || 0);
        }
      } catch {
        // Ignorar datas inválidas
      }
      return acc;
    }, 0);
  }, [abastecimentos, currentDate]);

  if (!isOpen) return null;

  const nomeMesAno = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
  const nomeMesAnoCapitalized = nomeMesAno.charAt(0).toUpperCase() + nomeMesAno.slice(1);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-6" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header com Navegação de Mês */}
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Calendário de Custos de Combustível</h2>
              <p className="text-xs text-gray-500">
                Acompanhe o custo diário das rotas de trabalho e abastecimentos em cada dia do mês
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200/70">
              <button
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                className="p-1.5 hover:bg-white rounded-xl text-gray-600 hover:text-gray-900 transition-all shadow-none hover:shadow-sm"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-gray-800 px-3 min-w-[140px] text-center">
                {nomeMesAnoCapitalized}
              </span>
              <button
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="p-1.5 hover:bg-white rounded-xl text-gray-600 hover:text-gray-900 transition-all shadow-none hover:shadow-sm"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumo Mensal */}
        <div className="px-6 py-3 bg-gray-50/70 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-3 rounded-2xl border border-gray-200/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Custo Rotas de Trabalho</span>
              <span className="text-sm font-extrabold text-gray-900">
                {totalGastoTrabalhoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-[10px] text-gray-500 ml-1">({diasUteisDoMes} dias úteis)</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-200/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Total Abastecido no Mês</span>
              <span className="text-sm font-extrabold text-gray-900">
                {totalAbastecidoMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-200/60 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-gray-400 block uppercase">Previsão Total do Mês</span>
              <span className="text-sm font-extrabold text-blue-600">
                {previsao.custoTotalPrevisto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
              <span className="text-[10px] text-gray-500 block">
                trabalho + {previsao.custoViagensMes.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em viagens
                {previsao.isEstimativa ? ' • estimativa' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Grade do Calendário */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Dias */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const inCurrentMonth = isSameMonth(day, currentDate);
              const isFimDeSemana = isWeekend(day);
              const isDiaUtil = ehDiaUtil(day);
              const isToday = isSameDay(day, new Date());

              const abastecimentosDoDia = abastecimentosPorDia.get(dayStr) || [];
              const viagensDoDia = viagensPorDia.get(dayStr) || [];

              return (
                <div
                  key={idx}
                  className={`min-h-[85px] sm:min-h-[95px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${
                    !inCurrentMonth 
                      ? 'bg-gray-50/40 border-gray-100 text-gray-300' 
                      : isFimDeSemana
                        ? 'bg-gray-50/80 border-gray-200/60 text-gray-600'
                        : 'bg-white border-gray-200/80 hover:border-emerald-300 hover:shadow-sm'
                  } ${isToday ? 'ring-2 ring-emerald-500 shadow-sm' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${
                      isToday 
                        ? 'w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center' 
                        : inCurrentMonth ? 'text-gray-800' : 'text-gray-300'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {isToday && (
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">Hoje</span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1">
                    {/* Custo estimado da rota em dias úteis (exclui feriados) */}
                    {inCurrentMonth && isDiaUtil && custoDiarioTrabalho > 0 && (
                      <div className="bg-emerald-50 text-emerald-700 font-bold text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-md flex items-center justify-between">
                        <span className="truncate">Rota:</span>
                        <span>{custoDiarioTrabalho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    )}

                    {/* Abastecimento real registrado no dia */}
                    {abastecimentosDoDia.map((ab, i) => (
                      <div 
                        key={i} 
                        className="bg-amber-100/80 text-amber-900 font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 truncate shadow-xs"
                        title={`Abastecimento: ${Number(ab.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${ab.totalLitros}L)`}
                      >
                        <Fuel className="w-2.5 h-2.5 flex-shrink-0 text-amber-700" />
                        <span className="truncate">{Number(ab.valorTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </div>
                    ))}

                    {/* Viagem pré-agendada no dia */}
                    {viagensDoDia.map((v, i) => (
                      <div 
                        key={i} 
                        className="bg-blue-100/90 text-blue-900 font-bold text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 truncate shadow-xs"
                        title={`Viagem: ${v.title || v.destinationAddress}`}
                      >
                        <Plane className="w-2.5 h-2.5 flex-shrink-0 text-blue-700" />
                        <span className="truncate">{v.title || 'Viagem'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legenda e Rodapé */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
              <span>Dia Útil (Deslocamento Trabalho)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span>
              <span>Abastecimento Registrado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-200 border border-blue-400"></span>
              <span>Viagem Agendada</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
