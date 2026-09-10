import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { normalizarTipoCombustivel } from '../utils/combustivel';

/** Higieniza os dados do formulário antes de gravar no Firestore. */
function sanitizar(dados) {
  const valorTotal = Number(dados.valorTotal) || 0;
  const totalLitros = Number(dados.totalLitros) || 0;
  const valorLitro = totalLitros > 0 ? valorTotal / totalLitros : 0;

  if (!(valorTotal > 0) || !(totalLitros > 0)) {
    throw new Error('Valor total e litros precisam ser maiores que zero.');
  }

  return {
    data: dados.data, // 'YYYY-MM-DD' no fuso local (ver dataUtils.toLocalISODate)
    odometroKm: Number(dados.odometroKm) || 0,
    tipoCombustivel: normalizarTipoCombustivel(dados.tipoCombustivel),
    tanqueCheio: dados.tanqueCheio !== false,
    valorTotal,
    totalLitros,
    valorLitro,
    posto: dados.posto ? String(dados.posto).trim() : '',
  };
}

export function useAbastecimentos() {
  const [abastecimentos, setAbastecimentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'abastecimentos'), orderBy('data', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setAbastecimentos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
        setErro(null);
      },
      (error) => {
        console.error('Erro ao carregar abastecimentos:', error);
        setErro('Não foi possível carregar os abastecimentos. Verifique a conexão.');
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const adicionarAbastecimento = async (dados) => {
    const limpo = sanitizar(dados);
    await addDoc(collection(db, 'abastecimentos'), { ...limpo, createdAt: serverTimestamp() });
  };

  const editarAbastecimento = async (id, dados) => {
    const limpo = sanitizar(dados);
    await updateDoc(doc(db, 'abastecimentos', id), { ...limpo, updatedAt: serverTimestamp() });
  };

  const excluirAbastecimento = async (id) => {
    await deleteDoc(doc(db, 'abastecimentos', id));
  };

  return {
    abastecimentos,
    loading,
    erro,
    adicionarAbastecimento,
    editarAbastecimento,
    excluirAbastecimento,
  };
}
