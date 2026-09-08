import React, { useMemo } from 'react';
import { Plane, Briefcase, Link as LinkIcon, ArrowRight, Calendar, DollarSign } from 'lucide-react';
import { calcularCircuito } from '../utils/rotasUtils';

export default function ViagensPreagendadas({ 
  viagens = [], 
  loading, 
  rotas = [], 
  config,
  circuito: circuitoProp,
  mediaKmPorLitro = 10, 
  abastecimentos = [] 
}) {
  const avgPricePerLiter = useMemo(() => {
    if (!abastecimentos || abastecimentos.length === 0) return 5.50;
    const ultimos = abastecimentos.slice(0, 5);
    const soma = ultimos.reduce((acc, curr) => acc + Number(curr.valorLitro || 0), 0);
    return soma > 0 ? soma / ultimos.length : 5.50;
  }, [abastecimentos]);

  const avgKmL = mediaKmPorLitro > 0 ? mediaKmPorLitro : 10;

  const circuito = useMemo(() => {
    if (circuitoProp) return circuitoProp;
    return calcularCircuito(
      {
        latCasa: config?.latCasa || -21.2687653,
        lngCasa: config?.lngCasa || -47.8197413,
        nomeCasa: config?.nomeCasa || 'Casa - Lar Grécia'
      },
      rotas,
      avgKmL,
      avgPricePerLiter
    );
  }, [circuitoProp, config, rotas, avgKmL, avgPricePerLiter]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Plane className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Viagens & Rotas</h2>
            <p className="text-xs text-gray-500">Estimativas de deslocamento e viagens</p>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto space-y-4 pr-1 flex-1">
        
        {/* Card Principal: Ida/Volta Trabalho com Trechos Detalhados (Prints 3 e 4) */}
        <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-600 text-white shadow-sm">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-blue-950 text-sm">Ida/Volta Trabalho</h3>
                <span className="text-[11px] text-blue-700/80 font-medium">Circuito diário consolidado</span>
              </div>
            </div>
            {circuito && circuito.distanciaTotalKm > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {circuito.distanciaTotalKm.toFixed(1)} km / dia
              </span>
            )}
          </div>
          
          {rotas.length === 0 ? (
            <p className="text-xs text-blue-700/80 italic py-2">
              Cadastre suas rotas de trabalho para visualizar o circuito e custos diários.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Trechos individuais com valores (Print 3) */}
              <div className="space-y-1.5 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-blue-100/60 text-xs">
                {circuito.trechos.map((t, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1 border-b border-blue-50 last:border-0 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                      <span className="font-semibold text-blue-900 truncate">{t.origemNome}</span>
                      <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                      <span className="font-semibold text-blue-900 truncate">{t.destinoNome}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-blue-700 block">
                        {t.custoRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      <span className="text-[10px] text-gray-500">{t.distanciaKm.toFixed(1)} km</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totais consolidado Diário e Mensal (Print 4) */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-blue-100">
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/50 flex-1">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Custo Total por Dia</span>
                  <span className="text-sm font-black text-blue-900">
                    {circuito.custoTotalDiarioRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="bg-white/80 p-2.5 rounded-xl border border-blue-100/50 flex-1">
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">Previsão Mensal (22 dias)</span>
                  <span className="text-sm font-black text-indigo-900">
                    {circuito.custoTotalMensalRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Viagens pré-agendadas (SiteDeViagens) */}
        <div className="pt-1">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5">
            Viagens Integradas
          </h4>

          {loading ? (
            <div className="text-center py-4 text-xs text-gray-500">Carregando viagens integradas...</div>
          ) : viagens.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200 p-4">
              <LinkIcon className="w-7 h-7 mb-2 opacity-40 text-gray-400" />
              <p className="text-xs font-medium text-gray-600">Site de Viagens conectado</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Nenhuma viagem com data futura no momento.</p>
            </div>
          ) : (
            viagens.map((viagem, i) => {
              let costText = '';
              if (viagem.distancia) {
                const tripCost = ((viagem.distancia * 2) / avgKmL) * avgPricePerLiter;
                costText = tripCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
              }
              
              const isUpcoming = !viagem.status || viagem.status !== 'concluida';

              return (
                <div key={i} className={`p-3.5 rounded-2xl border ${isUpcoming ? 'bg-emerald-50/70 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex justify-between items-start mb-1.5">
                    <h5 className="font-bold text-gray-900 text-sm">{viagem.destino || viagem.titulo || viagem.nome || 'Viagem'}</h5>
                    {viagem.status && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUpcoming ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                        {viagem.status}
                      </span>
                    )}
                  </div>
                  {(viagem.dataIda || viagem.dataVolta) && (
                    <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{viagem.dataIda || ''} {viagem.dataVolta ? 'a ' + viagem.dataVolta : ''}</span>
                    </div>
                  )}
                  {viagem.descricao && <p className="text-xs text-gray-600 mb-2">{viagem.descricao}</p>}
                  {costText && (
                    <div className="text-xs font-bold text-emerald-800 pt-1.5 border-t border-emerald-100 mt-1 flex items-center justify-between">
                      <span className="text-gray-500 font-normal">Custo est. combustível:</span>
                      <span>{costText}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
