import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export function useAbastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'abastecimentos'), orderBy('data', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAbastecimentos(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar abastecimentos:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const adicionarAbastecimento = async (dados) => {
    try {
      const valorLitro = dados.valorTotal / dados.totalLitros;
      await addDoc(collection(db, 'abastecimentos'), {
        ...dados,
        valorLitro,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao adicionar abastecimento:", error);
      throw error;
    }
  };

  const editarAbastecimento = async (id, dados) => {
    try {
      const valorLitro = dados.valorTotal / dados.totalLitros;
      await updateDoc(doc(db, 'abastecimentos', id), {
        ...dados,
        valorLitro,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Erro ao atualizar abastecimento:", error);
      throw error;
    }
  };

  const excluirAbastecimento = async (id) => {
    try {
      await deleteDoc(doc(db, 'abastecimentos', id));
    } catch (error) {
      console.error("Erro ao excluir abastecimento:", error);
      throw error;
    }
  };

  return {
    abastecimentos,
    loading,
    adicionarAbastecimento,
    editarAbastecimento,
    excluirAbastecimento
  };
}
