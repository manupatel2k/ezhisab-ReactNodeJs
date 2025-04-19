import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Barcode } from "lucide-react";
import { TabNavigation } from "@/components";
import { 
  Dialog,
  DialogTrigger 
} from "@/components/ui/dialog";
import LotteryGameDialog from "@/components/dialogs/LotteryGameDialog";
import InventoryDialog from "@/components/dialogs/InventoryDialog";
import { useStoreContext } from '@/context/StoreContext';
import { lotteryAPI } from '@/lib/api';
import { toast } from 'sonner';

interface LotteryActivatedBooksProps {
  data?: any[];
}

interface ActivatedBook {
  id: string;
  gameId: string;
  bookNumber: string;
  referenceNumber: string;
  status: string;
  activatedOn: string;
  game: {
    id: string;
    gameName: string;
    gameNumber: string;
    price: number;
    ticketsPerBook: number;
    isActive: boolean;
  };
}

interface LotteryGame {
  id: string;
  gameName: string;
  gameNumber: string;
  price: number;
  ticketsPerBook: number;
  isActive: boolean;
}

const LotteryActivatedBooks: React.FC<LotteryActivatedBooksProps> = ({ data = [] }) => {
  const [activeSection, setActiveSection] = useState<string>("activated");
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const { currentStore } = useStoreContext();
  
  // State for activated and returned books
  const [activatedBooks, setActivatedBooks] = useState<ActivatedBook[]>([]);
  const [returnedBooks, setReturnedBooks] = useState<ActivatedBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for scan input
  const [scanInput, setScanInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // State for manual activation
  const [manualGameNumber, setManualGameNumber] = useState('');
  const [manualBookNumber, setManualBookNumber] = useState('');
  const [manualReferenceNumber, setManualReferenceNumber] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  
  // State for return book
  const [returnGameNumber, setReturnGameNumber] = useState('');
  const [returnTicketNumber, setReturnTicketNumber] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  
  // State for games
  const [games, setGames] = useState<LotteryGame[]>([]);
  
  // State for pending activation
  const [pendingActivation, setPendingActivation] = useState<{
    bookNumber: string;
    gameNumber: string;
    bookNumber: string;
    referenceNumber: string;
  } | null>(null);
  
  const tabs = [
    { id: "activated", label: "Activated Books" },
    { id: "returned", label: "Returned Books" }
  ];

  // Load books and games when component mounts or store changes
  useEffect(() => {
    if (currentStore?.id) {
      loadBooks();
      loadGames();
    }
  }, [currentStore?.id, activeSection]);

  // Load games from API
  const loadGames = async () => {
    if (!currentStore?.id) return;
    
    try {
      const response = await lotteryAPI.getAllGames();
      setGames(response.data || []);
    } catch (error) {
      console.error('Failed to load games:', error);
    }
  };

  // Load books from API
  const loadBooks = async () => {
    if (!currentStore?.id) return;
    
    setIsLoading(true);
    try {
      const response = await lotteryAPI.getAllInventory(currentStore.id);
      const inventory = response.data || [];
      
      if (activeSection === "activated") {
        setActivatedBooks(inventory.filter((item: ActivatedBook) => item.status === 'activated'));
      } else {
        setReturnedBooks(inventory.filter((item: ActivatedBook) => item.status === 'returned'));
      }
    } catch (error) {
      console.error('Failed to load books:', error);
      toast.error('Failed to load books. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scan input change
  const handleScanInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScanInput(e.target.value);
  };

  // Handle scan input key press (Enter key)
  const handleScanInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScanAndActivate();
    }
  };

  // Handle scan and activate
  const handleScanAndActivate = async () => {
    if (!currentStore?.id) {
      toast.error('No store selected');
      return;
    }

    if (!scanInput.trim()) {
      toast.error('Please scan a book number');
      return;
    }

    // Validate book number format: XXX-XXXXXX-X
    const bookNumberRegex = /^\d{3}-\d{6}-\d{1}$/;
    if (!bookNumberRegex.test(scanInput.trim())) {
      toast.error('Invalid book number format. Expected format: XXX-XXXXXX-X');
      return;
    }

    setIsScanning(true);
    try {
      // Parse the scanned input to extract game number, book number, and reference
      const [gameNumber, bookNumber, referenceNumber] = scanInput.trim().split('-');
      
      // Check if the game exists in the master table
      const game = games.find(g => g.gameNumber === gameNumber);
      
      if (!game) {
        // Game not found - show dialog to add it to the master table
        setIsGameDialogOpen(true);
        // Store the book details to activate after game is added
        setPendingActivation({
          bookNumber: scanInput.trim(),
          gameNumber,
          bookNumber: bookNumber,
          referenceNumber
        });
        setIsScanning(false);
        return;
      }
      
      // Activate the book
      const formattedBookNumber = scanInput.trim();
      await lotteryAPI.activateBook(formattedBookNumber, currentStore.id);
      toast.success('Book activated successfully');
      setScanInput('');
      loadBooks();
    } catch (error: any) {
      console.error('Failed to activate book:', error);
      const errorMessage = error.response?.data?.message || 'Failed to activate book. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle game dialog close
  const handleGameDialogClose = async (saved: boolean) => {
    setIsGameDialogOpen(false);
    if (saved && pendingActivation) {
      // Reload games to get the newly added game
      await loadGames();
      // Activate the pending book
      try {
        await lotteryAPI.activateBook(pendingActivation.bookNumber, currentStore?.id);
        toast.success('Book activated successfully');
        setScanInput('');
        loadBooks();
      } catch (error: any) {
        console.error('Failed to activate book:', error);
        const errorMessage = error.response?.data?.message || 'Failed to activate book. Please try again.';
        toast.error(errorMessage);
      }
      setPendingActivation(null);
    }
  };

  // Handle manual activation
  const handleManualActivate = async () => {
    if (!currentStore?.id) {
      toast.error('No store selected');
      return;
    }

    if (!manualGameNumber || !manualBookNumber || !manualReferenceNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate each part of the book number
    if (!/^\d{3}$/.test(manualGameNumber)) {
      toast.error('Game number must be 3 digits');
      return;
    }
    if (!/^\d{6}$/.test(manualBookNumber)) {
      toast.error('Book number must be 6 digits');
      return;
    }
    if (!/^\d{1}$/.test(manualReferenceNumber)) {
      toast.error('Reference number must be 1 digit');
      return;
    }

    setIsActivating(true);
    try {
      // Check if the game exists in the master table
      const game = games.find(g => g.gameNumber === manualGameNumber);
      
      if (!game) {
        // Game not found - prompt user to add it to the master table
        toast.error(`Game ${manualGameNumber} not found. Please add it to the master table first.`);
        setIsGameDialogOpen(true);
        return;
      }
      
      // Activate the book
      const formattedBookNumber = `${manualGameNumber}-${manualBookNumber}-${manualReferenceNumber}`;
      await lotteryAPI.activateBook(formattedBookNumber, currentStore.id);
      toast.success('Book activated successfully');
      setManualGameNumber('');
      setManualBookNumber('');
      setManualReferenceNumber('');
      loadBooks();
    } catch (error: any) {
      console.error('Failed to activate book:', error);
      const errorMessage = error.response?.data?.message || 'Failed to activate book. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  // Handle return book
  const handleReturnBook = async () => {
    if (!currentStore?.id) {
      toast.error('No store selected');
      return;
    }

    if (!returnGameNumber || !returnTicketNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate each part of the book number
    if (!/^\d{3}$/.test(returnGameNumber)) {
      toast.error('Game number must be 3 digits');
      return;
    }
    if (!/^\d{6}$/.test(returnTicketNumber)) {
      toast.error('Ticket number must be 6 digits');
      return;
    }

    setIsReturning(true);
    try {
      // Return the book
      const formattedBookNumber = `${returnGameNumber}-${returnTicketNumber}-0`;
      await lotteryAPI.returnBook(formattedBookNumber, currentStore.id);
      
      toast.success('Book returned successfully');
      setReturnGameNumber('');
      setReturnTicketNumber('');
      loadBooks();
    } catch (error: any) {
      console.error('Failed to return book:', error);
      const errorMessage = error.response?.data?.message || 'Failed to return book. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsReturning(false);
    }
  };

  // Parse barcode for manual activation
  const parseBarcodeForManualActivation = (barcode: string) => {
    // Expected format: XXX-XXXXXX-X (Game-Book-Reference)
    const parts = barcode.split('-');
    
    if (parts.length !== 3) {
      toast.error('Invalid barcode format. Expected format: XXX-XXXXXX-X');
      return;
    }
    
    const [gameNumber, bookNumber, referenceNumber] = parts;
    
    // Validate format
    if (!/^\d{3}$/.test(gameNumber) || !/^\d{6}$/.test(bookNumber) || !/^\d{1}$/.test(referenceNumber)) {
      toast.error('Invalid format. Game number should be 3 digits, book number 6 digits, and reference 1 digit');
      return;
    }
    
    // Set the values in the manual activation fields
    setManualGameNumber(gameNumber);
    setManualBookNumber(bookNumber);
    setManualReferenceNumber(referenceNumber);
  };

  return (
    <div className="bg-card rounded-md shadow mt-4 border border-border">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-foreground">Lottery Activated Books</h2>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setIsGameDialogOpen(true)}
            >
              Manage Games
            </Button>
            <Button 
              variant="default" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setIsInventoryDialogOpen(true)}
            >
              Manage Inventory
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-md p-3 bg-card">
            <h3 className="font-medium mb-2 text-foreground">Scan Code and Activate</h3>
            <div className="flex mb-2">
              <input 
                type="text" 
                placeholder="Scan Book Number" 
                className="border border-input rounded-l-md px-3 py-2 flex-1 bg-background text-foreground placeholder:text-muted-foreground"
                value={scanInput}
                onChange={handleScanInputChange}
                onKeyPress={handleScanInputKeyPress}
                disabled={isScanning}
              />
              <Button 
                variant="ghost" 
                className="rounded-l-none border border-l-0 border-input"
                onClick={handleScanAndActivate}
                disabled={isScanning}
              >
                {isScanning ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Format: XXX-XXXXXX-X</p>
          </div>

          <div className="border border-border rounded-md p-3 bg-card">
            <h3 className="font-medium mb-2 text-foreground">Activate Manually</h3>
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan or Enter Game Number (XXX)" 
                  className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground pr-10"
                  value={manualGameNumber}
                  onChange={(e) => setManualGameNumber(e.target.value)}
                  disabled={isActivating}
                />
                <Barcode 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" 
                  onClick={() => {
                    const barcode = prompt("Scan or enter barcode:");
                    if (barcode) {
                      parseBarcodeForManualActivation(barcode);
                    }
                  }}
                />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan or Enter Book Number (XXXXXX)" 
                  className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground pr-10"
                  value={manualBookNumber}
                  onChange={(e) => setManualBookNumber(e.target.value)}
                  disabled={isActivating}
                />
                <Barcode 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" 
                  onClick={() => {
                    const barcode = prompt("Scan or enter barcode:");
                    if (barcode) {
                      parseBarcodeForManualActivation(barcode);
                    }
                  }}
                />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan or Enter Reference Number (X)" 
                  className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground pr-10"
                  value={manualReferenceNumber}
                  onChange={(e) => setManualReferenceNumber(e.target.value)}
                  disabled={isActivating}
                />
                <Barcode 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" 
                  onClick={() => {
                    const barcode = prompt("Scan or enter barcode:");
                    if (barcode) {
                      parseBarcodeForManualActivation(barcode);
                    }
                  }}
                />
              </div>
            </div>
            <Button 
              variant="default" 
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleManualActivate}
              disabled={isActivating}
            >
              {isActivating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate'
              )}
            </Button>
          </div>

          <div className="border border-border rounded-md p-3 bg-card">
            <h3 className="font-medium mb-2 text-foreground">Return Book</h3>
            <div className="space-y-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan or Enter Game Number (XXX)" 
                  className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground pr-10"
                  value={returnGameNumber}
                  onChange={(e) => setReturnGameNumber(e.target.value)}
                  disabled={isReturning}
                />
                <Barcode 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" 
                  onClick={() => {
                    const barcode = prompt("Scan or enter barcode:");
                    if (barcode) {
                      const parts = barcode.split('-');
                      if (parts.length >= 1) {
                        setReturnGameNumber(parts[0]);
                      }
                      if (parts.length >= 2) {
                        setReturnTicketNumber(parts[1]);
                      }
                    }
                  }}
                />
              </div>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Scan or Enter Ticket Number (XXXXXX)" 
                  className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground placeholder:text-muted-foreground pr-10"
                  value={returnTicketNumber}
                  onChange={(e) => setReturnTicketNumber(e.target.value)}
                  disabled={isReturning}
                />
                <Barcode 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" 
                  onClick={() => {
                    const barcode = prompt("Scan or enter barcode:");
                    if (barcode) {
                      const parts = barcode.split('-');
                      if (parts.length >= 1) {
                        setReturnGameNumber(parts[0]);
                      }
                      if (parts.length >= 2) {
                        setReturnTicketNumber(parts[1]);
                      }
                    }
                  }}
                />
              </div>
            </div>
            <Button 
              variant="default" 
              className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleReturnBook}
              disabled={isReturning}
            >
              {isReturning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Returning...
                </>
              ) : (
                'Return Now'
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="border-t border-border">
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeSection} 
          onChange={setActiveSection} 
        />

        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-2 text-foreground">No</th>
                  <th className="pb-2 text-foreground">Game Name</th>
                  <th className="pb-2 text-foreground">Game Number</th>
                  <th className="pb-2 text-foreground">Book Number</th>
                  <th className="pb-2 text-foreground">Reference</th>
                  <th className="pb-2 text-foreground">Status</th>
                  <th className="pb-2 text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : activeSection === "activated" ? (
                  activatedBooks.length > 0 ? (
                    activatedBooks.map((book, index) => (
                      <tr key={book.id} className="border-b border-border">
                        <td className="py-2">{index + 1}</td>
                        <td>{book.game.gameName}</td>
                        <td>{book.game.gameNumber}</td>
                        <td>{book.bookNumber}</td>
                        <td>{book.referenceNumber}</td>
                        <td>
                          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {book.status}
                          </span>
                        </td>
                        <td>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setReturnGameNumber(book.game.gameNumber);
                              setReturnTicketNumber(book.bookNumber);
                            }}
                          >
                            Return
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted-foreground">
                        No activated books available
                      </td>
                    </tr>
                  )
                ) : (
                  returnedBooks.length > 0 ? (
                    returnedBooks.map((book, index) => (
                      <tr key={book.id} className="border-b border-border">
                        <td className="py-2">{index + 1}</td>
                        <td>{book.game.gameName}</td>
                        <td>{book.game.gameNumber}</td>
                        <td>{book.bookNumber}</td>
                        <td>{book.referenceNumber}</td>
                        <td>
                          <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                            {book.status}
                          </span>
                        </td>
                        <td>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setManualGameNumber(book.game.gameNumber);
                              setManualBookNumber(book.bookNumber);
                              setManualReferenceNumber(book.referenceNumber);
                            }}
                          >
                            Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-4 text-muted-foreground">
                        No returned books available
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogs for Lottery management */}
      <Dialog open={isGameDialogOpen} onOpenChange={(open) => !open && handleGameDialogClose(false)}>
        <LotteryGameDialog 
          open={isGameDialogOpen} 
          onOpenChange={(open) => !open && handleGameDialogClose(true)} 
        />
      </Dialog>
      
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <InventoryDialog 
          open={isInventoryDialogOpen} 
          onOpenChange={setIsInventoryDialogOpen} 
          storeId={currentStore?.id}
        />
      </Dialog>
    </div>
  );
};

export default LotteryActivatedBooks;
