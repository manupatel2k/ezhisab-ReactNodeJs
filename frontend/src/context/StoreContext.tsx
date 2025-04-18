import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeAPI } from '@/lib/api';

interface Store {
  id: string;
  name: string;
  location: string;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store) => void;
  fetchStores: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await storeAPI.getAll();
      setStores(response.data);
      if (response.data.length > 0 && !currentStore) {
        setCurrentStore(response.data[0]);
      }
    } catch (err) {
      setError('Failed to fetch stores');
      console.error('Error fetching stores:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  return (
    <StoreContext.Provider value={{ stores, currentStore, setCurrentStore, fetchStores, isLoading, error }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStoreContext = () => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStoreContext must be used within a StoreProvider');
  }
  return context;
}; 