import React, { useState, useEffect, useMemo } from 'react';
import { 
  MapPin, 
  Home, 
  Trash2, 
  Plus, 
  Loader2, 
  Navigation, 
  ArrowRight, 
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import {
  montarSequenciaCircuito,
  calcularCustosCircuito,
  obterDistanciasReaisOSRM
} from '../utils/rotasUtils';
import { buscarEnderecos } from '../utils/geocode';
import EstimativaBadge from './EstimativaBadge';

export default function RotasTrabalho({
  rotas = [],
  config,
  adicionarRota,
  excluirRota,
  abastecimentos = [],
  viagens = [],
  precoMedioLitro = 0,
  mediaKmPorLitro = 0,
  onCircuitoChange
}) {
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [selectedPonto, setSelectedPonto] = useState(null);
  const [distanciasOSRM, setDistanciasOSRM] = useState(null);
  const [loadingRotaReal, setLoadingRotaReal] = useState(false);

  // Informações de Casa
  const nomeCasa = config?.nomeCasa || 'Casa - Lar Grécia';
  const enderecoCasa = config?.enderecoCasa || 'Rua Alfredo Pucci, 80 - Bonfim Paulista, Ribeirão Preto - SP';
  const latCasa = config?.latCasa || -21.2687653;
  const lngCasa = config?.lngCasa || -47.8197413;

  // Preço médio real do litro (0 quando ainda não há dados -> vira estimativa sinalizada)
  const avgPricePerLiter = useMemo(() => {
    if (precoMedioLitro > 0) return precoMedioLitro;
    if (!abastecimentos || abastecimentos.length === 0) return 0;
    const ultimos = abastecimentos.slice(0, 5);
    const soma = ultimos.reduce((acc, curr) => acc + Number(curr.valorLitro || 0), 0);
    return soma > 0 ? soma / ultimos.length : 0;
  }, [abastecimentos, precoMedioLitro]);

  // Montar a sequência de pontos ordenada por proximidade
  const sequenciaInfo = useMemo(() => {
    return montarSequenciaCircuito(
      { latCasa, lngCasa, nomeCasa, enderecoCasa },
      rotas
    );
  }, [latCasa, lngCasa, nomeCasa, enderecoCasa, rotas]);

  // Buscar as distâncias reais de rodovia / trânsito via OSRM Driving API
  useEffect(() => {
    const { waypointsCompletos } = sequenciaInfo;
    if (!waypointsCompletos || waypointsCompletos.length < 2) {
      setDistanciasOSRM(null);
      return;
    }

    let isMounted = true;
    setLoadingRotaReal(true);

    obterDistanciasReaisOSRM(waypointsCompletos).then(res => {
      if (isMounted) {
        setDistanciasOSRM(res);
        setLoadingRotaReal(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [sequenciaInfo]);

  // Calcular custos considerando as distâncias viárias reais
  const circuito = useMemo(() => {
    return calcularCustosCircuito(sequenciaInfo, {
      mediaKmPorLitro,
      precoLitroMedio: avgPricePerLiter,
      distanciasOSRM,
      viagens,
      abastecimentos
    });
  }, [sequenciaInfo, mediaKmPorLitro, avgPricePerLiter, distanciasOSRM, viagens, abastecimentos]);

  // Notificar o componente pai sobre a rota/circuito atual para o Mapa
  useEffect(() => {
    if (onCircuitoChange) {
      onCircuitoChange(circuito);
    }
  }, [circuito, onCircuitoChange]);

  // Autocomplete de endereço (centralizado em utils/geocode com cache)
  const [erroBusca, setErroBusca] = useState('');
  useEffect(() => {
    const cleanQuery = endereco.trim();
    if (cleanQuery.length < 3) {
      setSuggestions([]);
      setLoadingSearch(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSearch(true);
      setErroBusca('');
      try {
        const res = await buscarEnderecos(cleanQuery, { lat: latCasa, lon: lngCasa });
        setSuggestions(res);
      } catch (err) {
        setErroBusca(err.message || 'Falha ao buscar endereço.');
      } finally {
        setLoadingSearch(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [endereco, latCasa, lngCasa]);

  const handleSelectSuggestion = (suggestion) => {
    setSelectedPonto(suggestion);
    setEndereco(suggestion.titulo || suggestion.display_name);
    setSuggestions([]);
  };

  const handleAddRota = async (e) => {
    e.preventDefault();
    if (!endereco) return;

    let lat = selectedPonto?.lat;
    let lon = selectedPonto?.lon;
    let enderecoFinal = selectedPonto?.display_name || endereco;

    if (!lat || !lon) {
      try {
        setLoadingSearch(true);
        const res = await buscarEnderecos(endereco, { limite: 1 });
        if (res[0]) {
          lat = res[0].lat;
          lon = res[0].lon;
          enderecoFinal = res[0].display_name;
        } else {
          alert('Endereço não localizado no mapa. Selecione uma das sugestões ao digitar.');
          setLoadingSearch(false);
          return;
        }
      } catch (err) {
        console.error(err);
        setLoadingSearch(false);
        return;
      }
    }

    try {
      await adicionarRota({
        nome: nome.trim() || `Destino ${rotas.length + 1}`,
        endereco: enderecoFinal,
        latitude: lat,
        longitude: lon,
        tipo: 'trabalho'
      });

      setNome('');
      setEndereco('');
      setSelectedPonto(null);
      setSuggestions([]);
    } catch (err) {
      console.error('Erro ao adicionar rota:', err);
    } finally {
      setLoadingSearch(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Navigation className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">Rotas de Trabalho</h2>
            <p className="text-xs text-gray-500">Circuito diário com rota de Ida e Volta</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
          {rotas.length} {rotas.length === 1 ? 'destino' : 'destinos'}
        </span>
      </div>

      {/* Ponto de Partida: Casa */}
      <div className="bg-gradient-to-r from-emerald-50/70 to-blue-50/50 p-4 rounded-2xl border border-emerald-100 mb-5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-emerald-500 text-white flex-shrink-0 shadow-sm mt-0.5">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{nomeCasa}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 text-emerald-900">
                Ponto de Partida e Retorno
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1 break-words line-clamp-2" title={enderecoCasa}>
              {enderecoCasa}
            </p>
          </div>
        </div>
      </div>

      {/* Formulário para Adicionar Rota */}
      <form onSubmit={handleAddRota} className="mb-6 space-y-3 relative">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="sm:col-span-1">
            <input 
              type="text" 
              placeholder="Nome (ex: Trabalho Maria)" 
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-gray-50/50"
            />
          </div>

          <div className="sm:col-span-2 relative">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar endereço ou CEP (ex: Central Bild ou 14020-263)" 
                value={endereco}
                onChange={e => {
                  setEndereco(e.target.value);
                  setSelectedPonto(null);
                }}
                className="w-full px-3.5 py-2.5 pr-9 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-sm bg-gray-50/50"
              />
              {loadingSearch && (
                <div className="absolute right-3 top-3 text-emerald-500 animate-spin">
                  <Loader2 className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Dropdown de Sugestões */}
            {suggestions.length > 0 && (
              <ul className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-gray-100">
                {suggestions.map((s, i) => (
                  <li 
                    key={i} 
                    className="p-3 hover:bg-emerald-50/70 cursor-pointer transition-colors flex items-start gap-2.5"
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{s.titulo}</p>
                      <p className="text-xs text-gray-500 truncate">{s.subtitulo}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={!endereco.trim()}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Destino ao Circuito</span>
        </button>
      </form>

      {/* Lista de Destinos Cadastrados */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-3 pr-1 min-h-[120px] max-h-[260px]">
        {rotas.length === 0 ? (
          <div className="text-center py-8 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-500 font-medium">Nenhum destino de trabalho cadastrado.</p>
            <p className="text-xs text-gray-400 mt-1">Adicione os locais de trabalho para calcular o trajeto diário.</p>
          </div>
        ) : (
          (circuito.destinosOrdenados || rotas).map((rota, idx) => {
            const distCasa = rota.distanciaCasaCalculada || 0;
            return (
              <div 
                key={rota.id || idx} 
                className="p-3.5 rounded-2xl border border-gray-100 bg-white hover:border-emerald-200 hover:shadow-sm transition-all flex items-center justify-between gap-3 min-w-0"
              >
                <div className="w-7 h-7 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {idx + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{rota.nome}</h4>
                    {distCasa > 0 && (
                      <span className="text-[11px] font-medium text-gray-500 flex-shrink-0">
                        ({distCasa.toFixed(1)} km de casa)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5" title={rota.endereco}>
                    {rota.endereco}
                  </p>
                </div>
                <button 
                  onClick={() => excluirRota(rota.id)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
                  title="Excluir destino"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Detalhamento Completo da Rota: IDA e VOLTA (Prints 1 e 2) */}
      {circuito && (circuito.trechosIda.length > 0 || circuito.trechosVolta.length > 0) && (
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Circuito Diário Completo (Ida e Volta)
              </h3>
              {loadingRotaReal && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Calculando vias...</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap justify-end">
              <EstimativaBadge
                estimado={!circuito.isDistanciaReal}
                textoReal="🛣️ Distância real"
                textoEstimado="Distância estimada"
                motivo={
                  circuito.isDistanciaReal
                    ? 'Distâncias viárias obtidas do OSRM'
                    : 'OSRM indisponível — usando linha reta × 1,38'
                }
              />
              {(circuito.isConsumoEstimado || circuito.isPrecoEstimado) && (
                <EstimativaBadge
                  estimado
                  textoEstimado={
                    circuito.isConsumoEstimado && circuito.isPrecoEstimado
                      ? 'Consumo e preço estimados'
                      : circuito.isConsumoEstimado
                      ? 'Consumo estimado (10 km/L)'
                      : 'Preço estimado (R$ 5,50)'
                  }
                  motivo="Registre abastecimentos para calcular com seus dados reais"
                />
              )}
            </div>
          </div>

          {circuito.isOrdemHeuristica && (
            <p className="text-[11px] text-gray-400 -mt-1">
              Ordem das paradas por proximidade em linha reta de casa — pode não ser a rota mais
              curta na prática.
            </p>
          )}

          {/* 1. TRAJETO DE IDA */}
          <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 pb-1 border-b border-emerald-100">
              <span className="flex items-center gap-1">
                <span>🟢 Trajeto de Ida</span>
                <span className="text-[10px] font-normal text-emerald-700">(Casa ➔ Mais perto ➔ Mais longe)</span>
              </span>
              <span>Subtotal: {circuito.distanciaIdaKm.toFixed(1)} km • {circuito.custoIdaRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {circuito.trechosIda.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-semibold text-gray-800 truncate">{t.origemNome}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 truncate">{t.destinoNome}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-right">
                    <span className="text-gray-500 font-medium">{t.distanciaKm.toFixed(1)} km</span>
                    <span className="font-bold text-emerald-700">
                      {t.custoRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. TRAJETO DE VOLTA */}
          <div className="bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 pb-1 border-b border-blue-100">
              <span className="flex items-center gap-1">
                <span>🔵 Trajeto de Volta</span>
                <span className="text-[10px] font-normal text-blue-700">(Mais longe ➔ Mais perto ➔ Casa)</span>
              </span>
              <span>Subtotal: {circuito.distanciaVoltaKm.toFixed(1)} km • {circuito.custoVoltaRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              {circuito.trechosVolta.map((t, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-0.5 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <span className="font-semibold text-gray-800 truncate">{t.origemNome}</span>
                    <ArrowRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="font-semibold text-gray-800 truncate">{t.destinoNome}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-right">
                    <span className="text-gray-500 font-medium">{t.distanciaKm.toFixed(1)} km</span>
                    <span className="font-bold text-blue-700">
                      {t.custoRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resumo Consolidado e Botão Google Maps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="bg-emerald-500 text-white p-3.5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 block">
                Custo Total Diário (Ida + Volta)
              </span>
              <div className="text-xl font-black mt-0.5">
                {circuito.custoTotalDiarioRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                <span className="text-xs font-medium opacity-90 ml-1">/ dia</span>
              </div>
              <span className="text-[11px] opacity-90 font-medium block mt-0.5">
                {circuito.distanciaTotalKm.toFixed(1)} km totais rodados por dia
              </span>
            </div>

            <div className="bg-blue-600 text-white p-3.5 rounded-2xl shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider opacity-90 block">
                Previsão Mensal ({circuito.previsao?.diasUteisMes ?? 22} dias úteis)
              </span>
              <div className="text-xl font-black mt-0.5">
                {circuito.custoTotalMensalRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                <span className="text-xs font-medium opacity-90 ml-1">/ mês</span>
              </div>
              {circuito.previsao && (
                <span className="text-[11px] opacity-90 font-medium block mt-0.5">
                  faixa {circuito.previsao.faixaMin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  {' – '}
                  {circuito.previsao.faixaMax.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                  {circuito.previsao.custoViagensMes > 0 && ' • inclui viagens'}
                </span>
              )}
            </div>
          </div>

          {/* Botão de abrir rota no Google Maps */}
          {circuito.googleMapsUrl && (
            <a
              href={circuito.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border border-gray-200/80"
              title="Abrir a rota no Google Maps para ver no celular ou navegar"
            >
              <span>Abrir este trajeto no Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
