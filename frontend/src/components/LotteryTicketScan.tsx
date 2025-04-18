import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScanTicket {
  id: string;
  gamePrice: string;
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
  data?: any[];
}

const LotteryTicketScan: React.FC<LotteryTicketScanProps> = ({ data = [] }) => {
  const [tickets, setTickets] = useState<ScanTicket[]>([]);
  const [scanNumber, setScanNumber] = useState('');
  const [gameNumber, setGameNumber] = useState('');
  const [bookNumber, setBookNumber] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [lastScanned, setLastScanned] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [instantSaleTotal, setInstantSaleTotal] = useState(0);

  // Calculate instant sale total whenever tickets change
  useEffect(() => {
    const total = tickets.reduce((sum, ticket) => sum + parseFloat(ticket.total), 0);
    setInstantSaleTotal(total);
  }, [tickets]);

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

  const validateGameExists = (gameNumber: string): boolean => {
    // In a real implementation, this would check against a database
    // For now, we'll assume any 3-digit number is valid
    return /^\d{3}$/.test(gameNumber);
  };

  const validateBookExists = (gameNumber: string, bookNumber: string): boolean => {
    // In a real implementation, this would check against a database
    // For now, we'll assume any 6-digit number is valid
    return /^\d{6}$/.test(bookNumber);
  };

  const validateTicketNumber = (bookNumber: string, ticketNumber: string): boolean => {
    // In a real implementation, this would check against the book's start/end range
    // For now, we'll assume any 3-digit number is valid
    return /^\d{3}$/.test(ticketNumber);
  };

  const checkDuplicateScan = (gameNumber: string, bookNumber: string, ticketNumber: string): boolean => {
    return tickets.some(ticket => 
      ticket.gameNumber === gameNumber && 
      ticket.bookNumber === bookNumber && 
      ticket.currentTicket === ticketNumber
    );
  };

  const calculateQuantitySold = (bookNumber: string, ticketNumber: string): number => {
    // Find the last scan for this book
    const bookScans = tickets.filter(ticket => ticket.bookNumber === bookNumber);
    
    if (bookScans.length === 0) {
      // First scan of this book
      return 1;
    }
    
    // Get the last scan for this book
    const lastScan = bookScans[bookScans.length - 1];
    const lastTicketNumber = parseInt(lastScan.currentTicket);
    const currentTicketNumber = parseInt(ticketNumber);
    
    // Calculate quantity sold
    return currentTicketNumber - lastTicketNumber + 1;
  };

  const calculateTotal = (gameNumber: string, quantitySold: number): string => {
    // In a real implementation, this would get the price from the game settings
    // For now, we'll use a fixed price of $2 per ticket
    const pricePerTicket = 2;
    return (quantitySold * pricePerTicket).toFixed(2);
  };

  const processScan = (scan: string) => {
    setError(null);
    
    // Extract ticket information
    const ticketInfo = extractTicketInfo(scan);
    if (!ticketInfo) {
      setError("Invalid ticket format. Expected format: XXX-XXXXXX-XXX");
      return;
    }
    
    const { gameNumber, bookNumber, ticketNumber } = ticketInfo;
    
    // Validate game exists
    if (!validateGameExists(gameNumber)) {
      setError(`Game number ${gameNumber} does not exist`);
      return;
    }
    
    // Validate book exists
    if (!validateBookExists(gameNumber, bookNumber)) {
      setError(`Book number ${bookNumber} does not exist for game ${gameNumber}`);
      return;
    }
    
    // Validate ticket number
    if (!validateTicketNumber(bookNumber, ticketNumber)) {
      setError(`Invalid ticket number ${ticketNumber} for book ${bookNumber}`);
      return;
    }
    
    // Check for duplicate scan
    if (checkDuplicateScan(gameNumber, bookNumber, ticketNumber)) {
      setError(`Ticket ${ticketNumber} from book ${bookNumber} has already been scanned today`);
      return;
    }
    
    // Calculate quantity sold
    const quantitySold = calculateQuantitySold(bookNumber, ticketNumber);
    
    // Calculate total
    const total = calculateTotal(gameNumber, quantitySold);
    
    // Create new ticket record
    const newTicket: ScanTicket = {
      id: crypto.randomUUID(),
      gamePrice: "$2.00", // In a real implementation, this would come from game settings
      gameName: `Game ${gameNumber}`, // In a real implementation, this would come from game settings
      gameNumber,
      bookNumber,
      status: "Active",
      activatedOn: new Date().toISOString().split('T')[0],
      overAllTickets: "100", // In a real implementation, this would come from book settings
      shiftStartedTicket: tickets.length > 0 ? tickets[0].currentTicket : ticketNumber,
      currentTicket: ticketNumber,
      quantitySold,
      total
    };
    
    // Add to tickets list
    setTickets([...tickets, newTicket]);
    setLastScanned(ticketNumber);
    
    // Clear scan input
    setScanNumber('');
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
    // In a real implementation, this would save the scanned tickets to the database
    toast({
      title: "Scanning Complete",
      description: `${tickets.length} tickets scanned. Total: $${instantSaleTotal.toFixed(2)}`,
    });
  };

  return (
    <div className="bg-card p-4 rounded-md shadow mt-4 border border-border">
      <h2 className="text-xl font-medium mb-4 text-foreground">Lottery Ticket Scan</h2>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h3 className="font-medium mb-3 text-foreground">Scan Code Here</h3>
          <form onSubmit={handleScanSubmit} className="flex mb-3">
            <input 
              type="text" 
              placeholder="Scan Number" 
              className="border border-input rounded-l-md px-3 py-2 flex-1 bg-background text-foreground"
              value={scanNumber}
              onChange={(e) => setScanNumber(e.target.value)}
            />
            <Button type="submit" variant="ghost" className="rounded-l-none border border-l-0 border-input">
              <Camera className="h-5 w-5" />
            </Button>
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
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-4 text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket, index) => (
                  <TableRow key={ticket.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>{ticket.gamePrice}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default LotteryTicketScan;
