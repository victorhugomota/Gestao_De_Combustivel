import React, { useState, useRef } from 'react';
import { Fuel, Camera, Plus, Check, Edit2 } from 'lucide-react';

export default function Header({ config, onRegistrarClick, onFotoChange, onNomeVeiculoChange }) {
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
    <header className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div 
          className="w-20 h-20 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden cursor-pointer relative group"
          onClick={() => fileInputRef.current?.click()}
        >
          {config?.fotoPerfilUrl ? (
            <img src={config.fotoPerfilUrl} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-gray-400 group-hover:text-gray-600" />
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
             <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Fuel className="w-6 h-6 text-emerald-500" />
            <h1 className="text-xl font-bold text-gray-800">Consumo Família Mota</h1>
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
                  className="px-2 py-1 border border-gray-300 rounded-md text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button onClick={handleEditSave} className="text-emerald-500 hover:text-emerald-600">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                <p className="text-sm text-gray-600">{config?.nomeVeiculo || 'Nissan Kicks de Victor e Maria'}</p>
                <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={onRegistrarClick}
        className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 animate-pulse hover:animate-none font-medium"
      >
        <Plus className="w-5 h-5" />
        Registrar Abastecimento
      </button>
    </header>
  );
}
