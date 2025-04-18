import { Router } from 'express';
import { authRoutes } from './auth.routes';
import { storeRoutes } from './store.routes';
import { reportRoutes } from './report.routes';
import { lotteryRoutes } from './lottery.routes';
import { userRoutes } from './user.routes';
import { auditRoutes } from './audit.routes';
import { authenticate } from '../middleware/auth';

export const routes = Router();

// Public routes
routes.use('/auth', authRoutes);

// Protected routes
routes.use('/stores', authenticate, storeRoutes);
routes.use('/reports', authenticate, reportRoutes);
routes.use('/lottery', authenticate, lotteryRoutes);
routes.use('/users', authenticate, userRoutes);
routes.use('/audit-logs', authenticate, auditRoutes); 