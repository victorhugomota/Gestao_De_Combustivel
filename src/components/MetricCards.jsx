import React from 'react';
import { Gauge, DollarSign, Fuel } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function MetricCards({ 
  mediaKmPorLitro, 
  custoPorKm, 
  precoMedioLitro, 
  totalGastoRS = 0, 
  totalLitrosAbastecidos = 0, 
  dadosGrafico = [] 
}) {
  const Sparkline = ({ color }) => (
    <div className="h-[55px] w-full mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dadosGrafico}>
          <Area 
            type="monotone" 
            dataKey="kmPorLitro" 
            stroke={color} 
            fill={color} 
            fillOpacity={0.15} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Divisão 1: Consumo Médio do Veículo */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Gauge className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-700 text-sm">Média de Consumo</h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Odômetro
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {mediaKmPorLitro > 0 ? mediaKmPorLitro.toFixed(1) : '--'}
            </span>
            <span className="text-sm font-semibold text-emerald-600">km / litro</span>
          </div>

          <p className="text-xs text-gray-500 mt-1.5">
            {mediaKmPorLitro > 0 ? 'Rendimento real calculado entre abastecimentos' : 'Cadastre ao menos 2 abastecimentos'}
          </p>
        </div>

        {dadosGrafico.length > 0 && <Sparkline color="#10b981" />}
      </div>

      {/* Divisão 2: Custo por Quilômetro Rodado */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-700 text-sm">Custo por Km</h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
              Custo / km
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {custoPorKm > 0 ? custoPorKm.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
            </span>
            <span className="text-sm font-semibold text-blue-600">/ km</span>
          </div>

          <p className="text-xs text-gray-500 mt-1.5">
            {custoPorKm > 0 ? 'Gasto estimado para rodar 1 km' : 'Calculado após obter a média de consumo'}
          </p>
        </div>

        {dadosGrafico.length > 0 && <Sparkline color="#3b82f6" />}
      </div>

      {/* Divisão 3: Preço Médio do Litro */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Fuel className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-700 text-sm">Preço Médio do Litro</h3>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Combustível
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {precoMedioLitro > 0 ? precoMedioLitro.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '--'}
            </span>
            <span className="text-sm font-semibold text-amber-600">/ litro</span>
          </div>

          <p className="text-xs text-gray-500 mt-1.5">
            {totalGastoRS > 0 
              ? `${totalLitrosAbastecidos} L abastecidos (${totalGastoRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} total)`
              : 'Registre seus abastecimentos'}
          </p>
        </div>

        {dadosGrafico.length > 0 && <Sparkline color="#f59e0b" />}
      </div>
    </div>
  );
}
