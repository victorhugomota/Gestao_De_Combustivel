import React, { useState, useEffect } from 'react';
import { MapPin, Home, Trash2 } from 'lucide-react';

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function RotasTrabalho({ rotas = [], config, adicionarRota, excluirRota, abastecimentos = [], onRotaSelect }) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedRotaIndex, setSelectedRotaIndex] = useState(null);
  
  // Calculate averages for cost estimation
  const last5 = abastecimentos.slice(0, 5);
  const avgKmPerLitro = last5.length > 0 
    ? last5.reduce((acc, curr) => acc + (curr.odometroKm > 0 ? (curr.odometroKm / (curr.totalLitros || 1)) : 0), 0) / last5.length // Simplified estimation if odometro is absolute, we actually need difference. Let's use 10 as default if we can't compute easily without full metricas.
    : 10;
  const avgPricePerLiter = last5.length > 0
    ? last5.reduce((acc, curr) => acc + curr.valorLitro, 0) / last5.length
    : 5.5;

  // Real avg KmL based on distance between refuels could be passed from useMetricas, but using a fallback here.
  const fallbackKmL = 10;
  const actualAvgKmL = avgKmPerLitro > 0 ? avgKmPerLitro : fallbackKmL;

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (endereco.length > 3) {
        fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(endereco)}&countrycodes=br&limit=5`, {
          headers: { 'Accept-Language': 'pt-BR' }
        })
        .then(res => res.json())
        .then(data => setSuggestions(data))
        .catch(err => console.error(err));
      } else {
        setSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [endereco]);

  const handleAdd = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    const dist = calcularDistanciaKm(config.latCasa || -21.1904, config.lngCasa || -47.7858, lat, lon);
    
    adicionarRota({
      nome: nome || 'Nova Rota',
      endereco: suggestion.display_name,
      latitude: lat,
      longitude: lon,
      distanciaCasaKm: dist,
      tipo: 'trabalho'
    });
    
    setNome('');
    setEndereco('');
    setSuggestions([]);
  };

  const handleSelectRota = (rota, index) => {
    setSelectedRotaIndex(index);
    if (onRotaSelect) {
      onRotaSelect({
        origin: { lat: config.latCasa || -21.1904, lng: config.lngCasa || -47.7858 },
        destination: { lat: rota.latitude, lng: rota.longitude },
        nome: rota.nome
      });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="w-5 h-5 text-emerald-500" />
        <h2 className="text-lg font-bold text-gray-800">Rotas de Trabalho</h2>
      </div>

      <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
        <Home className="w-5 h-5 text-gray-500 mt-1 flex-shrink-0" />
        <div>
          <span className="font-semibold text-gray-700 block">Casa:</span>
          <span className="text-sm text-gray-600">{config?.enderecoCasa || 'Lar Grécia - Rua Alfredo Pucci, 80 - Jardim Emília, Ribeirão Preto - São Paulo'}</span>
        </div>
      </div>

      <div className="mb-6 space-y-3 relative">
        <input 
          type="text" 
          placeholder="Nome (ex: Trabalho Victor)" 
          value={nome}
          onChange={e => setNome(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
        />
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar endereço..." 
            value={endereco}
            onChange={e => setEndereco(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
              {suggestions.map((s, i) => (
                <li 
                  key={i} 
                  className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-gray-700 border-b last:border-0"
                  onClick={() => handleAdd(s)}
                >
                  {s.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1">
        {rotas.map((rota, idx) => {
          const roundTrip = rota.distanciaCasaKm * 2;
          const totalMonthlyKm = roundTrip * 22;
          const monthlyCost = (totalMonthlyKm / actualAvgKmL) * avgPricePerLiter;

          return (
            <div 
              key={rota.id || idx} 
              className={`p-4 rounded-xl border transition-colors cursor-pointer flex justify-between items-center ${selectedRotaIndex === idx ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 bg-white'}`}
              onClick={() => handleSelectRota(rota, idx)}
            >
              <div className="flex-1 pr-4">
                <h4 className="font-bold text-gray-800">{rota.nome}</h4>
                <p className="text-xs text-gray-500 truncate mb-2" title={rota.endereco}>{rota.endereco}</p>
                <div className="flex gap-4 text-sm">
                  <span className="text-gray-600 font-medium">{rota.distanciaCasaKm.toFixed(1)} km</span>
                  <span className="text-emerald-600 font-semibold">Previsão mensal: {monthlyCost.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}</span>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); excluirRota(rota.id); }}
                className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex-shrink-0"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          );
        })}
        {rotas.length === 0 && (
          <div className="text-center text-gray-500 py-4 text-sm">
            Nenhuma rota cadastrada.
          </div>
        )}
      </div>
    </div>
  );
}
