import express from 'express';
import { auditRoutes } from './routes/audit.routes';

const app = express();

// Add audit routes
app.use('/api/audit-logs', auditRoutes);

export default app; 