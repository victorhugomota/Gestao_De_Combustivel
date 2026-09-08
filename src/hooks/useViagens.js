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
        const tripsRef = collection(viagensDb, 'trips');
        unsubscribe = onSnapshot(tripsRef, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          docs.sort((a, b) => {
            const da = a.startDate ? new Date(a.startDate).getTime() : 0;
            const db = b.startDate ? new Date(b.startDate).getTime() : 0;
            return da - db;
          });
          setViagens(docs);
          setLoading(false);
        }, (error) => {
          console.error("Erro ao ler trips no viagensDb:", error);
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
