import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { format } from 'date-fns';
import { PrinterIcon, EnvelopeIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { Tab } from '@headlessui/react';
import InvoiceModal, { InvoiceData } from '../InvoiceModal';
import PayrollModal, { PayrollData } from '../PayrollModal';
import LotteryMaster from '../LotteryMaster';
import LotteryInventory from '../LotteryInventory';
import StoreManager from '../StoreManager';
import { Store, Shift, BusinessReport as BusinessReportType } from '../../types';
import UnscannedBooksModal from '../UnscannedBooksModal';
import TicketScanErrorModal from '../TicketScanErrorModal';

const API_BASE_URL = 'http://localhost:3001/api';

interface BusinessReportProps {
  selectedStore: Store | null;
  reportDate: Date;
  setSelectedStore: (store: Store | null) => void;
  isStoreManagerOpen: boolean;
  setIsStoreManagerOpen: (isOpen: boolean) => void;
  onResetForm?: () => void;
}

interface Invoice extends InvoiceData {
  id: number;
  type: 'purchase' | 'expense';
}

interface Payroll extends PayrollData {
  id: number;
}

interface LotteryMasterData {
  id: number;
  gameNumber: string;
  gameName: string;
  costPerTicket: number;
  ticketsPerBook: number;
  inventory?: { bookNumber: string; isActivated: boolean }[];
}

interface ActivatedBook {
  id: number;
  gameNumber: string;
  bookNumber: string;
  referenceNumber?: string;
  gameName: string;
  gamePrice: number;
  totalTickets: number;
  status: 'available' | 'activated' | 'sold' | 'returned' | 'settled';
  activatedOn: string;
}

interface ScannedTicket {
  id: number;
  gameId: number;
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

interface ManualActivationForm {
  gameNumber: string;
  bookNumber: string;
}

interface NewGameData {
  game_number: string;
  game_name: string;
  cost_per_ticket: number;
  tickets_per_book: number;
}

interface LotteryMasterProps {
  onClose: () => void;
  onGameAdded: (game: {
    id: number;
    game_number: string;
    game_name: string;
    cost_per_ticket: number;
    tickets_per_book: number;
  }) => void;
}

interface LotteryInventoryProps {
  onClose: () => void;
  selectedStore: Store;
  onBookAdded: (inventoryBook: {
    id: number;
    game_number: string;
    book_number: string;
    game_name: string;
    cost_per_ticket: number;
    tickets_per_book: number;
  }) => Promise<void>;
}

export interface BusinessReportRef {
  resetForm: () => void;
  handleSaveReport: () => Promise<void>;
}

const BusinessReport = forwardRef<BusinessReportRef, BusinessReportProps>(({
  selectedStore,
  reportDate,
  setSelectedStore,
  isStoreManagerOpen,
  setIsStoreManagerOpen,
  onResetForm
}, ref) => {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPayrollModalOpen, setIsPayrollModalOpen] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'purchase' | 'expense'>('purchase');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [businessData, setBusinessData] = useState({
    netSalesRegister: 0,
    netTaxes: 0,
    mealTax: 0,
    refund: 0,
    cheque: 0,
    creditCard: 0,
    registerCash: 0,
    overShort: 0,
    cashToAccount: 0
  });
  const [isLotteryMasterOpen, setIsLotteryMasterOpen] = useState(false);
  const [isLotteryInventoryOpen, setIsLotteryInventoryOpen] = useState(false);
  const [lotteryMasters, setLotteryMasters] = useState<LotteryMasterData[]>([]);
  const [activationData, setActivationData] = useState({
    gameNumber: '',
    bookNumber: '',
    referenceNumber: '',
    ticketNumber: ''
  });
  const [activatedBooks, setActivatedBooks] = useState<ActivatedBook[]>([]);
  const [returnedBooks, setReturnedBooks] = useState<ActivatedBook[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [stores, setStores] = useState<Store[]>([]);
  const [showManualActivation, setShowManualActivation] = useState(false);
  const [manualForm, setManualForm] = useState<ManualActivationForm>({
    gameNumber: '',
    bookNumber: ''
  });
  const [newGameData, setNewGameData] = useState<NewGameData>({
    game_number: '',
    game_name: '',
    cost_per_ticket: 0,
    tickets_per_book: 0
  });
  const [pendingBookNumber, setPendingBookNumber] = useState('');
  const [scannedTickets, setScannedTickets] = useState<ScannedTicket[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [lastScannedTicket, setLastScannedTicket] = useState<string>('');
  const [lotteryData, setLotteryData] = useState({
    todayOnlineNetSales: 0,
    todayOnlineCashing: 0,
    todayInstantCashing: 0,
    todayInstantSaleSR34: 0,
    yesterdayOnlineNetSales: 0,
    yesterdayOnlineCashing: 0,
    yesterdayInstantCashing: 0,
    previousDayOnlineNetSales: 0,
    previousDayOnlineCashing: 0,
    previousDayInstantCashing: 0,
    creditSales: 0,
    debitSales: 0,
    registerCash: 0
  });
  const [showUnscannedBooksModal, setShowUnscannedBooksModal] = useState(false);
  const [unscannedBooks, setUnscannedBooks] = useState<Array<{
    gameName: string;
    gameNumber: string;
    bookNumber: string;
  }>>([]);
  const [showTicketScanError, setShowTicketScanError] = useState(false);
  const [ticketScanErrorDetails, setTicketScanErrorDetails] = useState<{
    bookNumber: string;
    gameName: string;
    yesterdayTicket: string;
    currentTicket: string;
  } | null>(null);

  // ... existing code ...

  // Calculate lottery balances
  const calculateLotteryBalances = useCallback(() => {
    // Calculate Online Sales Difference
    const onlineSalesDifference = 
      lotteryData.todayOnlineNetSales + 
      lotteryData.yesterdayOnlineNetSales - 
      lotteryData.previousDayOnlineNetSales;

    // Calculate Online Cashing Difference
    const onlineCashingDifference = 
      lotteryData.todayOnlineCashing + 
      lotteryData.yesterdayOnlineCashing - 
      lotteryData.previousDayOnlineCashing;

    // Calculate Instant Cashing Difference
    const instantCashingDifference = 
      lotteryData.todayInstantCashing + 
      lotteryData.yesterdayInstantCashing - 
      lotteryData.previousDayInstantCashing;

    // Calculate Instant Sale SR34 (sum of all scanned tickets)
    const instantSaleSR34 = scannedTickets.reduce((sum, ticket) => sum + ticket.total, 0);

    // Calculate Total Online Balance
    const totalOnlineBalance = 
      onlineSalesDifference - 
      onlineCashingDifference - 
      instantCashingDifference + 
      instantSaleSR34;

    // Calculate Over/Short
    const overShort = lotteryData.registerCash - totalOnlineBalance;

    return {
      totalOnlineBalance,
      overShort,
      onlineSalesDifference,
      onlineCashingDifference,
      instantCashingDifference,
      instantSaleSR34
    };
  }, [
    lotteryData.todayOnlineNetSales,
    lotteryData.yesterdayOnlineNetSales,
    lotteryData.previousDayOnlineNetSales,
    lotteryData.todayOnlineCashing,
    lotteryData.yesterdayOnlineCashing,
    lotteryData.previousDayOnlineCashing,
    lotteryData.todayInstantCashing,
    lotteryData.yesterdayInstantCashing,
    lotteryData.previousDayInstantCashing,
    lotteryData.registerCash,
    scannedTickets
  ]);

  // Calculate balances whenever lottery data or scanned tickets change
  useEffect(() => {
    const balances = calculateLotteryBalances();
    setLotteryData(prev => ({
      ...prev,
      totalOnlineBalance: balances.totalOnlineBalance,
      overShort: balances.overShort
    }));
  }, [calculateLotteryBalances]);

  const handleLotteryDataChange = (field: keyof typeof lotteryData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setLotteryData(prev => ({
      ...prev,
      [field]: Number(event.target.value)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Daily Lottery Report */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Daily Lottery Report</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Today Invoice</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Online Net Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.todayOnlineNetSales}
                  onChange={handleLotteryDataChange('todayOnlineNetSales')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Online Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.todayOnlineCashing}
                  onChange={handleLotteryDataChange('todayOnlineCashing')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Instant Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.todayInstantCashing}
                  onChange={handleLotteryDataChange('todayInstantCashing')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Instant Sale SR34</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32 bg-gray-100"
                  value={scannedTickets.reduce((sum, ticket) => sum + ticket.total, 0)}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Yesterday Invoice</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Online Net Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.yesterdayOnlineNetSales}
                  onChange={handleLotteryDataChange('yesterdayOnlineNetSales')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Online Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.yesterdayOnlineCashing}
                  onChange={handleLotteryDataChange('yesterdayOnlineCashing')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Instant Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.yesterdayInstantCashing}
                  onChange={handleLotteryDataChange('yesterdayInstantCashing')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Previous Day Online Net Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32 bg-gray-100"
                  value={lotteryData.previousDayOnlineNetSales}
                  readOnly
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Previous Day Online Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32 bg-gray-100"
                  value={lotteryData.previousDayOnlineCashing}
                  readOnly
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Previous Day Instant Cashing</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32 bg-gray-100"
                  value={lotteryData.previousDayInstantCashing}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Today Cash</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Total Online Balance</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32 bg-gray-100"
                  value={calculateLotteryBalances().totalOnlineBalance}
                  readOnly
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Credit Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.creditSales}
                  onChange={handleLotteryDataChange('creditSales')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Debit Sales</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.debitSales}
                  onChange={handleLotteryDataChange('debitSales')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Register Cash</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32"
                  value={lotteryData.registerCash}
                  onChange={handleLotteryDataChange('registerCash')}
                />
              </div>
              <div className="flex justify-between items-center">
                <span>Over/Short</span>
                <input
                  type="number"
                  className="border rounded px-2 py-1 w-32 bg-gray-100"
                  value={calculateLotteryBalances().overShort}
                  readOnly
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lottery Activated Books */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Lottery Activated Books</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsLotteryMasterOpen(true)}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Manage Games
            </button>
            <button
              onClick={() => setIsLotteryInventoryOpen(true)}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Manage Inventory
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium mb-2">Scan Code and Activate</h3>
            <div className="space-y-2">
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
                  onClick={() => {
                    handleActivateBook(activationData.bookNumber);
                  }}
                  className="p-1"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Activate Manually</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Game Number (XXX)"
                value={activationData.gameNumber}
                onChange={e => setActivationData(prev => ({ ...prev, gameNumber: e.target.value }))}
                onKeyPress={e => {
                  if (e.key === 'Enter' && activationData.gameNumber && activationData.bookNumber) {
                    const bookNumber = `${activationData.gameNumber}-${activationData.bookNumber}-${activationData.referenceNumber || '0'}`;
                    handleActivateBook(bookNumber);
                  }
                }}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Book Number (XXXXXX)"
                value={activationData.bookNumber}
                onChange={e => setActivationData(prev => ({ ...prev, bookNumber: e.target.value }))}
                onKeyPress={e => {
                  if (e.key === 'Enter' && activationData.gameNumber && activationData.bookNumber) {
                    const bookNumber = `${activationData.gameNumber}-${activationData.bookNumber}-${activationData.referenceNumber || '0'}`;
                    handleActivateBook(bookNumber);
                  }
                }}
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Reference Number (X)"
                value={activationData.referenceNumber}
                onChange={e => setActivationData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                onKeyPress={e => {
                  if (e.key === 'Enter' && activationData.gameNumber && activationData.bookNumber) {
                    const bookNumber = `${activationData.gameNumber}-${activationData.bookNumber}-${activationData.referenceNumber || '0'}`;
                    handleActivateBook(bookNumber);
                  }
                }}
                className="border rounded px-2 py-1 w-full"
              />
              <button 
                onClick={() => {
                  const bookNumber = `${activationData.gameNumber}-${activationData.bookNumber}-${activationData.referenceNumber || '0'}`;
                  handleActivateBook(bookNumber);
                  setActivationData(prev => ({ ...prev, gameNumber: '', bookNumber: '', referenceNumber: '' }));
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Activate
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Return Book</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Game Number"
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Book Number"
                className="border rounded px-2 py-1 w-full"
              />
              <input
                type="text"
                placeholder="Ticket Number"
                className="border rounded px-2 py-1 w-full"
              />
              <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Return Now
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
                            <td>{book.gameName}</td>
                            <td>{book.gameNumber}</td>
                            <td>{book.bookNumber}</td>
                            <td>{book.referenceNumber || '-'}</td>
                            <td className="text-center capitalize">{book.status}</td>
                            <td className="text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleReturnBook(book.bookNumber)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  Return Now
                                </button>
                                <button
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
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
                        <th className="text-center py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnedBooks.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-gray-500">
                            No returned books
                          </td>
                        </tr>
                      ) : (
                        returnedBooks.map((book, index) => (
                          <tr key={book.id} className="border-b">
                            <td>{index + 1}</td>
                            <td>{book.gameName}</td>
                            <td>{book.gameNumber}</td>
                            <td>{book.bookNumber}</td>
                            <td>{book.referenceNumber || '-'}</td>
                            <td className="text-center capitalize">{book.status}</td>
                            <td className="text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleDeleteBook(book.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </td>
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

      {/* Lottery Ticket Scan */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-4">Lottery Ticket Scan</h2>
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
                autoFocus // Keep focus on the input
              />
              <button 
                onClick={() => {
                  if (scanInput) {
                    const formattedInput = preprocessTicketNumber(scanInput);
                    setScanInput(''); // Clear input after processing
                    handleTicketScan(formattedInput);
                  }
                }}
                className="p-1"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Add Ticket Manually</h3>
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
                Finish Scanning
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Scanned Tickets</h3>
            <span className="text-sm text-gray-500">
              Count: ({scannedTickets.length}) Last Ticket Scanned: {lastScannedTicket}
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
                  <th className="text-right py-2">Over All Tickets</th>
                  <th className="text-right py-2">Shift Started with Ticket No</th>
                  <th className="text-right py-2">Current Ticket No</th>
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
                      <td>{lotteryMasters.find(m => m.id === ticket.gameId)?.gameNumber || ''}</td>
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

      {/* Lottery Management Modals */}
      {isLotteryMasterOpen && (
        <LotteryMaster
          onClose={() => setIsLotteryMasterOpen(false)}
          onGameAdded={onGameAdded}
          initialGameNumber={newGameData.game_number}
        />
      )}
      {isLotteryInventoryOpen && selectedStore && (
        <LotteryInventory
          onClose={() => {
            setIsLotteryInventoryOpen(false);
            localStorage.removeItem('pendingBookActivation');
          }}
          selectedStore={selectedStore}
          onBookAdded={handleBookActivationAfterInventory}
        />
      )}

      {/* Add UnscannedBooksModal */}
      <UnscannedBooksModal
        isOpen={showUnscannedBooksModal}
        onClose={() => {
          setShowUnscannedBooksModal(false);
          setIsSaving(false);
        }}
        onConfirm={handleUnscannedBooksConfirm}
        unscannedBooks={unscannedBooks}
      />

      {/* Add TicketScanErrorModal */}
      <TicketScanErrorModal
        isOpen={showTicketScanError}
        onClose={() => setShowTicketScanError(false)}
        errorDetails={ticketScanErrorDetails}
      />
    </div>
  );
});

export default BusinessReport; 