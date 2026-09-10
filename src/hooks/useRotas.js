import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Config inicial usada APENAS na primeira execução (documento inexistente).
// Depois disso o usuário manda — nada aqui sobrescreve o que ele editou.
const CONFIG_PADRAO = {
  nomeCasa: 'Casa',
  enderecoCasa: 'Rua Alfredo Pucci, 80 - Bonfim Paulista, Ribeirão Preto - SP',
  latCasa: -21.2687653,
  lngCasa: -47.8197413,
  nomeVeiculo: 'Nissan Kicks',
  fotoPerfilUrl: '',
};

// Coordenada antiga comprovadamente errada — corrigida uma única vez.
const COORD_ANTIGA_ERRADA = -21.1904;

export function useRotas() {
  const [rotas, setRotas] = useState([]);
  const [config, setConfig] = useState(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeRotas;
    let unsubscribeConfig;

    const carregar = async () => {
      try {
        const configRef = doc(db, 'configuracoes', 'geral');
        const snap = await getDoc(configRef);

        if (!snap.exists()) {
          await setDoc(configRef, CONFIG_PADRAO);
        } else {
          const atual = snap.data();
          // Migração pontual e conservadora: só conserta a coordenada errada,
          // sem tocar em nome/endereço definidos pelo usuário.
          if (Math.abs(Number(atual.latCasa) - COORD_ANTIGA_ERRADA) < 0.0001) {
            await setDoc(
              configRef,
              { latCasa: CONFIG_PADRAO.latCasa, lngCasa: CONFIG_PADRAO.lngCasa },
              { merge: true }
            );
          }
        }

        unsubscribeConfig = onSnapshot(configRef, (d) => {
          if (d.exists()) setConfig({ ...CONFIG_PADRAO, ...d.data() });
        });

        unsubscribeRotas = onSnapshot(collection(db, 'rotas'), (s) => {
          setRotas(s.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        });
      } catch (error) {
        console.error('Erro ao carregar dados de rotas:', error);
        setLoading(false);
      }
    };

    carregar();
    return () => {
      unsubscribeRotas?.();
      unsubscribeConfig?.();
    };
  }, []);

  const adicionarRota = async (dados) => {
    await addDoc(collection(db, 'rotas'), { ...dados, createdAt: serverTimestamp() });
  };

  const excluirRota = async (id) => {
    await deleteDoc(doc(db, 'rotas', id));
  };

  const atualizarRota = async (id, dados) => {
    await updateDoc(doc(db, 'rotas', id), dados);
  };

  const atualizarConfig = async (dados) => {
    await setDoc(doc(db, 'configuracoes', 'geral'), dados, { merge: true });
  };

  return { rotas, config, loading, adicionarRota, excluirRota, atualizarRota, atualizarConfig };
}
