import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { viagensDb } from '../firebase';

export function useViagens() {
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    try {
      if (viagensDb) {
        const viagensRef = collection(viagensDb, 'viagens');
        unsubscribe = onSnapshot(viagensRef, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setViagens(docs);
          setLoading(false);
        }, (error) => {
          console.error("Erro ao ler viagensDb:", error);
          setViagens([]);
          setLoading(false);
        });
      } else {
        setViagens([]);
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao configurar onSnapshot para viagensDb:", error);
      setViagens([]);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { viagens, loading };
}
