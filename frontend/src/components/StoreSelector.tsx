import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStoreContext } from '@/context/StoreContext';
import { Loader2 } from 'lucide-react';

const StoreSelector: React.FC = () => {
  const { stores, currentStore, setCurrentStore, isLoading, error } = useStoreContext();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading stores...</span>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!stores.length) {
    return <div>No stores available</div>;
  }

  return (
    <Select value={currentStore?.id} onValueChange={(value) => {
      const store = stores.find(s => s.id === value);
      if (store) {
        setCurrentStore(store);
      }
    }}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select a store" />
      </SelectTrigger>
      <SelectContent>
        {stores.map((store) => (
          <SelectItem key={store.id} value={store.id}>
            {store.name} {store.location ? `- ${store.location}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default StoreSelector;
