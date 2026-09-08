import React, { useState, useRef } from 'react';
import { Fuel, Camera, Plus, Check, Edit2, History, CalendarDays } from 'lucide-react';

export default function Header({ 
  config, 
  onRegistrarClick, 
  onHistoricoClick, 
  onCalendarioClick, 
  onFotoChange, 
  onNomeVeiculoChange 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(config?.nomeVeiculo || 'Nissan Kicks de Victor e Maria');
  const fileInputRef = useRef(null);

  const handleEditSave = () => {
    setIsEditing(false);
    if (onNomeVeiculoChange) {
      onNomeVeiculoChange(nome);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFotoChange(e.target.files[0]);
    }
  };

  return (
    <header className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-6 flex flex-col md:flex-row justify-between items-center gap-5">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div 
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-50 border border-gray-200/80 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer relative group shadow-inner"
          onClick={() => fileInputRef.current?.click()}
          title="Clique para alterar a foto"
        >
          {config?.fotoPerfilUrl ? (
            <img src={config.fotoPerfilUrl} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-7 h-7 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <Fuel className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight truncate">
              Consumo Família Mota
            </h1>
          </div>
          
          <div className="mt-1 flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={handleEditSave}
                  autoFocus
                  className="px-2.5 py-1 border border-emerald-500 rounded-lg text-sm text-gray-800 font-medium focus:outline-none ring-2 ring-emerald-500/20"
                />
                <button onClick={handleEditSave} className="p-1 text-emerald-600 hover:text-emerald-700">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div 
                className="flex items-center gap-1.5 group cursor-pointer" 
                onClick={() => setIsEditing(true)}
                title="Clique para editar o nome do veículo"
              >
                <p className="text-sm font-medium text-gray-500 group-hover:text-gray-800 transition-colors">
                  {config?.nomeVeiculo || 'Nissan Kicks de Victor e Maria'}
                </p>
                <Edit2 className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações / Botões */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <button
          onClick={onCalendarioClick}
          className="flex-1 sm:flex-none bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold text-sm border border-blue-200/60 shadow-xs"
          title="Ver calendário de custos diários e mensais"
        >
          <CalendarDays className="w-4 h-4 text-blue-600" />
          <span>Calendário de Custos</span>
        </button>

        <button
          onClick={onHistoricoClick}
          className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 font-semibold text-sm border border-gray-200/60 shadow-xs"
          title="Ver histórico de abastecimentos"
        >
          <History className="w-4 h-4 text-gray-600" />
          <span>Histórico</span>
        </button>

        <button
          onClick={onRegistrarClick}
          className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 font-semibold text-sm animate-pulse hover:animate-none"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Abastecimento</span>
        </button>
      </div>
    </header>
  );
}
