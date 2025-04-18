
/**
 * Database Schema Design for Store Management System
 * 
 * This file provides a conceptual relational database schema for the application.
 * It is designed to be normalized, scalable, and support all the features of the application.
 */

/**
 * Users Table
 * Stores user information and authentication data
 */
export interface UserTable {
  id: string; // Primary Key, UUID
  email: string; // Unique
  password_hash: string; // Hashed password
  first_name: string;
  last_name: string;
  role: 'admin' | 'manager' | 'employee'; // User role
  phone_number: string | null;
  created_at: Date;
  updated_at: Date;
  last_login_at: Date | null;
  is_active: boolean;
}

/**
 * Stores Table
 * Information about each store location
 */
export interface StoreTable {
  id: string; // Primary Key, UUID
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  tax_id: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

/**
 * User-Store Assignments
 * Many-to-many relationship between Users and Stores
 * One user can work at multiple stores, and one store can have multiple users
 */
export interface UserStoreTable {
  id: string; // Primary Key, UUID
  user_id: string; // Foreign Key to Users.id
  store_id: string; // Foreign Key to Stores.id
  position: string; // Position at this particular store
  is_primary: boolean; // Whether this is the user's primary store
  created_at: Date;
  updated_at: Date;
}

/**
 * Business Reports Table
 * Daily business reports for each store
 */
export interface BusinessReportTable {
  id: string; // Primary Key, UUID
  store_id: string; // Foreign Key to Stores.id
  user_id: string; // Foreign Key to Users.id (who created the report)
  report_date: Date;
  net_sales_register: number;
  net_taxes: number;
  meal_tax: number;
  refund: number;
  cheque: number;
  credit_card: number;
  register_cash: number;
  over_short: number;
  cash_to_account: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Lottery Reports Table
 * Daily lottery reports for each store
 */
export interface LotteryReportTable {
  id: string; // Primary Key, UUID
  store_id: string; // Foreign Key to Stores.id
  user_id: string; // Foreign Key to Users.id (who created the report)
  report_date: Date;
  online_net_sales: number;
  online_cashing: number;
  instant_cashing: number;
  instant_sale_sr34: number;
  prev_day_online_net_sales: number;
  prev_day_online_cashing: number;
  prev_day_instant_cashing: number;
  total_online_balance: number;
  credit_sales: number;
  debit_sales: number;
  register_cash: number;
  over_short: number;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Lottery Games Table
 * Information about different lottery games
 */
export interface LotteryGameTable {
  id: string; // Primary Key, UUID
  game_number: string; // Unique identifier for the game
  game_name: string;
  price: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Lottery Books Table
 * Information about lottery ticket books
 */
export interface LotteryBookTable {
  id: string; // Primary Key, UUID
  store_id: string; // Foreign Key to Stores.id
  game_id: string; // Foreign Key to LotteryGames.id
  book_number: string;
  reference_number: string;
  status: 'activated' | 'returned' | 'sold';
  activated_by: string; // Foreign Key to Users.id
  activated_at: Date;
  returned_at: Date | null;
  returned_by: string | null; // Foreign Key to Users.id
  total_tickets: number;
  start_ticket_number: number;
  current_ticket_number: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Lottery Tickets Table
 * Information about individual lottery tickets
 */
export interface LotteryTicketTable {
  id: string; // Primary Key, UUID
  book_id: string; // Foreign Key to LotteryBooks.id
  ticket_number: number;
  sold_at: Date | null;
  sold_by: string | null; // Foreign Key to Users.id
  winning_amount: number | null;
  redeemed_at: Date | null;
  redeemed_by: string | null; // Foreign Key to Users.id
  created_at: Date;
  updated_at: Date;
}

/**
 * Expenses Table
 * Store expenses
 */
export interface ExpenseTable {
  id: string; // Primary Key, UUID
  store_id: string; // Foreign Key to Stores.id
  user_id: string; // Foreign Key to Users.id (who recorded the expense)
  vendor_id: string; // Foreign Key to Vendors.id
  expense_date: Date;
  expense_type: 'utility' | 'maintenance' | 'inventory' | 'salary' | 'rent' | 'other';
  amount: number;
  payment_method: 'cash' | 'cheque' | 'credit' | 'debit' | 'bank_transfer';
  invoice_number: string | null;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Vendors Table
 * Information about vendors/suppliers
 */
export interface VendorTable {
  id: string; // Primary Key, UUID
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Purchases Table
 * Store inventory purchases
 */
export interface PurchaseTable {
  id: string; // Primary Key, UUID
  store_id: string; // Foreign Key to Stores.id
  user_id: string; // Foreign Key to Users.id (who recorded the purchase)
  vendor_id: string; // Foreign Key to Vendors.id
  purchase_date: Date;
  invoice_number: string;
  total_amount: number;
  payment_method: 'cash' | 'cheque' | 'credit' | 'debit' | 'bank_transfer';
  payment_status: 'paid' | 'pending' | 'partially_paid';
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Purchase Items Table
 * Individual items in a purchase
 */
export interface PurchaseItemTable {
  id: string; // Primary Key, UUID
  purchase_id: string; // Foreign Key to Purchases.id
  product_id: string; // Foreign Key to Products.id
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * Products Table
 * Products sold in the store
 */
export interface ProductTable {
  id: string; // Primary Key, UUID
  name: string;
  description: string | null;
  sku: string | null; // Stock Keeping Unit
  barcode: string | null;
  category_id: string | null; // Foreign Key to ProductCategories.id
  price: number;
  cost: number;
  tax_rate: number;
  inventory_quantity: number;
  reorder_level: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Product Categories Table
 */
export interface ProductCategoryTable {
  id: string; // Primary Key, UUID
  name: string;
  description: string | null;
  parent_id: string | null; // For hierarchical categories, Foreign Key to ProductCategories.id
  created_at: Date;
  updated_at: Date;
}

/**
 * Employees Table
 * Additional employee information beyond User table
 */
export interface EmployeeTable {
  id: string; // Primary Key, UUID
  user_id: string; // Foreign Key to Users.id
  hire_date: Date;
  hourly_rate: number | null;
  salary: number | null;
  employment_type: 'full_time' | 'part_time' | 'contract' | 'seasonal';
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Payroll Table
 */
export interface PayrollTable {
  id: string; // Primary Key, UUID
  employee_id: string; // Foreign Key to Employees.id
  store_id: string; // Foreign Key to Stores.id
  pay_period_start: Date;
  pay_period_end: Date;
  hours_worked: number;
  overtime_hours: number;
  gross_amount: number;
  tax_deductions: number;
  net_amount: number;
  payment_method: 'cheque' | 'direct_deposit' | 'cash';
  payment_status: 'paid' | 'pending';
  paid_by: string | null; // Foreign Key to Users.id
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Audit Logs Table
 * System audit trail
 */
export interface AuditLogTable {
  id: string; // Primary Key, UUID
  user_id: string | null; // Foreign Key to Users.id
  action: string;
  entity_type: string; // Table name
  entity_id: string | null; // Primary key of affected record
  old_values: object | null; // JSON
  new_values: object | null; // JSON
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
}

/**
 * Settings Table
 * System-wide and store-specific settings
 */
export interface SettingTable {
  id: string; // Primary Key, UUID
  store_id: string | null; // Foreign Key to Stores.id, null for global settings
  key: string;
  value: string;
  data_type: 'string' | 'number' | 'boolean' | 'json';
  is_global: boolean;
  created_at: Date;
  updated_at: Date;
}

/** 
 * Database Schema Relationships
 * 
 * Users - Stores: Many-to-Many (through UserStoreTable)
 * Users - BusinessReports: One-to-Many
 * Users - LotteryReports: One-to-Many 
 * Users - Expenses: One-to-Many
 * Users - Purchases: One-to-Many
 * Users - LotteryBooks (activated_by): One-to-Many
 * Users - LotteryBooks (returned_by): One-to-Many
 * Users - LotteryTickets (sold_by): One-to-Many
 * Users - LotteryTickets (redeemed_by): One-to-Many
 * Users - AuditLogs: One-to-Many
 * Users - Employees: One-to-One
 * 
 * Stores - BusinessReports: One-to-Many
 * Stores - LotteryReports: One-to-Many
 * Stores - LotteryBooks: One-to-Many
 * Stores - Expenses: One-to-Many
 * Stores - Purchases: One-to-Many
 * Stores - Settings: One-to-Many
 * 
 * Vendors - Expenses: One-to-Many
 * Vendors - Purchases: One-to-Many
 * 
 * LotteryGames - LotteryBooks: One-to-Many
 * LotteryBooks - LotteryTickets: One-to-Many
 * 
 * Purchases - PurchaseItems: One-to-Many
 * Products - PurchaseItems: One-to-Many
 * ProductCategories - Products: One-to-Many
 * ProductCategories - ProductCategories (parent-child): One-to-Many
 * 
 * Employees - Payroll: One-to-Many
 */
