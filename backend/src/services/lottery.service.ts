import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { addDays, subDays, startOfDay, endOfDay } from 'date-fns';

export const lotteryService = {
  // Get previous day's lottery data
  getPreviousDayData: async (storeId: string, reportDate: Date) => {
    try {
      const previousDay = subDays(reportDate, 1);
      const previousDayReport = await prisma.dailyReport.findFirst({
        where: {
          storeId,
          reportDate: {
            gte: startOfDay(previousDay),
            lte: endOfDay(previousDay)
          }
        },
        include: {
          lottery: true
        }
      });

      return {
        onlineNetSales: previousDayReport?.lottery?.todayOnlineNetSales || 0,
        onlineCashing: previousDayReport?.lottery?.todayOnlineCashing || 0,
        instantCashing: previousDayReport?.lottery?.todayInstantCashing || 0
      };
    } catch (error) {
      console.error('Error getting previous day lottery data:', error);
      throw error;
    }
  },

  // Create or update lottery report
  upsertLotteryReport: async (dailyReportId: string, data: {
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
  }) => {
    try {
      return await prisma.lotteryReport.upsert({
        where: {
          dailyReportId
        },
        create: {
          dailyReportId,
          ...data
        },
        update: data
      });
    } catch (error) {
      console.error('Error upserting lottery report:', error);
      throw error;
    }
  },

  // Activate lottery book
  activateBook: async (storeId: string, bookNumber: string) => {
    try {
      // Parse book number format: XXX-XXXXXX-X
      const [gameNumber, bookNum, referenceNumber] = bookNumber.split('-');
      
      // Find the game
      const game = await prisma.lotteryMaster.findUnique({
        where: { gameNumber }
      });

      if (!game) {
        throw new AppError(404, 'Game not found', 'GAME_NOT_FOUND');
      }

      // Check if book exists in inventory
      let inventory = await prisma.lotteryInventory.findFirst({
        where: {
          storeId,
          gameId: game.id,
          bookNumber: bookNum
        },
        include: {
          game: true
        }
      });

      if (!inventory) {
        // Create new inventory entry if book doesn't exist
        inventory = await prisma.lotteryInventory.create({
          data: {
            storeId,
            gameId: game.id,
            bookNumber: bookNum,
            referenceNumber,
            status: 'activated'
          },
          include: {
            game: true
          }
        });
      } else {
        // Update existing inventory entry
        inventory = await prisma.lotteryInventory.update({
          where: { id: inventory.id },
          data: {
            status: 'activated',
            referenceNumber
          },
          include: {
            game: true
          }
        });
      }

      return inventory;
    } catch (error) {
      console.error('Error activating lottery book:', error);
      throw error;
    }
  },

  // Return lottery book
  returnBook: async (storeId: string, bookNumber: string) => {
    try {
      const inventory = await prisma.lotteryInventory.findFirst({
        where: {
          storeId,
          bookNumber,
          status: 'activated'
        }
      });

      if (!inventory) {
        throw new AppError(404, 'Active book not found', 'BOOK_NOT_FOUND');
      }

      return await prisma.lotteryInventory.update({
        where: { id: inventory.id },
        data: { status: 'returned' },
        include: {
          game: true
        }
      });
    } catch (error) {
      console.error('Error returning lottery book:', error);
      throw error;
    }
  },

  // Process scanned ticket
  processTicket: async (dailyReportId: string, ticketNumber: string) => {
    try {
      // Parse ticket number format: XXX-XXXXXX-XXX
      const [gameNumber, bookNum, ticketNum] = ticketNumber.split('-');

      // Find the game
      const game = await prisma.lotteryMaster.findUnique({
        where: { gameNumber }
      });

      if (!game) {
        throw new AppError(404, 'Game not found', 'GAME_NOT_FOUND');
      }

      // Get daily report to find store
      const dailyReport = await prisma.dailyReport.findUnique({
        where: { id: dailyReportId }
      });

      if (!dailyReport) {
        throw new AppError(404, 'Daily report not found', 'REPORT_NOT_FOUND');
      }

      // Find the inventory entry
      const inventory = await prisma.lotteryInventory.findFirst({
        where: {
          storeId: dailyReport.storeId,
          gameId: game.id,
          bookNumber: bookNum,
          status: 'activated'
        }
      });

      if (!inventory) {
        throw new AppError(404, 'Active book not found', 'BOOK_NOT_FOUND');
      }

      // Create scanned ticket
      const ticket = await prisma.scannedTicket.create({
        data: {
          dailyReportId,
          inventoryId: inventory.id,
          ticketNumber: ticketNum
        },
        include: {
          inventory: {
            include: {
              game: true
            }
          }
        }
      });

      return ticket;
    } catch (error) {
      console.error('Error processing ticket:', error);
      throw error;
    }
  }
}; 