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
  
  // State for errors
  const [error, setError] = useState<string | null>(null);
  
  // State for return book
  const [returnGameNumber, setReturnGameNumber] = useState('');
  const [returnTicketNumber, setReturnTicketNumber] = useState('');
  const [isReturning, setIsReturning] = useState(false);
  
  // State for games
  const [games, setGames] = useState<LotteryGame[]>([]);
  
  // State for game number to add
  const [gameNumberToAdd, setGameNumberToAdd] = useState<string | null>(null);
  
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
      const inventory: ActivatedBook[] = response.data || [];
      
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

  // Add preprocessTicketNumber function
  const preprocessTicketNumber = (input: string): string => {
    // Remove any non-numeric characters except for '-'
    const cleanedInput = input.replace(/[^\d-]/g, '');
    
    // If input already contains hyphens, extract and return the middle part if format is correct
    if (cleanedInput.includes('-')) {
        const parts = cleanedInput.split('-');
        if (parts.length === 3 && 
            parts[0].length === 3 && 
            parts[1].length === 6 && 
            parts[2].length === 1) { 
            return parts[1]; // Return only the book number part (XXXXXX)
        }
    }
    
    // For input like: 35503541180493000000000000000 or 355-354118-0
    // We need at least 10 digits (3 game, 1 separator, 6 book, 1 reference)
    const numericOnly = cleanedInput.replace(/\D/g, '');
    
    if (numericOnly.length >= 10) {
        // If there's a '0' at index 3 (after 3 game digits), book starts at index 4
        // Otherwise, book starts at index 3
        const startIndex = numericOnly[3] === '0' ? 4 : 3;
        const bookNumber = numericOnly.slice(startIndex, startIndex + 6);
        return bookNumber; // Return only the book number part (XXXXXX)
    }
    
    return ''; // Return empty string if format is not recognized
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

  // Update handleScanAndActivate
  const handleScanAndActivate = async () => {
    if (!currentStore?.id) {
      toast.error('No store selected');
      return;
    }

    const currentScanInput = scanInput.trim();

    if (!currentScanInput) {
      toast.error('Please scan a book number');
      return;
    }

    // Preprocess the input to extract only the book number (XXXXXX)
    const bookNumber = preprocessTicketNumber(currentScanInput);
    
    // Validate extracted book number format: XXXXXX
    const bookNumberRegex = /^\d{6}$/;
    if (!bookNumberRegex.test(bookNumber)) {
      toast.error('Invalid book number format. Expected format: XXXXXX');
      return;
    }

    setIsScanning(true);
    setError(null);

    try {
      // We need the game number to check against the master table.
      // Extract game number from the original input before preprocessing.
      const originalParts = currentScanInput.replace(/[^\d-]/g, '').split('-');
      let gameNumber = '';
      if (originalParts.length >= 1) {
        gameNumber = originalParts[0].slice(0, 3);
      } else {
         // If no hyphen, try extracting from purely numeric input
         const numericOnlyOriginal = currentScanInput.replace(/\D/g, '');
         if (numericOnlyOriginal.length >= 3) {
            gameNumber = numericOnlyOriginal.slice(0, 3);
         }
      }

      if (!gameNumber) {
          toast.error('Could not extract game number from input.');
          setIsScanning(false);
          return;
      }
      
      // Check if the game exists in the master table using the extracted gameNumber
      const game = games.find(g => g.gameNumber === gameNumber);
      
      if (!game) {
        setGameNumberToAdd(gameNumber);
        setIsGameDialogOpen(true);
        setIsScanning(false);
        return;
      }

      // Check if the book exists in inventory using the extracted bookNumber (XXXXXX)
      const response = await lotteryAPI.getAllInventory(currentStore.id);
      
      // Use type assertion based on the ActivatedBook interface
      const inventory: ActivatedBook[] = response.data || [];
      
      const existingBook = inventory.find(item => item.bookNumber === bookNumber);

      if (existingBook) {
        if (existingBook.status === 'activated') {
          toast.error('This book is already activated.');
          setScanInput('');
          return;
        } else {
           // Activate the book using the extracted bookNumber
           await lotteryAPI.activateBook(bookNumber, currentStore.id);
           toast.success('Book activated successfully');
        }
      } else {
        // Book not in inventory, add it and activate it using the extracted bookNumber
        await lotteryAPI.createInventory({
          gameId: game.id,
          bookNumber: bookNumber, // Use the extracted bookNumber
          storeId: currentStore.id,
          status: 'activated'
        });
        toast.success('Book added to inventory and activated');
      }

      setScanInput('');
      loadBooks();
    } catch (error: any) {
      console.error('Failed to process book:', error);
      if (!(error.response?.data?.message === 'This book is already activated.')) {
         const errorMessage = error.response?.data?.message || 'Failed to process book. Please try again.';
         toast.error(errorMessage);
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Update handleManageInventorySubmit
  const handleManageInventorySubmit = async (bookNumberInput: string) => {
    if (!currentStore?.id) {
      toast.error('No store selected');
      return;
    }

    // Preprocess the input to extract only the book number (XXXXXX)
    const bookNumber = preprocessTicketNumber(bookNumberInput);
    
    // Validate extracted book number format: XXXXXX
    const bookNumberRegex = /^\d{6}$/;
    if (!bookNumberRegex.test(bookNumber)) {
      toast.error('Invalid book number format. Expected format: XXXXXX');
      return;
    }

    try {
      // We need the game number to check against the master table.
      // Extract game number from the original input before preprocessing.
      const originalParts = bookNumberInput.replace(/[^\d-]/g, '').split('-');
      let gameNumber = '';
      if (originalParts.length >= 1) {
        gameNumber = originalParts[0].slice(0, 3);
      } else {
         // If no hyphen, try extracting from purely numeric input
         const numericOnlyOriginal = bookNumberInput.replace(/\D/g, '');
         if (numericOnlyOriginal.length >= 3) {
            gameNumber = numericOnlyOriginal.slice(0, 3);
         }
      }

      if (!gameNumber) {
          toast.error('Could not extract game number from input.');
          return;
      }

      // Check if the game exists in the master table using the extracted gameNumber
      const game = games.find(g => g.gameNumber === gameNumber);
      
      if (!game) {
        setGameNumberToAdd(gameNumber);
        setIsGameDialogOpen(true);
        return;
      }

      // Check if the book exists in inventory using the extracted bookNumber (XXXXXX)
      const response = await lotteryAPI.getAllInventory(currentStore.id);
      // Use type assertion based on the ActivatedBook interface
      const inventory: ActivatedBook[] = response.data || [];
      
      const existingBook = inventory.find(item => item.bookNumber === bookNumber);

      if (existingBook) {
        toast.error('Book already exists in inventory');
        return;
      }

      // Add book to inventory with 'available' status using the extracted bookNumber
      await lotteryAPI.createInventory({
        gameId: game.id,
        bookNumber: bookNumber, // Use the extracted bookNumber
        storeId: currentStore.id,
        status: 'available'
      });

      toast.success('Book added to inventory');
      loadBooks();
    } catch (error: any) {
      console.error('Failed to add book to inventory:', error);
      const errorMessage = error.response?.data?.message || 'Failed to add book to inventory. Please try again.';
      toast.error(errorMessage);
    }
  };

  // Handle game dialog close
  const handleGameDialogClose = async (saved: boolean) => {
    setIsGameDialogOpen(false);
    if (saved) {
      // Reload games to get the newly added game
      await loadGames();
      // If we have a pending scan input, retry the operation
      if (scanInput) {
        handleScanAndActivate();
      }
    }
    setGameNumberToAdd(null);
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
    // We now use only the 6-digit book number for return
    if (!/^\d{6}$/.test(returnTicketNumber)) {
      toast.error('Book number must be 6 digits');
      return;
    }

    setIsReturning(true);
    try {
      // Return the book using the 6-digit book number
      await lotteryAPI.returnBook(returnTicketNumber, currentStore.id);
      
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

  // Parse barcode for manual activation - Keep this for the scan input
  const parseBarcodeForManualActivation = (barcode: string) => {
    // Expected format: XXX-XXXXXX-X (Game-Book-Reference)
    const parts = barcode.split('-');
    
    if (parts.length !== 3) {
      toast.error('Invalid barcode format. Expected format: XXX-XXXXXX-X');
      return null; // Return null if format is incorrect
    }
    
    const [gameNumber, bookNumber, referenceNumber] = parts;
    
    // Validate format
    if (!/^\d{3}$/.test(gameNumber) || !/^\d{6}$/.test(bookNumber) || !/^\d{1}$/.test(referenceNumber)) {
      toast.error('Invalid format. Game number should be 3 digits, book number 6 digits, and reference 1 digit');
      return null; // Return null if format is incorrect
    }
    
    // Return the extracted game number and book number
    return { gameNumber, bookNumber };
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

        {/* Adjusted grid layout for scan and return sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <Camera className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Scan Format: XXX-XXXXXX-X or numeric only</p>
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
                      // Keep only the book number for return
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
                  placeholder="Scan or Enter Book Number (XXXXXX)" 
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
                       // Keep only the book number for return
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
                  <th className="pb-2 text-foreground">Status</th>
                  <th className="pb-2 text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
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
                      <td colSpan={6} className="text-center py-4 text-muted-foreground">
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
                              // The manual activation section is removed, this button will no longer exist
                              // setManualGameNumber(book.game.gameNumber);
                              // setManualBookNumber(book.bookNumber);
                              // setManualReferenceNumber(book.referenceNumber);
                            }}
                          >
                            Reactivate
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted-foreground">
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
      <Dialog 
        open={isGameDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            handleGameDialogClose(false);
          }
        }}
      >
        <LotteryGameDialog 
          open={isGameDialogOpen} 
          onOpenChange={(open) => {
            if (!open) {
              handleGameDialogClose(false);
            } else {
              handleGameDialogClose(true);
            }
          }}
          initialGameNumber={gameNumberToAdd}
        />
      </Dialog>
      
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <InventoryDialog 
          open={isInventoryDialogOpen} 
          onOpenChange={setIsInventoryDialogOpen}
          storeId={currentStore?.id}
          onSubmit={handleManageInventorySubmit}
        />
      </Dialog>
    </div>
  );
};

export default LotteryActivatedBooks;
