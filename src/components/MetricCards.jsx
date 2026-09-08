import React from 'react';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

export default function MetricCards({ mediaDiaria, mediaSemanal, mediaMensal, mediaKmPorLitro, dadosGrafico = [] }) {
  
  const Sparkline = ({ color }) => (
    <div className="h-[60px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={dadosGrafico}>
          <Area 
            type="monotone" 
            dataKey="kmPorLitro" 
            stroke={color} 
            fill={color} 
            fillOpacity={0.2} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const Card = ({ title, icon: Icon, data, kmL, colorClass, sparklineColor }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Icon className={`w-5 h-5 ${colorClass}`} />
          <h3 className="font-semibold text-gray-600">{title}</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">
            {kmL > 0 ? kmL.toFixed(1) : '--'}
          </span>
          <span className="text-sm font-medium text-gray-500">km/L</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Gasto: {data?.gastoRS > 0 ? data.gastoRS.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00'}
        </div>
      </div>
      {dadosGrafico.length > 0 && <Sparkline color={sparklineColor} />}
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card 
        title="Média Diária" 
        icon={Calendar} 
        data={mediaDiaria} 
        kmL={mediaDiaria?.kmPorLitro} 
        colorClass="text-emerald-500"
        sparklineColor="#10b981"
      />
      <Card 
        title="Média Semanal" 
        icon={CalendarDays} 
        data={mediaSemanal} 
        kmL={mediaSemanal?.kmPorLitro} 
        colorClass="text-blue-500"
        sparklineColor="#3b82f6"
      />
      <Card 
        title="Média Mensal" 
        icon={CalendarRange} 
        data={mediaMensal} 
        kmL={mediaMensal?.kmPorLitro} 
        colorClass="text-purple-500"
        sparklineColor="#a855f7"
      />
    </div>
  );
}
