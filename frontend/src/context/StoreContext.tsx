import React, { createContext, useContext, useState, useEffect } from 'react';
import { storeAPI } from '@/lib/api';
import { useAuthContext } from './AuthContext';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthContext();

  const fetchStores = async () => {
    if (!isAuthenticated) {
      setStores([]);
      setCurrentStore(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await storeAPI.getAll();
      setStores(response.data);
      if (response.data.length > 0 && !currentStore) {
        setCurrentStore(response.data[0]);
      }
    } catch (err: any) {
      // Don't set error if unauthorized - this is handled by auth context
      if (err.response?.status !== 401) {
        setError('Failed to fetch stores');
        console.error('Error fetching stores:', err);
      }
      setStores([]);
      setCurrentStore(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch stores when authenticated
    if (isAuthenticated) {
      fetchStores();
    }
  }, [isAuthenticated]); // Re-run when auth state changes

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