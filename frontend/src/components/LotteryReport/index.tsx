import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { format } from 'date-fns';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useApi } from '../../hooks/useApi';
import { Store, DailyReport } from '../../types';

interface LotteryReportProps {
  selectedStore: Store | null;
  dailyReport: DailyReport | null;
  reportDate: Date;
  onDataChange: (data: any) => void;
}

interface LotteryData {
  todayOnlineNetSales: number;
  todayOnlineCashing: number;
  todayInstantCashing: number;
  todayInstantSaleSr34: number;
  yesterdayOnlineNetSales: number;
  yesterdayOnlineCashing: number;
  yesterdayInstantCashing: number;
  totalOnlineBalance: number;
  creditSales: number;
  debitSales: number;
  registerCash: number;
  overShort: number;
  notes?: string;
}

interface ActivationData {
  gameNumber: string;
  bookNumber: string;
  referenceNumber: string;
  ticketNumber: string;
}

interface ScannedTicket {
  id: string;
  gameId: string;
  bookNumber: string;
  ticketNumber: string;
  gameName: string;
  gamePrice: number;
  totalTickets: number;
  status: string;
  activatedOn: string;
  shiftStartTicket: string;
  currentTicket: string;
  quantitySold: number;
  total: number;
}

export const LotteryReport: React.FC<LotteryReportProps> = ({
  selectedStore,
  dailyReport,
  reportDate,
  onDataChange
}) => {
  const api = useApi();

  // State
  const [lotteryData, setLotteryData] = useState<LotteryData>({
    todayOnlineNetSales: 0,
    todayOnlineCashing: 0,
    todayInstantCashing: 0,
    todayInstantSaleSr34: 0,
    yesterdayOnlineNetSales: 0,
    yesterdayOnlineCashing: 0,
    yesterdayInstantCashing: 0,
    totalOnlineBalance: 0,
    creditSales: 0,
    debitSales: 0,
    registerCash: 0,
    overShort: 0
  });

  const [activationData, setActivationData] = useState<ActivationData>({
    gameNumber: '',
    bookNumber: '',
    referenceNumber: '',
    ticketNumber: ''
  });

  const [scanInput, setScanInput] = useState('');
  const [lastScannedTicket, setLastScannedTicket] = useState('');
  const [scannedTickets, setScannedTickets] = useState<ScannedTicket[]>([]);
  const [activatedBooks, setActivatedBooks] = useState<any[]>([]);
  const [returnedBooks, setReturnedBooks] = useState<any[]>([]);

  // Load previous day's data
  useEffect(() => {
    const loadPreviousDayData = async () => {
      if (!selectedStore?.id) return;

      try {
        const response = await api.get(
          `/lottery/previous-data/${selectedStore.id}?date=${format(reportDate, 'yyyy-MM-dd')}`
        );

        setLotteryData(prev => ({
          ...prev,
          yesterdayOnlineNetSales: response.onlineNetSales,
          yesterdayOnlineCashing: response.onlineCashing,
          yesterdayInstantCashing: response.instantCashing
        }));
      } catch (error) {
        console.error('Error loading previous day data:', error);
      }
    };

    loadPreviousDayData();
  }, [selectedStore?.id, reportDate]);

  // Load existing lottery data
  useEffect(() => {
    if (dailyReport?.lottery) {
      setLotteryData(dailyReport.lottery);
    }
  }, [dailyReport]);

  // Calculate lottery balances
  const calculateLotteryBalances = useCallback(() => {
    const onlineSalesDifference = 
      lotteryData.todayOnlineNetSales - 
      lotteryData.yesterdayOnlineNetSales;

    const onlineCashingDifference = 
      lotteryData.todayOnlineCashing - 
      lotteryData.yesterdayOnlineCashing;

    const instantCashingDifference = 
      lotteryData.todayInstantCashing - 
      lotteryData.yesterdayInstantCashing;

    // Calculate Instant Sale SR34 (sum of all scanned tickets)
    const instantSaleSr34 = scannedTickets.reduce((sum, ticket) => sum + ticket.total, 0);

    // Calculate Total Online Balance
    const totalOnlineBalance = 
      onlineSalesDifference - 
      onlineCashingDifference - 
      instantCashingDifference + 
      instantSaleSr34;

    // Calculate Over/Short
    const overShort = lotteryData.registerCash - totalOnlineBalance;

    return {
      totalOnlineBalance,
      overShort,
      instantSaleSr34
    };
  }, [lotteryData, scannedTickets]);

  // Update balances when data changes
  useEffect(() => {
    const balances = calculateLotteryBalances();
    setLotteryData(prev => ({
      ...prev,
      totalOnlineBalance: balances.totalOnlineBalance,
      overShort: balances.overShort,
      todayInstantSaleSr34: balances.instantSaleSr34
    }));
  }, [calculateLotteryBalances]);

  // Handle data changes
  const handleDataChange = (field: keyof LotteryData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = Number(event.target.value);
    setLotteryData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      onDataChange(updated);
      return updated;
    });
  };

  // Handle book activation
  const handleActivateBook = async (bookNumber: string) => {
    if (!selectedStore?.id || !bookNumber) return;

    try {
      const response = await api.post('/lottery/books/activate', {
        storeId: selectedStore.id,
        bookNumber
      });

      setActivatedBooks(prev => [...prev, response]);
      setActivationData({ gameNumber: '', bookNumber: '', referenceNumber: '', ticketNumber: '' });
    } catch (error) {
      console.error('Error activating book:', error);
    }
  };

  // Handle book return
  const handleReturnBook = async (bookNumber: string) => {
    if (!selectedStore?.id || !bookNumber) return;

    try {
      const response = await api.post('/lottery/books/return', {
        storeId: selectedStore.id,
        bookNumber
      });

      setActivatedBooks(prev => prev.filter(book => book.bookNumber !== bookNumber));
      setReturnedBooks(prev => [...prev, response]);
    } catch (error) {
      console.error('Error returning book:', error);
    }
  };

  // Handle ticket scan
  const handleTicketScan = async (ticketNumber: string) => {
    if (!dailyReport?.id || !ticketNumber) return;

    try {
      const response = await api.post('/lottery/tickets/scan', {
        dailyReportId: dailyReport.id,
        ticketNumber
      });

      setScannedTickets(prev => [...prev, response]);
      setLastScannedTicket(ticketNumber);
    } catch (error) {
      console.error('Error scanning ticket:', error);
    }
  };

  // Preprocess ticket number
  const preprocessTicketNumber = (input: string): string => {
    // Remove any non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Format as XXX-XXXXXX-XXX
    if (digits.length >= 12) {
      const gameNumber = digits.slice(0, 3);
      const bookNumber = digits.slice(3, 9);
      const ticketNumber = digits.slice(9, 12);
      return `${gameNumber}-${bookNumber}-${ticketNumber}`;
    }
    
    return input;
  };

  return (
    <div className="space-y-6">
      {/* Lottery Data Entry Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Lottery Report</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Today's Numbers</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Online Net Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.todayOnlineNetSales}
                  onChange={handleDataChange('todayOnlineNetSales')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Online Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.todayOnlineCashing}
                  onChange={handleDataChange('todayOnlineCashing')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Instant Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.todayInstantCashing}
                  onChange={handleDataChange('todayInstantCashing')}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Yesterday's Numbers</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Online Net Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.yesterdayOnlineNetSales}
                  onChange={handleDataChange('yesterdayOnlineNetSales')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Online Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.yesterdayOnlineCashing}
                  onChange={handleDataChange('yesterdayOnlineCashing')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Instant Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.yesterdayInstantCashing}
                  onChange={handleDataChange('yesterdayInstantCashing')}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">Today Cash</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span>Total Online Balance</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32 bg-gray-100"
                value={lotteryData.totalOnlineBalance}
                readOnly
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Credit Sales</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32"
                value={lotteryData.creditSales}
                onChange={handleDataChange('creditSales')}
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Debit Sales</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32"
                value={lotteryData.debitSales}
                onChange={handleDataChange('debitSales')}
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Register Cash</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32"
                value={lotteryData.registerCash}
                onChange={handleDataChange('registerCash')}
              />
            </div>
            <div className="flex justify-between items-center">
              <span>Over/Short</span>
              <input
                type="number"
                className="border rounded px-2 py-1 w-32 bg-gray-100"
                value={lotteryData.overShort}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lottery Book Management Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Lottery Book Management</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Scan Code and Activate</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Scan Book Number"
                value={activationData.bookNumber}
                onChange={e => setActivationData(prev => ({ ...prev, bookNumber: e.target.value }))}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleActivateBook(activationData.bookNumber);
                  }
                }}
                className="border rounded px-2 py-1 flex-1"
              />
              <button 
                onClick={() => handleActivateBook(activationData.bookNumber)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Activate
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Manual Activation</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Game Number (XXX)"
                value={activationData.gameNumber}
                onChange={e => setActivationData(prev => ({ ...prev, gameNumber: e.target.value }))}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Book Number (XXXXXX)"
                value={activationData.bookNumber}
                onChange={e => setActivationData(prev => ({ ...prev, bookNumber: e.target.value }))}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Reference Number (X)"
                value={activationData.referenceNumber}
                onChange={e => setActivationData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                className="border rounded px-2 py-1 w-full"
              />
              <button 
                onClick={() => {
                  const bookNumber = `${activationData.gameNumber}-${activationData.bookNumber}-${activationData.referenceNumber || '0'}`;
                  handleActivateBook(bookNumber);
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Activate
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ${selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
                  }`
                }
              >
                Activated Books
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                  ${selected
                    ? 'bg-white text-blue-700 shadow'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-blue-600'
                  }`
                }
              >
                Returned Books
              </Tab>
            </Tab.List>
            <Tab.Panels className="mt-4">
              <Tab.Panel>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">No</th>
                        <th className="text-left py-2">Game Name</th>
                        <th className="text-left py-2">Game Number</th>
                        <th className="text-left py-2">Book Number</th>
                        <th className="text-left py-2">Reference</th>
                        <th className="text-center py-2">Status</th>
                        <th className="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activatedBooks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-gray-500">
                            No data available
                          </td>
                        </tr>
                      ) : (
                        activatedBooks.map((book, index) => (
                          <tr key={book.id} className="border-b">
                            <td>{index + 1}</td>
                            <td>{book.game.gameName}</td>
                            <td>{book.game.gameNumber}</td>
                            <td>{book.bookNumber}</td>
                            <td>{book.referenceNumber || '-'}</td>
                            <td className="text-center capitalize">{book.status}</td>
                            <td className="text-center">
                              <button
                                onClick={() => handleReturnBook(book.bookNumber)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Return
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
              <Tab.Panel>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">No</th>
                        <th className="text-left py-2">Game Name</th>
                        <th className="text-left py-2">Game Number</th>
                        <th className="text-left py-2">Book Number</th>
                        <th className="text-left py-2">Reference</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnedBooks.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-4 text-gray-500">
                            No returned books
                          </td>
                        </tr>
                      ) : (
                        returnedBooks.map((book, index) => (
                          <tr key={book.id} className="border-b">
                            <td>{index + 1}</td>
                            <td>{book.game.gameName}</td>
                            <td>{book.game.gameNumber}</td>
                            <td>{book.bookNumber}</td>
                            <td>{book.referenceNumber || '-'}</td>
                            <td className="text-center capitalize">{book.status}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>
      </div>

      {/* Lottery Ticket Scanning Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Lottery Ticket Scanning</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Scan Code Here</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Scan Number"
                value={scanInput}
                onChange={(e) => {
                  const input = e.target.value;
                  // If input is complete (has enough digits), auto-process it
                  if (input.replace(/\D/g, '').length >= 12) {
                    const formattedInput = preprocessTicketNumber(input);
                    setScanInput(''); // Clear input immediately
                    handleTicketScan(formattedInput);
                  } else {
                    setScanInput(input);
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && scanInput) {
                    const formattedInput = preprocessTicketNumber(scanInput);
                    setScanInput(''); // Clear input after processing
                    handleTicketScan(formattedInput);
                  }
                }}
                className="border rounded px-2 py-1 flex-1"
                autoFocus
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Manual Entry</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Game Number"
                value={activationData.gameNumber}
                onChange={e => setActivationData(prev => ({ ...prev, gameNumber: e.target.value }))}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Book Number"
                value={activationData.bookNumber}
                onChange={e => setActivationData(prev => ({ ...prev, bookNumber: e.target.value }))}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Ticket Number"
                value={activationData.ticketNumber}
                onChange={e => setActivationData(prev => ({ ...prev, ticketNumber: e.target.value }))}
                className="border rounded px-2 py-1 w-full"
              />
              <button 
                onClick={() => {
                  const ticketNumber = `${activationData.gameNumber}-${activationData.bookNumber}-${activationData.ticketNumber}`;
                  handleTicketScan(ticketNumber);
                  setActivationData(prev => ({ ...prev, gameNumber: '', bookNumber: '', ticketNumber: '' }));
                }}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Scan
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Scanned Tickets</h3>
            <span className="text-sm text-gray-500">
              Count: ({scannedTickets.length}) Last Ticket: {lastScannedTicket}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">No</th>
                  <th className="text-left py-2">Game Price</th>
                  <th className="text-left py-2">Game Name</th>
                  <th className="text-left py-2">Game Number</th>
                  <th className="text-left py-2">Book Number</th>
                  <th className="text-center py-2">Status</th>
                  <th className="text-center py-2">Activated On</th>
                  <th className="text-right py-2">Total Tickets</th>
                  <th className="text-right py-2">Start Ticket</th>
                  <th className="text-right py-2">Current Ticket</th>
                  <th className="text-right py-2">Quantity Sold</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {scannedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-4 text-gray-500">
                      No data available
                    </td>
                  </tr>
                ) : (
                  scannedTickets.map((ticket, index) => (
                    <tr key={ticket.id} className="border-b">
                      <td>{index + 1}</td>
                      <td>${ticket.gamePrice.toFixed(2)}</td>
                      <td>{ticket.gameName}</td>
                      <td>{ticket.gameId}</td>
                      <td>{ticket.bookNumber}</td>
                      <td className="text-center capitalize">{ticket.status}</td>
                      <td className="text-center">{new Date(ticket.activatedOn).toLocaleDateString()}</td>
                      <td className="text-right">{ticket.totalTickets}</td>
                      <td className="text-right">{ticket.shiftStartTicket}</td>
                      <td className="text-right">{ticket.currentTicket}</td>
                      <td className="text-right">{ticket.quantitySold}</td>
                      <td className="text-right">${ticket.total.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}; 