import React from 'react';
import { Plane, Briefcase, Link as LinkIcon } from 'lucide-react';

export default function ViagensPreagendadas({ viagens = [], loading, rotas = [], mediaKmPorLitro, abastecimentos = [] }) {
  
  const last5 = abastecimentos.slice(0, 5);
  const avgPricePerLiter = last5.length > 0
    ? last5.reduce((acc, curr) => acc + curr.valorLitro, 0) / last5.length
    : 5.5;
  const avgKmL = mediaKmPorLitro > 0 ? mediaKmPorLitro : 10;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col max-h-[600px]">
      <div className="flex items-center gap-2 mb-6">
        <Plane className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-gray-800">Viagens Pré-agendadas</h2>
      </div>

      <div className="overflow-y-auto space-y-4 pr-2 flex-1">
        
        {/* Default route card: Ida/Volta Trabalho */}
        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-blue-900">Ida/Volta Trabalho</h3>
          </div>
          
          <div className="space-y-3">
            {rotas.length === 0 ? (
              <p className="text-sm text-blue-700 italic">Cadastre suas rotas de trabalho para ver a previsão.</p>
            ) : (
              rotas.map((rota, i) => {
                const dailyCost = ((rota.distanciaCasaKm * 2) / avgKmL) * avgPricePerLiter;
                return (
                  <div key={i} className="flex justify-between items-center text-sm bg-white bg-opacity-60 p-2 rounded-lg">
                    <span className="font-medium text-blue-800">{rota.nome}</span>
                    <span className="text-blue-600 font-semibold">{dailyCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'})}/dia</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Other trips from integration */}
        {loading ? (
          <div className="text-center py-4 text-sm text-gray-500">Carregando viagens...</div>
        ) : viagens.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <LinkIcon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">Conecte o Site de Viagens para ver viagens pré-agendadas</p>
          </div>
        ) : (
          viagens.map((viagem, i) => {
            let costText = '';
            if (viagem.distancia) {
              const tripCost = ((viagem.distancia * 2) / avgKmL) * avgPricePerLiter;
              costText = tripCost.toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
            }
            
            const isUpcoming = !viagem.status || viagem.status !== 'concluida';

            return (
              <div key={i} className={`p-4 rounded-xl border ${isUpcoming ? 'bg-emerald-50 border-emerald-100' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-800">{viagem.destino || viagem.titulo || viagem.nome || 'Viagem'}</h4>
                  {viagem.status && (
                    <span className={`text-xs px-2 py-1 rounded-full ${isUpcoming ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                      {viagem.status}
                    </span>
                  )}
                </div>
                {(viagem.dataIda || viagem.dataVolta) && (
                  <div className="text-xs text-gray-500 mb-2">
                    {viagem.dataIda && <span>Ida: {viagem.dataIda}</span>}
                    {viagem.dataIda && viagem.dataVolta && <span> | </span>}
                    {viagem.dataVolta && <span>Volta: {viagem.dataVolta}</span>}
                  </div>
                )}
                {viagem.descricao && <p className="text-sm text-gray-600 mb-2">{viagem.descricao}</p>}
                {costText && (
                  <div className="text-sm font-semibold text-emerald-700 pt-2 border-t border-emerald-100/50 mt-2">
                    Custo est. comb.: {costText}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
