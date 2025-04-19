import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from 'date-fns';
import { lotteryAPI } from '@/lib/api';
import { useStoreContext } from '@/context/StoreContext';

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

interface LotteryTicketScanProps {
  data?: ScanTicket[];
}

const LotteryTicketScan: React.FC<LotteryTicketScanProps> = ({ data = [] }) => {
  const { currentStore } = useStoreContext();
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [scanNumber, setScanNumber] = useState('');
  const [gameNumber, setGameNumber] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
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

  const findLastScannedTicket = async (storeId: string, gameId: string, bookNumber: string, currentDate: Date, maxDaysBack: number = 30): Promise<{
    lastTicket: string | null;
    reportDate: string | null;
  }> => {
    try {
      const formattedDate = format(currentDate, 'yyyy-MM-dd');
      console.log('Checking for scanned tickets on:', formattedDate);

      // First, get the book's activation date
      const response = await lotteryAPI.getAllInventory(storeId);
      const inventory = response.data || [];
      
      if (!Array.isArray(inventory)) {
        console.error('Invalid inventory response:', inventory);
        return { lastTicket: null, reportDate: null };
      }

      const book = inventory.find((item: any) => 
        item.bookNumber === bookNumber && 
        item.gameId === gameId
      );

      if (!book) {
        console.log('Book not found in inventory');
        return { lastTicket: null, reportDate: null };
      }

      // Get activation date in YYYY-MM-DD format
      const activationDate = format(new Date(book.createdAt), 'yyyy-MM-dd');
      console.log('Book activation date:', activationDate);

      // If current check date is before activation date, stop searching
      if (formattedDate < activationDate) {
        console.log('Reached date before book activation, stopping search');
        return { lastTicket: null, reportDate: null };
      }
      
      // Get the daily report for this date
      const report = await lotteryAPI.getDailyReport(formattedDate, storeId);
      
      // If we found a report with scanned tickets
      if (report?.scannedTickets?.length > 0) {
        const matchingTickets = report.scannedTickets
          .filter((t: any) => t.gameId === gameId && t.bookNumber === bookNumber)
          .sort((a: any, b: any) => b.currentTicket.localeCompare(a.currentTicket));

        if (matchingTickets.length > 0) {
          console.log('Found matching ticket:', matchingTickets[0]);
          // Stop searching since we found a match
          return {
            lastTicket: matchingTickets[0].currentTicket,
            reportDate: formattedDate
          };
        }
      }

      // Stop if we've reached the maximum days to look back
      if (maxDaysBack <= 0) {
        console.log('Reached maximum days to look back, stopping search');
        return { lastTicket: null, reportDate: null };
      }

      // If no matching tickets found in this report, check the previous day
      const previousDay = new Date(currentDate);
      previousDay.setDate(previousDay.getDate() - 1);
      
      // Recursive call to check previous day with decremented maxDaysBack
      return findLastScannedTicket(storeId, gameId, bookNumber, previousDay, maxDaysBack - 1);
      
    } catch (error) {
      console.error('Error finding last scanned ticket:', error);
      return { lastTicket: null, reportDate: null };
    }
  };

  const validateTicketFormat = (scan: string): boolean => {
    // Format: XXX-XXXXXX-XXX (Game-Book-Ticket)
    const regex = /^\d{3}-\d{6}-\d{3}$/;
    return regex.test(scan);
  };

  const extractTicketInfo = (scan: string): { gameNumber: string, bookNumber: string, ticketNumber: string } | null => {
    if (!validateTicketFormat(scan)) {
      return null;
    }

    const parts = scan.split('-');
    return {
      gameNumber: parts[0],
      bookNumber: parts[1],
      ticketNumber: parts[2]
    };
  };

  const processScan = async (scan: string) => {
    setError(null);
    
    if (!currentStore?.id) {
      setError("Please select a store first");
      return;
    }
    
    // Extract ticket information
    const ticketInfo = extractTicketInfo(scan);
    if (!ticketInfo) {
      setError("Invalid ticket format. Expected format: XXX-XXXXXX-XXX");
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
        setError('Book not found or not activated. Please activate the book first.');
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
        format(new Date(ticket.activatedOn), 'yyyy-MM-dd') === today
      );

      if (isDuplicate) {
        setError('This book has already been scanned today.');
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

      // Get the starting ticket number - use lastScannedTicketNumber if available, otherwise use book's reference number
      const bookStartNumber = lastScannedTicketNumber || existingBook.referenceNumber;
      if (!bookStartNumber) {
        setError('Invalid book data: reference number is missing');
        return;
      }

      console.log('Using start number:', bookStartNumber, lastScannedTicketNumber ? '(from last scan)' : '(from book reference)');

      // Initialize variables
      let shiftStartTicket = bookStartNumber;
      let quantitySold = 0;

      // Calculate quantity sold
      const startNumber = parseInt(shiftStartTicket);
      const currentTicketNumber = parseInt(ticketNumber);
      
      // Calculate how many tickets have been sold (start number - current ticket + 1)
      // For example: if start is 150 and current is 145, then 150 - 145 + 1 = 6 tickets sold
      quantitySold = startNumber - currentTicketNumber + 1;

      if (quantitySold < 0) {
        setError('Invalid ticket number. Current ticket number is greater than start number.');
        return;
      }

      if (quantitySold > existingBook.game.ticketsPerBook) {
        setError(`Invalid ticket number. Quantity sold (${quantitySold}) exceeds total tickets per book (${existingBook.game.ticketsPerBook}).`);
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
        shiftStartedTicket: shiftStartTicket,
        currentTicket: ticketNumber,
        quantitySold,
        total
      };
    
      // Add to tickets list
      setTickets([...tickets, newTicket]);
      setLastScanned(ticketNumber);
      
      // Clear scan input
      setScanNumber('');

      // Save to database
      await lotteryAPI.scanTicket({
        gameId: existingBook.game.id,
        bookNumber,
        ticketNumber,
        currentTicket: ticketNumber,
        storeId: currentStore.id,
        gameName: existingBook.game.gameName,
        gamePrice: existingBook.game.price,
        totalTickets: existingBook.game.ticketsPerBook,
        status: 'scanned',
        activatedOn: new Date().toISOString(),
        shiftStartTicket,
        quantitySold,
        total: parseFloat(total)
      });

    } catch (error) {
      console.error('Error scanning ticket:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || 'Failed to scan ticket');
      } else {
        setError('Failed to scan ticket');
      }
      setScanNumber('');
    }
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (scanNumber.trim()) {
      processScan(scanNumber.trim());
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameNumber && bookNumber && ticketNumber) {
      const scan = `${gameNumber}-${bookNumber}-${ticketNumber}`;
      processScan(scan);
      
      // Clear manual inputs
      setGameNumber('');
      setBookNumber('');
      setTicketNumber('');
    }
  };

  const handleFinishScanning = () => {
    toast({
      title: "Scanning Complete",
      description: `${tickets.length} tickets scanned. Total: $${instantSaleTotal.toFixed(2)}`,
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-medium mb-3 text-foreground">Scan Ticket</h3>
          <form onSubmit={handleScanSubmit} className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Scan ticket..."
                className="flex-1 border border-input rounded-md px-3 py-2 bg-background text-foreground"
                value={scanNumber}
                onChange={(e) => setScanNumber(e.target.value)}
                autoFocus
              />
              <Button type="submit" variant="default">
                <Camera className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>
          </form>
        </div>

        <div>
          <h3 className="font-medium mb-3 text-foreground">Add Ticket Manually</h3>
          <form onSubmit={handleManualSubmit} className="space-y-2">
            <input 
              type="text" 
              placeholder="Game Number" 
              className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground"
              value={gameNumber}
              onChange={(e) => setGameNumber(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Book Number" 
              className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground"
              value={bookNumber}
              onChange={(e) => setBookNumber(e.target.value)}
            />
            <input 
              type="text" 
              placeholder="Ticket Number" 
              className="border border-input rounded-md px-3 py-2 w-full bg-background text-foreground"
              value={ticketNumber}
              onChange={(e) => setTicketNumber(e.target.value)}
            />
            <Button type="submit" variant="default" className="w-full mt-2">
              Add Ticket
            </Button>
          </form>
          <Button variant="default" className="w-full mt-2" onClick={handleFinishScanning}>
            Finish Scanning
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium text-foreground">Scanned Tickets</h3>
          <span className="text-sm text-muted-foreground">
            Count: ({tickets.length}) Last Ticket Scanned: {lastScanned || 'None'} | 
            Total: ${instantSaleTotal.toFixed(2)}
          </span>
        </div>

        <div className="rounded-md border border-border">
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
                  <TableCell>${ticket.price}</TableCell>
                  <TableCell>{ticket.gameName}</TableCell>
                  <TableCell>{ticket.gameNumber}</TableCell>
                  <TableCell>{ticket.bookNumber}</TableCell>
                  <TableCell>{ticket.status}</TableCell>
                  <TableCell>{ticket.activatedOn}</TableCell>
                  <TableCell>{ticket.overAllTickets}</TableCell>
                  <TableCell>{ticket.shiftStartedTicket}</TableCell>
                  <TableCell>{ticket.currentTicket}</TableCell>
                  <TableCell>{ticket.quantitySold}</TableCell>
                  <TableCell>${ticket.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LotteryTicketScan;
