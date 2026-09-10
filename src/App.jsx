import React, { useState } from 'react';
import Header from './components/Header';
import RegistrarAbastecimentoModal from './components/RegistrarAbastecimentoModal';
import HistoricoAbastecimentosModal from './components/HistoricoAbastecimentosModal';
import CalendarioCustosModal from './components/CalendarioCustosModal';
import RotasTrabalho from './components/RotasTrabalho';
import MapaRota from './components/MapaRota';
import AnalisePrecos from './components/AnalisePrecos';
import DecisaoCombustivel from './components/DecisaoCombustivel';
import PostosCombustivel from './components/PostosCombustivel';
import MetricCards from './components/MetricCards';
import GraficoConsumo from './components/GraficoConsumo';
import ViagensPreagendadas from './components/ViagensPreagendadas';

import { useAbastecimentos } from './hooks/useAbastecimentos';
import { useRotas } from './hooks/useRotas';
import { useViagens } from './hooks/useViagens';
import { usePostos } from './hooks/usePostos';
import { useMetricas } from './hooks/useMetricas';

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Fuel, AlertTriangle } from 'lucide-react';

export default function App() {
  const {
    abastecimentos,
    loading: loadingAbs,
    erro: erroAbs,
    adicionarAbastecimento,
    editarAbastecimento,
    excluirAbastecimento,
  } = useAbastecimentos();

  const { rotas, config, loading: loadingRotas, adicionarRota, excluirRota, atualizarConfig } = useRotas();
  const { viagens, loading: loadingViagens } = useViagens();
  const { postos, loading: loadingPostos, adicionarPosto, registrarPreco, excluirPosto } = usePostos();

  const metricas = useMetricas(abastecimentos);
  const {
    mediaKmPorLitro,
    custoPorKm,
    precoMedioLitro,
    totalGastoRS,
    totalLitrosAbastecidos,
    historicoPrecos,
    ultimaVariacaoGasolina,
    ultimaVariacaoEtanol,
    dadosGrafico,
    alertasDados,
    kmLGasolina,
    kmLEtanol,
    razaoEtanolGasolina,
    precoAtualGasolina,
    precoAtualEtanol,
  } = metricas;

  const [modalAberto, setModalAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [abastecimentoParaEditar, setAbastecimentoParaEditar] = useState(null);
  const [circuito, setCircuito] = useState(null);
  const [alertasVisiveis, setAlertasVisiveis] = useState(true);

  // Preço sugerido para a decisão Gasolina x Etanol: menor preço entre
  // postos com registro recente e o último abastecimento.
  const precoGasolinaSugerido = menorPreco(postos, 'precoGasolina', 'dataGasolina', precoAtualGasolina);
  const precoEtanolSugerido = menorPreco(postos, 'precoEtanol', 'dataEtanol', precoAtualEtanol);

  const handleRegistrarOuEditar = async (dados, id) => {
    try {
      if (id) await editarAbastecimento(id, dados);
      else await adicionarAbastecimento(dados);
      setModalAberto(false);
      setAbastecimentoParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar abastecimento:', error);
      alert(error.message || 'Erro ao salvar no banco de dados. Verifique a conexão.');
    }
  };

  const handleAbrirEditar = (item) => {
    setAbastecimentoParaEditar(item);
    setHistoricoAberto(false);
    setModalAberto(true);
  };

  const handleFotoChange = async (file) => {
    try {
      const fotoRef = ref(storage, 'fotos/perfil.jpg');
      await uploadBytes(fotoRef, file);
      const url = await getDownloadURL(fotoRef);
      await atualizarConfig({ fotoPerfilUrl: url });
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error);
    }
  };

  const handleNomeVeiculoChange = async (nome) => {
    await atualizarConfig({ nomeVeiculo: nome });
  };

  const isLoading = loadingAbs || loadingRotas || loadingViagens;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Fuel className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Carregando dados...</h2>
      </div>
    );
  }

  const ultimoAbastecimento = abastecimentos && abastecimentos.length > 0 ? abastecimentos[0] : null;

  return (
    <>
      <div className="min-h-screen bg-gray-50/70 antialiased selection:bg-emerald-500 selection:text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Header
            config={config}
            onRegistrarClick={() => {
              setAbastecimentoParaEditar(null);
              setModalAberto(true);
            }}
            onHistoricoClick={() => setHistoricoAberto(true)}
            onCalendarioClick={() => setCalendarioAberto(true)}
            onFotoChange={handleFotoChange}
            onNomeVeiculoChange={handleNomeVeiculoChange}
          />

          {(erroAbs || (alertasDados.length > 0 && alertasVisiveis)) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  {erroAbs && <p className="font-semibold">{erroAbs}</p>}
                  {alertasDados.slice(0, 4).map((a, i) => (
                    <p key={i} className="mt-0.5">• {a}</p>
                  ))}
                  {alertasDados.length > 4 && (
                    <p className="mt-0.5 text-amber-700">e mais {alertasDados.length - 4} aviso(s)…</p>
                  )}
                </div>
                <button
                  onClick={() => setAlertasVisiveis(false)}
                  className="text-amber-700 hover:text-amber-900 text-xs font-bold"
                >
                  ocultar
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <RotasTrabalho
              rotas={rotas}
              config={config}
              adicionarRota={adicionarRota}
              excluirRota={excluirRota}
              abastecimentos={abastecimentos}
              viagens={viagens}
              precoMedioLitro={precoMedioLitro}
              mediaKmPorLitro={mediaKmPorLitro}
              onCircuitoChange={setCircuito}
            />
            <div className="space-y-6">
              <MapaRota circuito={circuito} config={config} />
              <AnalisePrecos
                abastecimentos={abastecimentos}
                historicoPrecos={historicoPrecos}
                ultimaVariacaoGasolina={ultimaVariacaoGasolina}
                ultimaVariacaoEtanol={ultimaVariacaoEtanol}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <DecisaoCombustivel
              precoGasolinaSugerido={precoGasolinaSugerido}
              precoEtanolSugerido={precoEtanolSugerido}
              razaoEtanolGasolina={razaoEtanolGasolina}
              kmLGasolina={kmLGasolina}
              kmLEtanol={kmLEtanol}
            />
            <PostosCombustivel
              postos={postos}
              loading={loadingPostos}
              adicionarPosto={adicionarPosto}
              registrarPreco={registrarPreco}
              excluirPosto={excluirPosto}
              config={config}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              <MetricCards
                mediaKmPorLitro={mediaKmPorLitro}
                custoPorKm={custoPorKm}
                precoMedioLitro={precoMedioLitro}
                totalGastoRS={totalGastoRS}
                totalLitrosAbastecidos={totalLitrosAbastecidos}
                dadosGrafico={dadosGrafico}
              />
              <GraficoConsumo dadosGrafico={dadosGrafico} historicoPrecos={historicoPrecos} />
            </div>
            <ViagensPreagendadas
              viagens={viagens}
              loading={loadingViagens}
              rotas={rotas}
              config={config}
              circuito={circuito}
              mediaKmPorLitro={mediaKmPorLitro}
              abastecimentos={abastecimentos}
              onCalendarioClick={() => setCalendarioAberto(true)}
            />
          </div>
        </div>
      </div>

      <RegistrarAbastecimentoModal
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setAbastecimentoParaEditar(null);
        }}
        onSubmit={handleRegistrarOuEditar}
        ultimoAbastecimento={ultimoAbastecimento}
        itemParaEditar={abastecimentoParaEditar}
        postos={postos}
      />

      <HistoricoAbastecimentosModal
        isOpen={historicoAberto}
        onClose={() => setHistoricoAberto(false)}
        abastecimentos={abastecimentos}
        onEditar={handleAbrirEditar}
        onExcluir={excluirAbastecimento}
        onNovo={() => {
          setAbastecimentoParaEditar(null);
          setModalAberto(true);
        }}
      />

      {calendarioAberto && (
        <CalendarioCustosModal
          isOpen={calendarioAberto}
          onClose={() => setCalendarioAberto(false)}
          circuito={circuito}
          abastecimentos={abastecimentos}
          viagens={viagens}
        />
      )}
    </>
  );
}

/** Menor preço entre postos com registro <= 45 dias; cai para `fallback`. */
function menorPreco(postos, campoPreco, campoData, fallback = 0) {
  const agora = Date.now();
  const validos = (postos || [])
    .map((p) => ({ valor: Number(p[campoPreco]) || 0, data: p[campoData] }))
    .filter((x) => x.valor > 0)
    .filter((x) => {
      if (!x.data) return false;
      const t = new Date(x.data).getTime();
      return !isNaN(t) && (agora - t) / 86400000 <= 45;
    });
  if (validos.length === 0) return fallback || 0;
  return validos.reduce((min, x) => (x.valor < min ? x.valor : min), Infinity);
}
