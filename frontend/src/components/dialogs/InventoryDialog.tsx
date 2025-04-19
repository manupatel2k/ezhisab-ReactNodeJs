import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit, Trash, Loader2, Barcode } from 'lucide-react';
import { toast } from 'sonner';
import { lotteryAPI } from '@/lib/api';

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: string;
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

const InventoryDialog: React.FC<InventoryDialogProps> = ({ open, onOpenChange, storeId }) => {
  const [scanInput, setScanInput] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  const processScan = async () => {
    if (!scanInput.trim() || !storeId) {
      toast.error('Please scan or enter a lottery ticket');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Parse the scanned input to extract game number, book number, and reference
      // Expected format: XXX-XXXXXX-X (Game-Book-Reference)
      const parts = scanInput.split('-');
      
      if (parts.length !== 3) {
        toast.error('Invalid format. Expected format: XXX-XXXXXX-X');
        return;
      }
      
      const [gameNumber, bookNumber, referenceNumber] = parts;
      
      // Validate format
      if (!/^\d{3}$/.test(gameNumber) || !/^\d{6}$/.test(bookNumber) || !/^\d{1}$/.test(referenceNumber)) {
        toast.error('Invalid format. Game number should be 3 digits, book number 6 digits, and reference 1 digit');
        return;
      }
      
      // Check if the game exists in the master table
      const game = games.find(g => g.gameNumber === gameNumber);
      
      if (!game) {
        // Game not found - prompt user to add it to the master table
        toast.error(`Game ${gameNumber} not found. Please add it to the master table first.`);
        return;
      }
      
      // Check if the book is already in inventory
      const existingBook = inventory.find(item => 
        item.bookNumber === bookNumber && 
        item.game.gameNumber === gameNumber
      );
      
      if (existingBook) {
        toast.error('This book is already in inventory');
        return;
      }
      
      // Create inventory item
      const inventoryData = {
        storeId,
        gameId: game.id,
        bookNumber,
        referenceNumber,
        status: 'available'
      };
      
      await lotteryAPI.createInventory(inventoryData);
      toast.success('Book added to inventory successfully!');
      
      // Reload inventory
      await loadInventory();
      
      // Clear input
      setScanInput('');
    } catch (error: unknown) {
      console.error('Failed to add book to inventory:', error);
      
      if (error && typeof error === 'object' && 'response' in error && 
          error.response && typeof error.response === 'object' && 'status' in error.response && 
          error.response.status === 409) {
        toast.error('A book with this number already exists in inventory');
      } else {
        toast.error('Failed to add book to inventory. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processScan();
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
          <DialogTitle>Lottery Inventory Management</DialogTitle>
        </DialogHeader>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Scan or enter lottery ticket (XXX-XXXXXX-X)"
                value={scanInput}
                onChange={(e) => setScanInput(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSaving}
                className="pr-10"
              />
              <Barcode className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            <Button 
              onClick={processScan} 
              disabled={isSaving || !scanInput.trim()}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Add Book'
              )}
            </Button>
          </div>
          
          <div className="border rounded-md">
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryDialog;
