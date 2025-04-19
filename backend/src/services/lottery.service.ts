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
  activateBook: async (storeId: string, bookNumber: string, userId?: string) => {
    try {
      // Validate book number format: XXX-XXXXXX-X
      const bookNumberRegex = /^\d{3}-\d{6}-\d{1}$/;
      if (!bookNumberRegex.test(bookNumber)) {
        throw new AppError(400, 'Invalid book number format. Expected format: XXX-XXXXXX-X', 'INVALID_BOOK_NUMBER');
      }

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

      // If book exists and is already activated, throw an error
      if (inventory && inventory.status === 'activated') {
        throw new AppError(409, 'This book is already activated', 'BOOK_ALREADY_ACTIVATED');
      }

      let oldValues = null;
      let newValues = null;

      if (!inventory) {
        // Create new inventory entry if book doesn't exist
        oldValues = null;
        newValues = {
          storeId,
          gameId: game.id,
          bookNumber: bookNum,
          referenceNumber,
          status: 'activated'
        };

        inventory = await prisma.lotteryInventory.create({
          data: newValues,
          include: {
            game: true
          }
        });
      } else {
        // Update existing inventory entry
        oldValues = {
          status: inventory.status,
          referenceNumber: inventory.referenceNumber
        };
        newValues = {
          status: 'activated',
          referenceNumber
        };

        inventory = await prisma.lotteryInventory.update({
          where: { id: inventory.id },
          data: newValues,
          include: {
            game: true
          }
        });
      }

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          userId,
          entityType: 'lottery_inventory',
          entityId: inventory.id,
          actionTypeId: 'ACTIVATE_BOOK',
          oldValues: oldValues ? JSON.stringify(oldValues) : null,
          newValues: JSON.stringify(newValues),
          metadata: JSON.stringify({
            gameNumber,
            gameName: game.gameName,
            bookNumber: bookNum,
            referenceNumber,
            storeId
          })
        }
      });

      return inventory;
    } catch (error) {
      console.error('Error activating lottery book:', error);
      throw error;
    }
  },

  // Return lottery book
  returnBook: async (storeId: string, bookNumber: string, userId?: string) => {
    try {
      // Validate book number format: XXX-XXXXXX-X
      const bookNumberRegex = /^\d{3}-\d{6}-\d{1}$/;
      if (!bookNumberRegex.test(bookNumber)) {
        throw new AppError(400, 'Invalid book number format. Expected format: XXX-XXXXXX-X', 'INVALID_BOOK_NUMBER');
      }

      // Parse book number format: XXX-XXXXXX-X
      const [gameNumber, bookNum] = bookNumber.split('-');

      const inventory = await prisma.lotteryInventory.findFirst({
        where: {
          storeId,
          game: {
            gameNumber
          },
          bookNumber: bookNum,
          status: 'activated'
        },
        include: {
          game: true
        }
      });

      if (!inventory) {
        throw new AppError(404, 'Active book not found', 'BOOK_NOT_FOUND');
      }

      const oldValues = {
        status: inventory.status
      };

      const updatedInventory = await prisma.lotteryInventory.update({
        where: { id: inventory.id },
        data: { status: 'returned' },
        include: {
          game: true
        }
      });

      // Create audit log entry
      await prisma.auditLog.create({
        data: {
          userId,
          entityType: 'lottery_inventory',
          entityId: inventory.id,
          actionTypeId: 'RETURN_BOOK',
          oldValues: JSON.stringify(oldValues),
          newValues: JSON.stringify({ status: 'returned' }),
          metadata: JSON.stringify({
            gameNumber,
            gameName: inventory.game.gameName,
            bookNumber: bookNum,
            storeId
          })
        }
      });

      return updatedInventory;
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