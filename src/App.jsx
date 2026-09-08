import React, { useState } from 'react';
import Header from './components/Header';
import RegistrarAbastecimentoModal from './components/RegistrarAbastecimentoModal';
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
  const { abastecimentos, loading: loadingAbs, adicionarAbastecimento } = useAbastecimentos();
  const { rotas, config, loading: loadingRotas, adicionarRota, excluirRota, atualizarConfig } = useRotas();
  const { viagens, loading: loadingViagens } = useViagens();
  const { mediaKmPorLitro, mediaDiaria, mediaSemanal, mediaMensal, historicoPrecos, ultimaVariacaoGasolina, ultimaVariacaoEtanol, dadosGrafico } = useMetricas(abastecimentos);

  const [modalAberto, setModalAberto] = useState(false);
  const [rotaSelecionada, setRotaSelecionada] = useState(null);

  const handleRegistrar = async (dados) => {
    await adicionarAbastecimento(dados);
    setModalAberto(false);
  };

  const handleFotoChange = async (file) => {
    try {
      const fotoRef = ref(storage, 'fotos/perfil.jpg');
      await uploadBytes(fotoRef, file);
      const url = await getDownloadURL(fotoRef);
      await atualizarConfig({ fotoPerfilUrl: url });
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
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
        <h2 className="text-xl font-semibold text-gray-700">Carregando...</h2>
      </div>
    );
  }

  const ultimoAbastecimento = abastecimentos && abastecimentos.length > 0 ? abastecimentos[0] : null;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          
          {/* TOP ROW - Z Points 1 & 2 */}
          <Header 
            config={config} 
            onRegistrarClick={() => setModalAberto(true)} 
            onFotoChange={handleFotoChange} 
            onNomeVeiculoChange={handleNomeVeiculoChange} 
          />
          
          {/* DIAGONAL - Routes section with map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RotasTrabalho 
              rotas={rotas} 
              config={config} 
              adicionarRota={adicionarRota} 
              excluirRota={excluirRota} 
              abastecimentos={abastecimentos} 
              onRotaSelect={setRotaSelecionada} 
            />
            <div className="space-y-6">
              <MapaRota 
                rotaSelecionada={rotaSelecionada} 
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <MetricCards 
                mediaDiaria={mediaDiaria} 
                mediaSemanal={mediaSemanal} 
                mediaMensal={mediaMensal} 
                mediaKmPorLitro={mediaKmPorLitro} 
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
              mediaKmPorLitro={mediaKmPorLitro} 
              abastecimentos={abastecimentos} 
            />
          </div>
          
        </div>
      </div>

      {/* Modal */}
      <RegistrarAbastecimentoModal 
        isOpen={modalAberto} 
        onClose={() => setModalAberto(false)} 
        onSubmit={handleRegistrar} 
        ultimoAbastecimento={ultimoAbastecimento} 
      />
    </>
  );
}
