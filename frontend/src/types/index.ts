export interface LotteryData {
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

export interface LotteryGame {
  id: string;
  gameNumber: string;
  gameName: string;
  gamePrice: number;
  totalTickets: number;
  createdAt: string;
  updatedAt: string;
}

export interface LotteryBook {
  id: string;
  gameId: string;
  game: LotteryGame;
  bookNumber: string;
  referenceNumber: string;
  status: 'active' | 'returned' | 'completed';
  activatedOn: string;
  returnedOn?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScannedTicket {
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

export interface DailyReport {
  id: string;
  storeId: string;
  reportDate: string;
  business: {
    // ... existing business fields ...
  };
  lottery: LotteryData;
  createdAt: string;
  updatedAt: string;
} 