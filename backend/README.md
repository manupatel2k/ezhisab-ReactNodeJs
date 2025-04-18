# Business Management System Backend

This is the backend service for the Business Management System, providing API endpoints for managing business reports, invoices, payroll, and lottery operations.

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Update the values in `.env` with your configuration

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start the development server with hot reload
- `npm run build`: Build the production version
- `npm start`: Start the production server
- `npm run lint`: Run ESLint
- `npm run test`: Run tests

## API Documentation

The API provides endpoints for:

- Business Reports
- Invoices
- Payroll
- Lottery Operations
  - Master Games
  - Inventory
  - Scanned Tickets

## Database Schema

The system uses PostgreSQL with Prisma as the ORM. Key entities include:

- Stores
- Business Reports
- Invoices
- Payroll Entries
- Lottery Games
- Lottery Inventory
- Scanned Tickets

## Security

- JWT-based authentication
- Role-based access control
- Input validation
- CORS protection
- Rate limiting

## Error Handling

The API uses standard HTTP status codes and returns consistent error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run tests
4. Submit a pull request

## License

MIT 