import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function GraficoConsumo({ dadosGrafico = [], historicoPrecos = { gasolina: [], etanol: [] } }) {
  const [activeTab, setActiveTab] = useState('consumo');

  // Build price chart data from historicoPrecos object
  const chartDataPrecos = [];
  const mapDataPrecos = new Map();
  
  (historicoPrecos.gasolina || []).forEach(h => {
    if (!mapDataPrecos.has(h.data)) {
      mapDataPrecos.set(h.data, { data: h.data });
    }
    mapDataPrecos.get(h.data).gasolina = h.valorLitro;
  });
  
  (historicoPrecos.etanol || []).forEach(h => {
    if (!mapDataPrecos.has(h.data)) {
      mapDataPrecos.set(h.data, { data: h.data });
    }
    mapDataPrecos.get(h.data).etanol = h.valorLitro;
  });
  
  mapDataPrecos.forEach(val => chartDataPrecos.push(val));
  chartDataPrecos.sort((a, b) => new Date(a.data) - new Date(b.data));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-gray-800">Histórico de Consumo</h2>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1 text-sm font-medium">
          <button 
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'consumo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('consumo')}
          >
            Consumo (km/L)
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'gastos' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('gastos')}
          >
            Gastos (R$)
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md transition-colors ${activeTab === 'preco' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('preco')}
          >
            Preço Combustível
          </button>
        </div>
      </div>

      <div className="h-[280px] w-full">
        {dadosGrafico.length === 0 && chartDataPrecos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <BarChart3 className="w-12 h-12 mb-3 opacity-20" />
            <p>Registre abastecimentos para ver o histórico</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'consumo' ? (
              <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="kmPorLitro" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 6}} name="Consumo (km/L)" />
              </LineChart>
            ) : activeTab === 'gastos' ? (
              <BarChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value) => `R$ ${value}`} />
                <Bar dataKey="gastoRS" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Gastos (R$)" />
              </BarChart>
            ) : (
              <LineChart data={chartDataPrecos} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value) => `R$ ${value}`} />
                <Legend />
                <Line type="monotone" dataKey="gasolina" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Gasolina" connectNulls />
                <Line type="monotone" dataKey="etanol" stroke="#22c55e" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} name="Etanol" connectNulls />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
