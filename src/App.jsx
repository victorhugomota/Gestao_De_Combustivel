import React, { useState } from 'react';
import Header from './components/Header';
import RegistrarAbastecimentoModal from './components/RegistrarAbastecimentoModal';
import HistoricoAbastecimentosModal from './components/HistoricoAbastecimentosModal';
import CalendarioCustosModal from './components/CalendarioCustosModal';
import RotasTrabalho from './components/RotasTrabalho';
import MapaRota from './components/MapaRota';
import AnalisePrecos from './components/AnalisePrecos';
import MetricCards from './components/MetricCards';
import GraficoConsumo from './components/GraficoConsumo';
import ViagensPreagendadas from './components/ViagensPreagendadas';

import { useAbastecimentos } from './hooks/useAbastecimentos';
import { useRotas } from './hooks/useRotas';
import { useViagens } from './hooks/useViagens';
import { useMetricas } from './hooks/useMetricas';

import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Fuel } from 'lucide-react';

export default function App() {
  const { 
    abastecimentos, 
    loading: loadingAbs, 
    adicionarAbastecimento, 
    editarAbastecimento, 
    excluirAbastecimento 
  } = useAbastecimentos();

  const { rotas, config, loading: loadingRotas, adicionarRota, excluirRota, atualizarConfig } = useRotas();
  const { viagens, loading: loadingViagens } = useViagens();
  const { 
    mediaKmPorLitro, 
    custoPorKm,
    precoMedioLitro,
    totalGastoRS,
    totalLitrosAbastecidos,
    historicoPrecos, 
    ultimaVariacaoGasolina, 
    ultimaVariacaoEtanol, 
    dadosGrafico 
  } = useMetricas(abastecimentos);

  const [modalAberto, setModalAberto] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [abastecimentoParaEditar, setAbastecimentoParaEditar] = useState(null);
  const [circuito, setCircuito] = useState(null);

  const handleRegistrarOuEditar = async (dados, id) => {
    try {
      if (id) {
        await editarAbastecimento(id, dados);
      } else {
        await adicionarAbastecimento(dados);
      }
      setModalAberto(false);
      setAbastecimentoParaEditar(null);
    } catch (error) {
      console.error('Erro ao salvar abastecimento:', error);
      alert('Erro ao salvar no banco de dados. Verifique a conexão.');
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
          
          {/* TOP ROW - Z Points 1 & 2 */}
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
          
          {/* DIAGONAL - Routes section with multi-stop loop map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <RotasTrabalho 
              rotas={rotas} 
              config={config} 
              adicionarRota={adicionarRota} 
              excluirRota={excluirRota} 
              abastecimentos={abastecimentos} 
              mediaKmPorLitro={mediaKmPorLitro}
              onCircuitoChange={setCircuito} 
            />
            <div className="space-y-6">
              <MapaRota 
                circuito={circuito}
                config={config} 
              />
              <AnalisePrecos 
                abastecimentos={abastecimentos} 
                historicoPrecos={historicoPrecos} 
                ultimaVariacaoGasolina={ultimaVariacaoGasolina} 
                ultimaVariacaoEtanol={ultimaVariacaoEtanol} 
              />
            </div>
          </div>
          
          {/* BOTTOM ROW - Z Points 3 & 4 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-2 space-y-6">
              {/* Card de 3 divisões: Média de consumo, Custo/km e Preço médio (sem semanal e mensal) */}
              <MetricCards 
                mediaKmPorLitro={mediaKmPorLitro} 
                custoPorKm={custoPorKm}
                precoMedioLitro={precoMedioLitro}
                totalGastoRS={totalGastoRS}
                totalLitrosAbastecidos={totalLitrosAbastecidos}
                dadosGrafico={dadosGrafico} 
              />
              <GraficoConsumo 
                dadosGrafico={dadosGrafico} 
                historicoPrecos={historicoPrecos} 
              />
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

      {/* Modal de Registro / Edição */}
      <RegistrarAbastecimentoModal 
        isOpen={modalAberto} 
        onClose={() => {
          setModalAberto(false);
          setAbastecimentoParaEditar(null);
        }} 
        onSubmit={handleRegistrarOuEditar} 
        ultimoAbastecimento={ultimoAbastecimento} 
        itemParaEditar={abastecimentoParaEditar}
      />

      {/* Modal de Histórico de Abastecimentos */}
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

      {/* Modal do Calendário de Custos */}
      <CalendarioCustosModal
        isOpen={calendarioAberto}
        onClose={() => setCalendarioAberto(false)}
        circuito={circuito}
        abastecimentos={abastecimentos}
        viagens={viagens}
      />
    </>
  );
}
