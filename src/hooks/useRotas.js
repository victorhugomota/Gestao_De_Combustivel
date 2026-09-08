import { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, addDoc, deleteDoc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CONFIG_PADRAO = {
  enderecoCasa: 'Lar Grécia - Rua Alfredo Pucci, 80 - Jardim Emília, Ribeirão Preto - São Paulo',
  latCasa: -21.1904,
  lngCasa: -47.7858,
  nomeVeiculo: 'Nissan Kicks de Victor e Maria',
  fotoPerfilUrl: ''
};

export function useRotas() {
  const [rotas, setRotas] = useState([]);
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeRotas;
    let unsubscribeConfig;

    const carregarDados = async () => {
      try {
        const configRef = doc(db, 'configuracoes', 'geral');
        const configSnap = await getDoc(configRef);
        
        if (!configSnap.exists()) {
          await setDoc(configRef, CONFIG_PADRAO);
        }

        unsubscribeConfig = onSnapshot(configRef, (docSnap) => {
          if (docSnap.exists()) {
            setConfig(docSnap.data());
          }
        });

        const rotasRef = collection(db, 'rotas');
        unsubscribeRotas = onSnapshot(rotasRef, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setRotas(docs);
          setLoading(false);
        });

      } catch (error) {
        console.error("Erro ao carregar dados de rotas:", error);
        setLoading(false);
      }
    };

    carregarDados();

    return () => {
      if (unsubscribeRotas) unsubscribeRotas();
      if (unsubscribeConfig) unsubscribeConfig();
    };
  }, []);

  const adicionarRota = async (dados) => {
    try {
      await addDoc(collection(db, 'rotas'), {
        ...dados,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao adicionar rota:", error);
      throw error;
    }
  };

  const excluirRota = async (id) => {
    try {
      await deleteDoc(doc(db, 'rotas', id));
    } catch (error) {
      console.error("Erro ao excluir rota:", error);
      throw error;
    }
  };

  const atualizarConfig = async (dados) => {
    try {
      const configRef = doc(db, 'configuracoes', 'geral');
      await setDoc(configRef, dados, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      throw error;
    }
  };

  return {
    rotas,
    config,
    loading,
    adicionarRota,
    excluirRota,
    atualizarConfig
  };
}
