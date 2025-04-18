
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash } from 'lucide-react';
import { toast } from 'sonner';

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Data structure for lottery inventory items
interface InventoryItem {
  id: string;
  game: string;
  gameNumber: string;
  bookNumber: string;
  startNumber: string;
  endNumber: string;
  status: 'Available' | 'Activated' | 'Sold';
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ open, onOpenChange }) => {
  const [bookNumber, setBookNumber] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', game: 'Mil (#501)', gameNumber: '501', bookNumber: '222222', startNumber: '149', endNumber: '000', status: 'Available' },
    { id: '2', game: 'Mega Mil (#502)', gameNumber: '502', bookNumber: '333333', startNumber: '149', endNumber: '000', status: 'Available' },
    { id: '3', game: 'Mil (#501)', gameNumber: '501', bookNumber: '111111', startNumber: '149', endNumber: '000', status: 'Activated' },
    { id: '4', game: 'Mega Mil (#502)', gameNumber: '502', bookNumber: '222222', startNumber: '149', endNumber: '000', status: 'Sold' },
    { id: '5', game: 'Mega Mil (#502)', gameNumber: '502', bookNumber: '777777', startNumber: '149', endNumber: '000', status: 'Activated' },
  ]);

  const addToInventory = () => {
    if (!bookNumber.trim()) {
      toast.error('Please enter a book number');
      return;
    }
    
    // In a real app, we would make an API call to add the book
    toast.success('Book added to inventory successfully!');
    setBookNumber('');
  };

  const handleEdit = (id: string) => {
    // In a real app, we would open an edit form
    toast.info(`Editing book with ID: ${id}`);
  };

  const handleDelete = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
    toast.success('Book removed from inventory');
  };

  // Determine status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Available': return 'text-green-600';
      case 'Activated': return 'text-blue-600';
      case 'Sold': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Lottery Inventory Management - HM</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <h3 className="text-lg font-medium mb-2">Enter Book Number</h3>
          <div className="flex gap-4">
            <Input 
              placeholder="Scan or enter book number (e.g., 502-222222-2)" 
              value={bookNumber}
              onChange={(e) => setBookNumber(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={addToInventory}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              Add to Inventory
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-medium">Game</th>
                <th className="pb-2 font-medium">Book Number</th>
                <th className="pb-2 font-medium">Start Number</th>
                <th className="pb-2 font-medium">End Number</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-3">{item.game}</td>
                  <td className="py-3">{item.bookNumber}</td>
                  <td className="py-3">{item.startNumber}</td>
                  <td className="py-3">{item.endNumber}</td>
                  <td className={`py-3 ${getStatusColor(item.status)}`}>{item.status}</td>
                  <td className="py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEdit(item.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryDialog;
