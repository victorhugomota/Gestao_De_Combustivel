import React, { useMemo } from 'react';
import { Plane, Briefcase, ExternalLink, ArrowRight, Calendar, CalendarDays, Fuel, MapPin } from 'lucide-react';
import { calcularCircuito } from '../utils/rotasUtils';

export default function ViagensPreagendadas({ 
  viagens = [], 
  loading, 
  rotas = [], 
  config,
  circuito: circuitoProp,
  mediaKmPorLitro = 10, 
  abastecimentos = [],
  onCalendarioClick
}) {
  const avgPricePerLiter = useMemo(() => {
    if (!abastecimentos || abastecimentos.length === 0) return 0;
    const ultimos = abastecimentos.slice(0, 5);
    const soma = ultimos.reduce((acc, curr) => acc + Number(curr.valorLitro || 0), 0);
    return soma > 0 ? soma / ultimos.length : 0;
  }, [abastecimentos]);

  const circuito = useMemo(() => {
    if (circuitoProp) return circuitoProp;
    return calcularCircuito(
      {
        latCasa: config?.latCasa ?? -21.2687653,
        lngCasa: config?.lngCasa ?? -47.8197413,
        nomeCasa: config?.nomeCasa || 'Casa'
      },
      rotas,
      {
        mediaKmPorLitro,
        precoLitroMedio: avgPricePerLiter,
        viagens,
        abastecimentos
      }
    );
  }, [circuitoProp, config, rotas, mediaKmPorLitro, avgPricePerLiter, viagens, abastecimentos]);

  const handleAbrirSiteViagens = () => {
    window.open('https://victorhugomota.github.io/SiteDeViagens/', '_blank');
  };

  const temTrechos = circuito && ((circuito.trechosIda && circuito.trechosIda.length > 0) || (circuito.trechosVolta && circuito.trechosVolta.length > 0));

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

        {onCalendarioClick && (
          <button
            onClick={onCalendarioClick}
            className="px-2.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors flex items-center gap-1.5"
            title="Abrir calendário mensal de custos"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendário</span>
          </button>
        )}
      </div>

      <div className="overflow-y-auto space-y-4 pr-1 flex-1">
        
        {/* Card Principal: Ida/Volta Trabalho com Trechos Detalhados (Prints 1 e 2) */}
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
          
          {!temTrechos ? (
            <p className="text-xs text-blue-700/80 italic py-2">
              Cadastre suas rotas de trabalho para visualizar o circuito e custos diários.
            </p>
          ) : (
            <div className="space-y-2.5">
              {/* Trechos de IDA */}
              {circuito.trechosIda && circuito.trechosIda.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-blue-100/70 text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-emerald-800 flex justify-between pb-1 border-b border-gray-100">
                    <span>🟢 IDA (Casa ➔ Trabalho)</span>
                    <span>{circuito.distanciaIdaKm.toFixed(1)} km • {circuito.custoIdaRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  {circuito.trechosIda.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-gray-800 truncate">{t.origemNome}</span>
                        <ArrowRight className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 truncate">{t.destinoNome}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-bold text-emerald-700 block">
                          {t.custoRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                        <span className="text-[10px] text-gray-500">{t.distanciaKm.toFixed(1)} km</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trechos de VOLTA */}
              {circuito.trechosVolta && circuito.trechosVolta.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-blue-100/70 text-xs space-y-1.5">
                  <div className="text-[11px] font-bold text-blue-800 flex justify-between pb-1 border-b border-gray-100">
                    <span>🔵 VOLTA (Trabalho ➔ Casa)</span>
                    <span>{circuito.distanciaVoltaKm.toFixed(1)} km • {circuito.custoVoltaRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                  {circuito.trechosVolta.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center py-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
                        <span className="font-semibold text-gray-800 truncate">{t.origemNome}</span>
                        <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
                        <span className="font-semibold text-gray-800 truncate">{t.destinoNome}</span>
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
              )}

              {/* Totais consolidado Diário e Mensal */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-t border-blue-100">
                <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100/50 flex-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Diário (Ida + Volta)</span>
                  <span className="text-sm font-black text-emerald-900">
                    {circuito.custoTotalDiarioRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="bg-white/90 p-2.5 rounded-xl border border-blue-100/50 flex-1">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">Previsão Mensal ({circuito.previsao?.diasUteisMes ?? 22} dias úteis)</span>
                  <span className="text-sm font-black text-blue-900">
                    {circuito.custoTotalMensalRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Viagens pré-agendadas (SiteDeViagens) */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2.5">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Próximas Viagens (Site de Viagens)
            </h4>
            <button 
              onClick={handleAbrirSiteViagens}
              className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
              title="Abrir Site de Viagens"
            >
              <span>Acessar Site</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6 text-xs text-gray-500">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              Carregando viagens do Site de Viagens...
            </div>
          ) : viagens.length === 0 ? (
            <div 
              onClick={handleAbrirSiteViagens}
              className="flex flex-col items-center justify-center py-6 text-center text-gray-500 bg-gray-50/70 hover:bg-emerald-50/50 cursor-pointer rounded-2xl border border-dashed border-gray-200 p-4 transition-colors group"
            >
              <Plane className="w-7 h-7 mb-2 opacity-40 text-emerald-600 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-bold text-gray-700">Nenhuma viagem agendada no momento</p>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                <span>Clique para planejar uma viagem no Site de Viagens</span>
                <ExternalLink className="w-3 h-3" />
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {viagens.map((viagem, i) => {
                const titulo = viagem.title || viagem.destino || viagem.titulo || 'Viagem Planejada';
                const destino = viagem.destinationAddress || viagem.destino || '';
                const distanciaKm = viagem.transport?.distanceKm || viagem.distancia;
                const combustivelEstimado = viagem.transport?.calculatedFuelCost;
                
                let periodoTexto = '';
                if (viagem.startDate) {
                  const sParts = viagem.startDate.split('T')[0].split('-');
                  const sData = sParts.length === 3 ? `${sParts[2]}/${sParts[1]}/${sParts[0]}` : viagem.startDate;
                  if (viagem.endDate) {
                    const eParts = viagem.endDate.split('T')[0].split('-');
                    const eData = eParts.length === 3 ? `${eParts[2]}/${eParts[1]}/${eParts[0]}` : viagem.endDate;
                    periodoTexto = `${sData} a ${eData}`;
                  } else {
                    periodoTexto = `A partir de ${sData}`;
                  }
                }

                return (
                  <div 
                    key={viagem.id || i}
                    onClick={handleAbrirSiteViagens}
                    className="p-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                          <span>{titulo}</span>
                          <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </h5>
                        {destino && (
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                            <span>{destino}</span>
                          </p>
                        )}
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex-shrink-0">
                        {viagem.status || 'Agendada'}
                      </span>
                    </div>

                    {periodoTexto && (
                      <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mb-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{periodoTexto}</span>
                      </div>
                    )}

                    {viagem.notes && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2 italic">
                        "{viagem.notes}"
                      </p>
                    )}

                    <div className="pt-2 border-t border-emerald-100/70 flex items-center justify-between text-xs">
                      {distanciaKm ? (
                        <span className="text-gray-500 font-medium">
                          {Number(distanciaKm).toFixed(0)} km (ida)
                        </span>
                      ) : (
                        <span className="text-gray-400">Ver no site</span>
                      )}

                      {combustivelEstimado != null && (
                        <div className="flex items-center gap-1 text-emerald-800 font-bold">
                          <Fuel className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Combustível: {Number(combustivelEstimado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
