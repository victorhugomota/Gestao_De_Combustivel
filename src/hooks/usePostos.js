import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { toLocalISODate } from '../utils/dataUtils';
import { normalizarTipoCombustivel } from '../utils/combustivel';

/**
 * Postos de combustível com preços informados manualmente.
 * Modelo (coleção `postos`):
 *   { nome, endereco, latitude, longitude, bandeira,
 *     precoGasolina, dataGasolina, precoEtanol, dataEtanol,
 *     historico: [{ tipo, valor, data }] }
 */
export function usePostos() {
  const [postos, setPostos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'postos'),
      (snapshot) => {
        setPostos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao carregar postos:', error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const adicionarPosto = async (dados) => {
    const hoje = toLocalISODate();
    const historico = [];
    if (Number(dados.precoGasolina) > 0)
      historico.push({ tipo: 'Gasolina', valor: Number(dados.precoGasolina), data: hoje });
    if (Number(dados.precoEtanol) > 0)
      historico.push({ tipo: 'Etanol', valor: Number(dados.precoEtanol), data: hoje });

    await addDoc(collection(db, 'postos'), {
      nome: String(dados.nome || '').trim() || 'Posto',
      endereco: dados.endereco || '',
      latitude: dados.latitude ?? null,
      longitude: dados.longitude ?? null,
      bandeira: dados.bandeira || '',
      precoGasolina: Number(dados.precoGasolina) || 0,
      dataGasolina: Number(dados.precoGasolina) > 0 ? hoje : '',
      precoEtanol: Number(dados.precoEtanol) || 0,
      dataEtanol: Number(dados.precoEtanol) > 0 ? hoje : '',
      historico,
      createdAt: serverTimestamp(),
    });
  };

  /** Atualiza o preço de UM combustível, registrando no histórico. */
  const registrarPreco = async (postoId, tipoRaw, valorRaw) => {
    const tipo = normalizarTipoCombustivel(tipoRaw);
    const valor = Number(valorRaw) || 0;
    if (valor <= 0) throw new Error('Preço inválido.');

    const posto = postos.find((p) => p.id === postoId);
    const hoje = toLocalISODate();
    const historico = Array.isArray(posto?.historico) ? [...posto.historico] : [];
    historico.push({ tipo, valor, data: hoje });

    const patch =
      tipo === 'Gasolina'
        ? { precoGasolina: valor, dataGasolina: hoje }
        : { precoEtanol: valor, dataEtanol: hoje };

    await updateDoc(doc(db, 'postos', postoId), { ...patch, historico });
  };

  const excluirPosto = async (id) => {
    await deleteDoc(doc(db, 'postos', id));
  };

  return { postos, loading, adicionarPosto, registrarPreco, excluirPosto };
}
