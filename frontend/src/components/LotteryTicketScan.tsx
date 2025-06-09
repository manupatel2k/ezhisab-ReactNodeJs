import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';
import { lotteryAPI } from '@/lib/api';
import { useStoreContext } from '@/context/StoreContext';
import TicketScanErrorModal from './TicketScanErrorModal';
import { toast } from 'sonner';

interface ScanTicket {
  id: string;
  price: string;
  gameName: string;
  gameNumber: string;
  bookNumber: string;
  status: string;
  activatedOn: string;
  overAllTickets: string;
  shiftStartedTicket: string;
  currentTicket: string;
  quantitySold: number;
  total: string;
}

// Define ActivatedBook type based on previous usage in LotteryActivatedBooks.tsx
interface ActivatedBook {
  id: string;
  bookNumber: string;
  status: string;
  game?: {
    id: string;
    gameNumber: string;
    gameName: string;
    price: number;
    ticketsPerBook: number;
  };
}

interface LotteryTicketScanProps {
  data?: ScanTicket[];
  onTicketScanned: (ticket: ScanTicket) => void;
  className?: string;
}

const LotteryTicketScan: React.FC<LotteryTicketScanProps> = ({ data = [], onTicketScanned, className }) => {
  const { currentStore } = useStoreContext();
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [scanNumber, setScanNumber] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [instantSaleTotal, setInstantSaleTotal] = useState(0);
  const [showTicketScanError, setShowTicketScanError] = useState(false);
  const [ticketScanErrorDetails, setTicketScanErrorDetails] = useState<{
    bookNumber: string;
    gameName: string;
    yesterdayTicket: string;
    currentTicket: string;
  } | null>(null);

  // Calculate instant sale total whenever tickets change
  useEffect(() => {
    const total = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.total), 0);
    setInstantSaleTotal(total);
  }, [tickets]);

  // Preprocess ticket number from barcode
  const preprocessTicketNumber = (input: string): string => {
    // Remove any non-numeric characters except for '-'
    const cleanedInput = input.replace(/[^\d-]/g, '');
    
    // If input already contains hyphens, validate and return if correct format
    if (cleanedInput.includes('-')) {
        const parts = cleanedInput.split('-');
        if (parts.length === 3 && 
            parts[0].length === 3 && 
            parts[1].length === 6 && 
            parts[2].length === 3) {
            return cleanedInput;
        }
    }
    
    // For input like: 35503541180493000000000000000 or 355-354118-049
    // 355 - game number (first 3)
    // 0 or - - separator
    // 354118 - book number (next 6)
    // 049 - ticket number (next 3)
    const numericOnly = cleanedInput.replace(/\D/g, '');
    
    if (numericOnly.length >= 13) {
        const gameNumber = numericOnly.slice(0, 3);
        // Check if there's a separator (0) at position 3
        const hasSeparator = numericOnly[3] === '0';
        const startIndex = hasSeparator ? 4 : 3;
        const bookNumber = numericOnly.slice(startIndex, startIndex + 6);
        const ticketNumber = numericOnly.slice(startIndex + 6, startIndex + 9);
        
        // Format in the expected XXX-XXXXXX-XXX pattern
        return `${gameNumber}-${bookNumber}-${ticketNumber}`;
    }
    
    return input; // Return original input if it doesn't match the expected pattern
  };

  // Find the last scanned ticket for a book
  const findLastScannedTicket = async (
    storeId: string,
    gameId: string,
    bookNumber: string,
    currentDate: Date
  ): Promise<{ lastTicket: string | null; reportDate: Date | null }> => {
    try {
      // Get all reports for this store up to the current date
      const response = await lotteryAPI.getDailyReport(storeId, {
        endDate: format(currentDate, 'yyyy-MM-dd'),
        includeScannedTickets: true
      });

      const reports = response.data || [];
      
      // Sort reports by date in descending order
      const sortedReports = reports.sort((a, b) => 
        new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
      );

      // Find the most recent scanned ticket for this book
      for (const report of sortedReports) {
        const scannedTicket = report.scannedTickets?.find(ticket => 
          ticket.gameId === gameId && 
          ticket.bookNumber === bookNumber
        );

        if (scannedTicket) {
          return {
            lastTicket: scannedTicket.currentTicket,
            reportDate: new Date(report.reportDate)
          };
        }
      }

      // If no previous scan found
      return {
        lastTicket: null,
        reportDate: null
      };
    } catch (error) {
      console.error('Error finding last scanned ticket:', error);
      // Return null values if there's an error
      return {
        lastTicket: null,
        reportDate: null
      };
    }
  };

  // Validate ticket format
  const validateTicketFormat = (scan: string): boolean => {
    // Format: XXX-XXXXXX-XXX (Game-Book-Ticket)
    const regex = /^\d{3}-\d{6}-\d{3}$/;
    return regex.test(scan);
  };

  // Extract ticket information from scan
  const extractTicketInfo = (scan: string): { gameNumber: string, bookNumber: string, ticketNumber: string } | null => {
    if (!validateTicketFormat(scan)) {
      // Use toast for invalid format
      toast.error("Invalid ticket format. Expected format: XXX-XXXXXX-XXX");
      return null;
    }

    const parts = scan.split('-');
    return {
      gameNumber: parts[0],
      bookNumber: parts[1],
      ticketNumber: parts[2]
    };
  };

  // Process a scanned ticket
  const processScan = async (scan: string) => {
    setError(null);
    
    if (!currentStore?.id) {
      setError("Please select a store first");
      return;
    }
    
    // Extract ticket information
    const ticketInfo = extractTicketInfo(scan);
    if (!ticketInfo) {
      return;
    }
    
    const { gameNumber, bookNumber, ticketNumber } = ticketInfo;
    
    try {
      // Check if book exists in inventory and is activated
      const response = await lotteryAPI.getAllInventory(currentStore.id);
      const inventory = response.data || [];
      
      if (!Array.isArray(inventory)) {
        console.error('Invalid inventory response:', inventory);
        setError('Failed to load inventory data');
        return;
      }

      const existingBook = inventory.find((item: any) => 
        item.bookNumber === bookNumber && 
        item.game?.gameNumber === gameNumber &&
        item.status === 'activated'
      );

      if (!existingBook) {
        // Use toast for book not found/activated
        toast.error('Book not found or not activated. Please activate the book first.');
        return;
      }

      if (!existingBook.game) {
        setError('Invalid book data: game information is missing');
        return;
      }

      // Validate required game properties
      if (typeof existingBook.game.price !== 'number' || 
          typeof existingBook.game.ticketsPerBook !== 'number' ||
          !existingBook.game.gameName) {
        setError('Invalid game data: missing required properties');
        return;
      }

      // Check for duplicate scans on the same day
      const today = format(new Date(), 'yyyy-MM-dd');
      const isDuplicate = tickets.some(ticket => 
        ticket.gameNumber === gameNumber &&
        ticket.bookNumber === bookNumber &&
        ticket.currentTicket === ticketNumber &&
        format(new Date(ticket.activatedOn), 'yyyy-MM-dd') === today
      );

      if (isDuplicate) {
        setError('This ticket has already been scanned today.');
        return;
      }

      // Find the last scanned ticket from previous reports
      const { lastTicket: lastScannedTicketNumber } = 
        await findLastScannedTicket(currentStore.id, existingBook.game.id, bookNumber, new Date());
      
      if (lastScannedTicketNumber) {
        const lastTicketNumber = parseInt(lastScannedTicketNumber);
        const currentTicketNumber = parseInt(ticketNumber);

        if (currentTicketNumber > lastTicketNumber) {
          // Show error modal with details
          setTicketScanErrorDetails({
            bookNumber,
            gameName: existingBook.game.gameName,
            yesterdayTicket: lastScannedTicketNumber,
            currentTicket: ticketNumber
          });
          setShowTicketScanError(true);
          setScanNumber('');
          return;
        }
      }

      // Initialize variables
      let quantitySold = 0;

      // Get the starting ticket number - use lastScannedTicketNumber if available, otherwise use book's reference number
      const shiftStartTicket = lastScannedTicketNumber || (existingBook.game.ticketsPerBook > 0 ? existingBook.game.ticketsPerBook -1 : 0);
      
      // Corrected logic based on user request for quantitySold calculation
      // Quantity Sold = Shift Started with Ticket No - Current Ticket No
      const startNumber = parseInt(shiftStartTicket.toString());
      const currentTicketNumber = parseInt(ticketNumber);

      quantitySold = startNumber - currentTicketNumber; 

      if (!shiftStartTicket && shiftStartTicket !== 0) {
        console.warn("Calculated quantity sold is negative. Check start/current ticket numbers.", {shiftStartTicket});
        quantitySold = 0; // Or handle this case based on business logic
      }

      if (quantitySold > existingBook.game.ticketsPerBook) {
        setError(`Invalid ticket number. Calculated quantity sold (${quantitySold}) exceeds total tickets per book (${existingBook.game.ticketsPerBook}).`);
        return;
      }

      const total = (quantitySold * existingBook.game.price).toFixed(2);
    
      // Create new ticket record
      const newTicket: ScanTicket = {
        id: crypto.randomUUID(),
        price: existingBook.game.price.toFixed(2),
        gameName: existingBook.game.gameName,
        gameNumber,
        bookNumber,
        status: "Active",
        activatedOn: new Date().toISOString().split('T')[0],
        overAllTickets: existingBook.game.ticketsPerBook.toString(),
        shiftStartedTicket: shiftStartTicket.toString(),
        currentTicket: ticketNumber,
        quantitySold,
        total
      };
    
      // Add to tickets list
      setTickets([...tickets, newTicket]);
      setLastScanned(ticketNumber);
      
      // Call the callback to pass data up to the parent (Index.tsx)
      onTicketScanned(newTicket);

      // Clear scan input
      setScanNumber('');

    } catch (error) {
      console.error('Error scanning ticket:', error);
      // Keep the specific error check for the error modal
       if (typeof error === 'object' && error !== null && 'response' in error) {
            const axiosError = error as { response?: { data?: { message?: string } } };
             if (axiosError.response?.data?.message === 'This book is already activated.') { // Check for already activated explicitly
                 toast.error('This book is already activated.'); // Show as toast
             } else 
             {
                 setError(axiosError.response?.data?.message || 'Failed to process ticket'); // Other API errors as Alert
             }
        } else if (error instanceof Error) {
             setError(error.message); // Other general errors as Alert
        } else {
             setError('Failed to process ticket'); // Unknown errors as Alert
        }

      setScanNumber('');
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanNumber.trim()) {
      const processedScan = preprocessTicketNumber(scanNumber.trim());
      processScan(processedScan);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Scan Input Section in its own card */}
      <div className="bg-card rounded-md shadow border border-border p-4">
        <form onSubmit={handleScanSubmit} className="flex gap-2">
              <input 
                type="text" 
            placeholder="Scan or Enter Ticket Number"
                value={scanNumber}
            onChange={e => setScanNumber(e.target.value)}
            className="border rounded px-2 py-1 flex-1"
          />
          <Button type="submit" variant="default">Scan</Button>
        </form>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Game Price</TableHead>
                <TableHead>Game Name</TableHead>
                <TableHead>Game Number</TableHead>
                <TableHead>Book Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activated On</TableHead>
                <TableHead>Over All Tickets</TableHead>
                <TableHead>Shift Started with Ticket No</TableHead>
                <TableHead>Current Ticket No</TableHead>
                <TableHead>Quantity Sold</TableHead>
                <TableHead>Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
          {tickets.map((ticket, index) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>${parseFloat(ticket.price).toFixed(2)}</TableCell>
                    <TableCell>{ticket.gameName}</TableCell>
                    <TableCell>{ticket.gameNumber}</TableCell>
                    <TableCell>{ticket.bookNumber}</TableCell>
                    <TableCell>{ticket.status}</TableCell>
                    <TableCell>{ticket.activatedOn}</TableCell>
                    <TableCell>{ticket.overAllTickets}</TableCell>
                    <TableCell>{ticket.shiftStartedTicket}</TableCell>
                    <TableCell>{ticket.currentTicket}</TableCell>
                    <TableCell>{ticket.quantitySold}</TableCell>
                    <TableCell>${parseFloat(ticket.total).toFixed(2)}</TableCell>
                  </TableRow>
          ))}
            </TableBody>
          </Table>
      <div className="mt-4 font-bold">Instant Sale Total: ${instantSaleTotal.toFixed(2)}</div>
      {showTicketScanError && ticketScanErrorDetails && (
        <TicketScanErrorModal
          isOpen={showTicketScanError}
          onClose={() => setShowTicketScanError(false)}
          errorDetails={ticketScanErrorDetails}
        />
      )}
    </div>
  );
};

export default LotteryTicketScan; 