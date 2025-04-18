import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export const reportRoutes = Router();

const reportItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  isCalculated: z.boolean().optional()
});

const reportSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  storeId: z.string(),
  reportItems: z.array(reportItemSchema),
  totalIncome: z.number(),
  totalDeductions: z.number(),
  cashToAccount: z.number(),
  overShort: z.number()
});

// Get all reports for a store
reportRoutes.get('/store/:storeId', async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    const where: any = { storeId };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    res.json(reports);
  } catch (error) {
    next(error);
  }
});

// Get report by ID
reportRoutes.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id }
    });

    if (!report) {
      throw new AppError(404, 'Report not found', 'NOT_FOUND');
    }

    res.json(report);
  } catch (error) {
    next(error);
  }
});

// Create or update report
reportRoutes.post('/', async (req, res, next) => {
  try {
    const data = reportSchema.parse(req.body);

    // Check if report exists for this date and store
    const existingReport = await prisma.report.findFirst({
      where: {
        storeId: data.storeId,
        date: {
          equals: data.date
        }
      }
    });

    let report;
    if (existingReport) {
      // Update existing report
      report = await prisma.report.update({
        where: { id: existingReport.id },
        data
      });
    } else {
      // Create new report
      report = await prisma.report.create({
        data
      });
    }

    res.status(201).json(report);
  } catch (error) {
    next(error);
  }
});

// Delete report
reportRoutes.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.report.delete({
      where: { id }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}); 