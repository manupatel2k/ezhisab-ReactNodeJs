import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash, Loader2, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import { lotteryAPI } from '@/lib/api';
import { Label } from '@/components/ui/label';

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
  onSubmit: (bookNumber: string) => Promise<void>;
}

// Data structure for lottery inventory items
interface InventoryItem {
  id: string;
  gameId: string;
  bookNumber: string;
  referenceNumber?: string;
  status: 'available' | 'activated' | 'sold' | 'returned' | 'settled';
  game: {
    id: string;
    gameNumber: string;
    gameName: string;
    price: number;
    ticketsPerBook: number;
    isActive: boolean;
  };
}

const InventoryDialog: React.FC<InventoryDialogProps> = ({ 
  open, 
  onOpenChange,
  storeId,
  onSubmit
}) => {
  const [bookNumber, setBookNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<any[]>([]);

  // Load inventory and games when dialog opens
  useEffect(() => {
    if (open && storeId) {
      loadInventory();
      loadGames();
    }
  }, [open, storeId]);

  const loadGames = async () => {
    try {
      const response = await lotteryAPI.getAllGames();
      setGames(response.data);
    } catch (err) {
      console.error('Failed to load games:', err);
    }
  };

  const loadInventory = async () => {
    if (!storeId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await lotteryAPI.getAllInventory(storeId);
      setInventory(response.data);
    } catch (err) {
      console.error('Failed to load inventory:', err);
      setError('Failed to load inventory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      toast.error('No store selected');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(bookNumber);
      setBookNumber(''); // Clear input on success
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    // In a real app, we would open an edit form
    toast.info(`Editing book with ID: ${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await lotteryAPI.deleteInventory(id);
      setInventory(inventory.filter(item => item.id !== id));
      toast.success('Book removed from inventory');
    } catch (err) {
      console.error('Failed to delete book:', err);
      toast.error('Failed to delete book. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'available':
        return 'text-green-600';
      case 'activated':
        return 'text-blue-600';
      case 'sold':
        return 'text-purple-600';
      case 'returned':
        return 'text-red-600';
      case 'settled':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Book to Inventory</DialogTitle>
          <DialogDescription>
            Enter the book number to add it to inventory. Format: XXX-XXXXXX-X
          </DialogDescription>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookNumber">Book Number</Label>
              <Input
                id="bookNumber"
                placeholder="XXX-XXXXXX-X"
                value={bookNumber}
                onChange={(e) => setBookNumber(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding to Inventory...
                </>
              ) : (
                'Add to Inventory'
              )}
            </Button>
          </div>
        </form>
        
        <div className="border rounded-md mt-4">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Game Name</th>
                  <th className="text-left p-2">Game Number</th>
                  <th className="text-left p-2">Book Number</th>
                  <th className="text-left p-2">Reference</th>
                  <th className="text-left p-2">Start Number</th>
                  <th className="text-left p-2">End Number</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length > 0 ? (
                  inventory.map((item) => {
                    // Calculate start number (ticketsPerBook - 1) and pad with zeros
                    const startNumber = (item.game.ticketsPerBook - 1).toString().padStart(3, '0');
                    // End number is always '000'
                    const endNumber = '000';
                    
                    return (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.game.gameName}</td>
                        <td className="p-2">{item.game.gameNumber}</td>
                        <td className="p-2">{item.bookNumber}</td>
                        <td className="p-2">{item.referenceNumber || 'N/A'}</td>
                        <td className="p-2">{startNumber}</td>
                        <td className="p-2">{endNumber}</td>
                        <td className={`p-2 ${getStatusColor(item.status)}`}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(item.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-muted-foreground">
                      No inventory items available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryDialog;
