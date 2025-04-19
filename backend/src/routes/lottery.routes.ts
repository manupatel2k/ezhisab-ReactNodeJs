import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import { lotteryService } from '../services/lottery.service';

export const lotteryRoutes = Router();

// Schema for lottery game
const lotteryGameSchema = z.object({
  gameNumber: z.string(),
  gameName: z.string(),
  price: z.number().positive(),
  ticketsPerBook: z.number().int().positive(),
  isActive: z.boolean().optional().default(true)
});

// Schema for lottery report
const lotteryReportSchema = z.object({
  todayOnlineNetSales: z.number(),
  todayOnlineCashing: z.number(),
  todayInstantCashing: z.number(),
  todayInstantSaleSr34: z.number(),
  yesterdayOnlineNetSales: z.number(),
  yesterdayOnlineCashing: z.number(),
  yesterdayInstantCashing: z.number(),
  totalOnlineBalance: z.number(),
  creditSales: z.number(),
  debitSales: z.number(),
  registerCash: z.number(),
  overShort: z.number(),
  notes: z.string().optional()
});

// Schema for lottery inventory
const lotteryInventorySchema = z.object({
  storeId: z.string(),
  gameId: z.string(),
  bookNumber: z.string(),
  referenceNumber: z.string().optional(),
  status: z.enum(['available', 'activated', 'sold', 'returned', 'settled']).optional().default('available')
});

// Schema for scanned ticket
const scannedTicketSchema = z.object({
  dailyReportId: z.string(),
  inventoryId: z.string(),
  ticketNumber: z.string()
});

// Get all lottery games
lotteryRoutes.get('/games', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const games = await prisma.lotteryMaster.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        gameNumber: 'asc'
      }
    });
    
    res.json(games);
  } catch (error) {
    next(error);
  }
});

// Get lottery books by status
lotteryRoutes.get('/books', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const books = await prisma.lotteryInventory.findMany({
      where: {
        status: status as string
      },
      include: {
        game: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(books);
  } catch (error) {
    next(error);
  }
});

// Create new lottery game
lotteryRoutes.post('/games', authorize('admin'), async (req, res, next) => {
  try {
    const data = lotteryGameSchema.parse(req.body);

    // Check if game number already exists
    const existingGame = await prisma.lotteryMaster.findUnique({
      where: {
        gameNumber: data.gameNumber
      }
    });

    if (existingGame) {
      throw new AppError(409, 'Game number already exists', 'DUPLICATE_GAME');
    }

    const game = await prisma.lotteryMaster.create({
      data
    });

    res.status(201).json(game);
  } catch (error) {
    next(error);
  }
});

// Update lottery game
lotteryRoutes.put('/games/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = lotteryGameSchema.parse(req.body);

    // Check if game exists
    const existingGame = await prisma.lotteryMaster.findUnique({
      where: { id }
    });

    if (!existingGame) {
      throw new AppError(404, 'Game not found', 'GAME_NOT_FOUND');
    }

    // Check if new game number conflicts with another game
    if (data.gameNumber !== existingGame.gameNumber) {
      const gameWithNumber = await prisma.lotteryMaster.findUnique({
        where: { gameNumber: data.gameNumber }
      });

      if (gameWithNumber) {
        throw new AppError(409, 'Game number already exists', 'DUPLICATE_GAME');
      }
    }

    const updatedGame = await prisma.lotteryMaster.update({
      where: { id },
      data
    });

    res.json(updatedGame);
  } catch (error) {
    next(error);
  }
});

// Delete lottery game
lotteryRoutes.delete('/games/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if game exists
    const existingGame = await prisma.lotteryMaster.findUnique({
      where: { id }
    });

    if (!existingGame) {
      throw new AppError(404, 'Game not found', 'GAME_NOT_FOUND');
    }

    // Soft delete by setting isActive to false
    await prisma.lotteryMaster.update({
      where: { id },
      data: { isActive: false }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Get previous day's lottery data
lotteryRoutes.get('/previous-data/:storeId', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { date } = req.query;
    const reportDate = date ? new Date(date as string) : new Date();

    const data = await lotteryService.getPreviousDayData(storeId, reportDate);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// Create or update lottery report
lotteryRoutes.post('/reports/:dailyReportId', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { dailyReportId } = req.params;
    const data = lotteryReportSchema.parse(req.body);

    const report = await lotteryService.upsertLotteryReport(dailyReportId, data);
    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Activate lottery book
lotteryRoutes.post('/books/activate', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { storeId, bookNumber } = req.body;
    if (!storeId || !bookNumber) {
      throw new AppError(400, 'Store ID and book number are required', 'MISSING_REQUIRED_FIELDS');
    }
    const result = await lotteryService.activateBook(storeId, bookNumber, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Return lottery book
lotteryRoutes.post('/books/return', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { storeId, bookNumber } = req.body;
    if (!storeId || !bookNumber) {
      throw new AppError(400, 'Store ID and book number are required', 'MISSING_REQUIRED_FIELDS');
    }
    const result = await lotteryService.returnBook(storeId, bookNumber, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Process scanned ticket
lotteryRoutes.post('/tickets/scan', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { dailyReportId, ticketNumber } = req.body;

    if (!dailyReportId || !ticketNumber) {
      throw new AppError(400, 'Daily report ID and ticket number are required', 'MISSING_FIELDS');
    }

    const ticket = await lotteryService.processTicket(dailyReportId, ticketNumber);
    res.json(ticket);
  } catch (error) {
    next(error);
  }
});

// Get scanned tickets for a daily report
lotteryRoutes.get('/tickets/:dailyReportId', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { dailyReportId } = req.params;

    const tickets = await prisma.scannedTicket.findMany({
      where: {
        dailyReportId
      },
      include: {
        inventory: {
          include: {
            game: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(tickets);
  } catch (error) {
    next(error);
  }
});

// Delete scanned ticket
lotteryRoutes.delete('/tickets/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.scannedTicket.delete({
      where: { id }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Get all lottery inventory items
lotteryRoutes.get('/inventory', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      throw new AppError(400, 'Store ID is required', 'MISSING_STORE_ID');
    }
    
    const inventory = await prisma.lotteryInventory.findMany({
      where: {
        storeId: storeId as string
      },
      include: {
        game: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

// Create a new inventory item
lotteryRoutes.post('/inventory', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = lotteryInventorySchema.parse(req.body);
    
    // Check if book already exists
    const existingBook = await prisma.lotteryInventory.findFirst({
      where: {
        storeId: data.storeId,
        gameId: data.gameId,
        bookNumber: data.bookNumber
      }
    });
    
    if (existingBook) {
      throw new AppError(409, 'Book already exists in inventory', 'DUPLICATE_BOOK');
    }
    
    // Create new inventory item
    const inventory = await prisma.lotteryInventory.create({
      data: {
        storeId: data.storeId,
        gameId: data.gameId,
        bookNumber: data.bookNumber,
        referenceNumber: data.referenceNumber,
        status: data.status || 'available'
      },
      include: {
        game: true
      }
    });
    
    res.status(201).json(inventory);
  } catch (error) {
    next(error);
  }
});

// Update inventory item status
lotteryRoutes.put('/inventory/:id/status', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      throw new AppError(400, 'Status is required', 'MISSING_STATUS');
    }
    
    const inventory = await prisma.lotteryInventory.update({
      where: { id },
      data: { status },
      include: {
        game: true
      }
    });
    
    res.json(inventory);
  } catch (error) {
    next(error);
  }
});

// Delete inventory item
lotteryRoutes.delete('/inventory/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.lotteryInventory.delete({
      where: { id }
    });
    
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}); 