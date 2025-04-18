# Business Application Project Guide

## Overview
This document outlines the core business logic and functionality implemented in the Business Application. The application manages store operations, business reports, gas sales, and lottery ticket management.

## 1. Business Reports

### 1.1 Daily Business Report
- **Financial Tracking**
  - Net sales from register
  - Net taxes
  - Meal tax
  - Refunds
  - Cheque payments
  - Credit card transactions
  - Register cash
  - Over/Short calculations
  - Cash to account

- **Report Management**
  - Reports are store-specific
  - One report per store per day
  - Reports can be updated if they exist
  - Automatic calculations for totals
  - Historical data preservation
  - Date selection functionality:
    - When user changes the date, system automatically loads data for that date if it exists
    - If no report exists for the selected date, a new empty report is created
    - Date changes trigger a complete data refresh for the selected store and date
    - Date selection is preserved when switching between tabs

- **Calculated Fields**
  - Total Income = Net Sales + Net Taxes + Meal Tax
  - Total Deductions = Refunds + Cheques + Credit Card
  - Cash to Account = Total Income - Total Deductions - Purchase Expenses - Payroll
  - Over/Short = Register Cash - Cash to Account
  - These fields are automatically calculated and cannot be manually edited

- **Action Buttons**
  - Save Report: Saves all data (business report, invoices, payroll, lottery data) to the database
  - Clear Form: Resets all fields to default values without saving
  - Print Report: Generates a printable version of the current report
  - Export Data: Exports report data in various formats (CSV, PDF)

### 1.2 Invoice Management
- **Types of Invoices**
  - Purchase invoices
  - Expense invoices
  - Each invoice requires:
    - Date
    - Invoice number
    - Vendor name
    - Payment method (cash, check, bank_card, ach, eft)
    - Amount

- **Invoice Operations**
  - Add new invoices
  - Edit existing invoices
  - Delete invoices
  - Automatic total calculations
  - Invoices are linked to specific business reports
  - Invoices affect the Cash to Account calculation
  - Invoice data is loaded when a report date is selected
  - Invoices are saved together with the business report

### 1.3 Payroll Management
- **Payroll Entries**
  - Employee information
  - Hours worked (for hourly employees)
  - Rate of pay
  - Total amount (calculated automatically for hourly employees)
  - Payment method (cash, check, bank_card, ach, eft)
  - Check number (required if payment method is check)
  - Salary unit (hourly, weekly, bi_weekly, monthly)
  - Start and end dates for the pay period

- **Payroll Operations**
  - Add new payroll entries
  - Edit existing entries
  - Delete entries
  - Automatic total calculations
  - For hourly employees, total amount = rate × hours
  - For other salary units, total amount is entered directly
  - Payroll entries are linked to specific business reports
  - Payroll affects the Cash to Account calculation
  - Payroll data is loaded when a report date is selected
  - Payroll entries are saved together with the business report

## 2. Lottery Management

### 2.1 Ticket Scanning
- **Ticket Format**
  - Must follow XXX-XXXXXX-XXX pattern
  - First 3 digits: Game number
  - Middle 6 digits: Book number
  - Last 3 digits: Ticket number

- **Scanning Rules**
  - Books must be activated before scanning
  - No duplicate scans on the same day
  - Sequential ticket number validation
  - Automatic quantity and total calculations
  - Scanned tickets are recorded with:
    - Game information
    - Book number
    - Ticket number
    - Quantity sold
    - Total amount
  - Today's current ticket number cannot be higher than yesterday's scanned ticket number
  - System prevents scanning tickets outside the book's valid range
  - System validates that the game exists before accepting a scan
  - System checks for duplicate scans within the same business day

- **Scanning Process**
  1. User initiates scan (via barcode scanner or manual entry)
  2. System validates ticket format (XXX-XXXXXX-XXX)
  3. System extracts game number, book number, and ticket number
  4. System checks if game exists in the database
  5. If game doesn't exist, error is displayed and scan is rejected
  6. System checks if book exists in inventory for the selected store
  7. If book doesn't exist, system offers to add it to inventory
  8. If book exists, system validates ticket number against book's start/end range
  9. System checks for duplicate scans on the same day
  10. If all validations pass, scan is recorded and totals are updated

- **Ticket Number Validation**
  - System validates that scanned ticket number is within the book's range
  - For first scan of a book, system records the ticket number as the start number
  - For subsequent scans, system validates against the recorded start number
  - System calculates quantity sold based on current ticket number - start number
  - System validates that quantity sold doesn't exceed book's total tickets
  - If ticket number is out of range, error is displayed and scan is rejected
  - System prevents scanning a ticket number lower than a previously scanned ticket
  - System validates that the ticket number follows the expected sequence

- **Start Number Determination**
  - For new books, first scanned ticket becomes the start number
  - System looks back up to 30 days to find the most recent scan for a book
  - If no previous scans exist within 30 days, first scan becomes new start number
  - Start number can be manually adjusted by authorized users
  - Start number changes are logged for audit purposes
  - System prevents start number from being set higher than any previously scanned ticket
  - Start number is stored in the database and used for all future scans of the book

- **Barcode/QR Code Scanning**
  - System supports both barcode and QR code scanning
  - Scanner integration through browser's Web API
  - Automatic camera access for scanning
  - Manual entry option if scanning fails
  - Error handling for invalid scans
  - Real-time validation during scanning
  - Support for multiple scanner types (USB, Bluetooth, built-in)

### 2.2 Book Management
- **Book Activation**
  - Format: XXX-XXXXXX-X
  - Game number validation
  - Book number tracking
  - Reference number assignment
  - Status tracking (available, activated, sold, returned, settled, void)
  - Start and end ticket numbers are automatically calculated based on game settings

- **Book Number Format**
  - First 3 digits: Game number (must match an existing game)
  - Middle 6 digits: Unique book identifier
  - Last digit: Check digit for validation
  - System validates book number format during activation
  - Duplicate book numbers are rejected
  - Book numbers must be unique within a store and game combination

- **Book Activation Process**
  1. User enters book number or scans book
  2. System validates book number format
  3. System checks if game exists
  4. System checks if book already exists in inventory
  5. If book exists, system checks its current status
  6. If book is available, system activates it
  7. If book is already activated, system displays current status
  8. If book doesn't exist, system creates new inventory record
  9. System assigns reference number during activation
  10. System calculates start and end ticket numbers based on game settings

- **Book Reference Numbers**
  - Automatically generated during activation
  - Format: STORE-YYYYMMDD-XXX (store code, date, sequential number)
  - Reference numbers are unique across all stores
  - Reference numbers are used for tracking and reporting
  - Reference numbers cannot be modified after assignment

- **Book Operations**
  - Activate new books
  - Return books
  - Delete books
  - Track book status
  - Books can be activated directly or through scanning
  - When a book is activated, it's added to the store's inventory
  - Books can be returned to change their status
  - Book data is loaded when a report date is selected
  - Book status changes are saved with the business report

- **Book Status Transitions**
  - available → activated (when book is activated)
  - activated → sold (when all tickets are sold)
  - activated → returned (when book is returned)
  - sold → settled (when sales are reconciled)
  - Any status → void (when book is voided)
  - Status transitions are logged for audit purposes
  - Some transitions require authorization (e.g., void)
  - Status transitions are tracked in the database with timestamps
  - Status changes are reflected in the UI with color coding
  - Status history is maintained for reporting purposes

- **Book Lifecycle**
  1. **Creation**: Book is added to inventory with status "available"
  2. **Activation**: Book is activated for sale, status changes to "activated"
  3. **Sales**: Tickets are scanned and sold, tracking progress toward completion
  4. **Completion**: All tickets are sold, status changes to "sold"
  5. **Settlement**: Sales are reconciled, status changes to "settled"
  6. **Return**: Book is returned (if needed), status changes to "returned"
  7. **Void**: Book is voided (if necessary), status changes to "void"
  - Each stage in the lifecycle is tracked with timestamps
  - Lifecycle stages cannot be skipped (e.g., cannot go from "available" to "sold")
  - Some transitions require specific conditions (e.g., all tickets must be sold before "sold" status)
  - Lifecycle data is used for reporting and auditing

### 2.3 Lottery Games
- **Game Information**
  - Game number
  - Game name
  - Cost per ticket
  - Tickets per book
  - Game status (active, inactive, discontinued)
  - Game start date and end date
  - Game description and rules

- **Game Management**
  - Add new games
  - Edit game details
  - Track game inventory
  - Associate games with books
  - Games must be created before books can be activated
  - Game data is loaded when the Lottery Master modal is opened
  - Game changes are saved immediately when the modal is closed

- **Game Settings**
  - Price per ticket (fixed or variable)
  - Tickets per book (standard or variable)
  - Commission rate
  - Payout structure
  - Game rules and restrictions
  - Game-specific validation rules

### 2.4 Lottery Inventory Workflow
- **Inventory Creation**
  - Books are added to inventory with status "available"
  - Each book is associated with a specific game and store
  - Books can be added manually or through scanning
  - Inventory records include:
    - Game information
    - Book number
    - Reference number
    - Start ticket number
    - End ticket number
    - Current status
    - Activation date
    - Last scan date
    - Total tickets sold
    - Total amount

- **Inventory Start/End Numbers**
  - Start number: First ticket number in the book (typically 001)
  - End number: Last ticket number in the book (based on game settings)
  - System validates that start number is less than end number
  - System prevents scanning tickets outside this range
  - Start/end numbers are displayed during book activation
  - Start/end numbers can be manually adjusted by authorized users
  - Start/end numbers are used to calculate the total number of tickets in a book
  - Start/end numbers are stored in the database and used for validation

- **Book Activation Process**
  1. Scan a book number or enter it manually
  2. System validates the game number
  3. If game exists, system checks if book is in inventory
  4. If book exists and is not activated, status is updated to "activated"
  5. If book doesn't exist, it's added to inventory with "activated" status
  6. Reference number is assigned during activation
  7. Activated books appear in the activated books list
  8. Activation date and time are recorded
  9. Activation is logged for audit purposes

- **Book Return Process**
  1. Select a book to return
  2. System updates book status to "returned"
  3. Returned books are tracked separately from activated books
  4. Return process requires authorization
  5. Return reason must be provided
  6. Return date and time are recorded
  7. Returned books can be reactivated if needed
  8. Return is logged for audit purposes

- **Inventory Status Transitions**
  - available → activated (when book is activated)
  - activated → sold (when all tickets are sold)
  - activated → returned (when book is returned)
  - sold → settled (when sales are reconciled)
  - Any status → void (when book is voided)
  - Status transitions are tracked in the database
  - Status changes are reflected in the UI
  - Status history is maintained for reporting

- **Inventory Management**
  - View current inventory status
  - Filter inventory by game, status, or date
  - Search for specific books
  - Export inventory reports
  - Inventory data is loaded when the Lottery Inventory modal is opened
  - Inventory changes are saved when the modal is closed

- **Inventory Reconciliation**
  - Daily reconciliation of scanned tickets vs. inventory
  - Weekly reconciliation of total sales vs. inventory
  - Monthly reconciliation of all books
  - Reconciliation reports identify discrepancies
  - Discrepancies require investigation and resolution
  - Reconciliation process requires authorization
  - Reconciliation data is used for financial reporting

- **Inventory Reports**
  - Current inventory status by game
  - Books activated today
  - Books returned today
  - Books sold today
  - Inventory value report
  - Sales by game report
  - Commission report
  - Reconciliation report

## 3. Financial Calculations

### 3.1 Business Report Calculations
- **Income Calculations**
  - Total Income = Net Sales + Net Taxes + Meal Tax
  - Total Deductions = Refunds + Cheques + Credit Card
  - Cash to Account = Total Income - Total Deductions - Purchase Expenses - Payroll

- **Automatic Calculations**
  - These calculations happen in real-time as values change
  - Calculated fields are displayed with a different background color
  - Users cannot manually edit calculated fields
  - Calculations are performed on the client side for immediate feedback
  - Final calculations are verified on the server side when saving

### 3.2 Lottery Calculations
- **Online Sales**
  - Today's online net sales
  - Yesterday's online net sales
  - Previous day's online net sales
  - Online sales difference calculations

- **Cashing Calculations**
  - Online cashing tracking
  - Instant cashing tracking
  - Cashing difference calculations

- **Balance Calculations**
  - Total Online Balance = Online Sales Difference - Online Cashing Difference - Instant Cashing Difference + Instant Sale SR34
  - Over/Short = Register Cash - Total Online Balance
  - These calculations happen in real-time as values change

- **Ticket Scanning Calculations**
  - Quantity sold = Current ticket number - Start ticket number
  - Total amount = Quantity sold × Price per ticket
  - Instant Sale SR34 = Sum of all scanned ticket totals

## 4. Store Management

### 4.1 Store Operations
- **Store Information**
  - Store ID
  - Store name
  - Store selection
  - Store-specific reports

- **Store Selection**
  - Persistent store selection
  - Store switching
  - Store-specific data loading
  - Each report is associated with a specific store
  - Store selection is preserved across sessions
  - Store data is loaded when the application starts
  - Store changes trigger a complete data refresh for the selected date

### 4.2 Store Manager
- **Store Management Interface**
  - Add new stores
  - Edit store details
  - Delete stores
  - View store information
  - Store manager modal is accessible from the main interface
  - Store changes are saved immediately when the modal is closed

## 5. Data Management

### 5.1 Report Data
- **Loading Data**
  - Date-specific loading
  - Store-specific loading
  - Automatic data refresh
  - Default value initialization
  - If a report doesn't exist for a date, a new one is created
  - Data loading is triggered by date or store changes
  - Loading indicators are displayed during data fetching
  - Error handling for failed data loading

- **Saving Data**
  - Report creation
  - Report updates
  - Invoice saving
  - Payroll saving
  - Lottery data saving
  - All data is saved together when the report is submitted
  - Save operation is atomic (all data is saved or none)
  - Confirmation is displayed after successful save
  - Error handling for failed save operations

### 5.2 Data Validation
- **Input Validation**
  - Required fields
  - Number formats
  - Date formats
  - Ticket number formats
  - Book number formats
  - Validation happens in real-time as users type
  - Visual indicators for invalid fields
  - Error messages for validation failures

- **Business Rules**
  - Sequential ticket validation
  - Duplicate scan prevention
  - Book activation requirements
  - Game number validation
  - Payment method validation
  - Salary unit validation
  - Business rules are enforced on both client and server
  - Violations are reported with clear error messages

## 6. User Interface

### 6.1 Report Interface
- **Business Report Tab**
  - Financial inputs
  - Invoice management
  - Payroll management
  - Lottery management
  - Total calculations
  - Calculated fields are visually distinct (gray background)
  - Tab navigation preserves data across tabs
  - Responsive design for different screen sizes

### 6.2 Modal Interfaces
- **Invoice Modal**
  - Invoice entry
  - Invoice editing
  - Invoice type selection
  - Payment method selection
  - Check number entry (if applicable)
  - Modal preserves data when switching between invoice types
  - Form validation before submission

- **Payroll Modal**
  - Payroll entry
  - Payroll editing
  - Employee information
  - Salary unit selection
  - Hours entry (for hourly employees)
  - Payment method selection
  - Check number entry (if applicable)
  - Automatic total calculation
  - Form validation before submission

- **Lottery Master Modal**
  - Game management
  - Game details
  - Game creation
  - Game editing
  - Data is loaded when the modal is opened
  - Changes are saved when the modal is closed

- **Ticket Scan Error Modal**
  - Error display
  - Error details
  - Error resolution
  - Options to retry scanning or enter manually
  - Error history tracking

- **Barcode Scanner Modal**
  - Camera access for scanning
  - Manual entry option
  - Real-time validation
  - Error handling
  - Scanner settings configuration
  - Support for multiple scanner types

### 6.3 Field Behavior
- **Editable Fields**
  - Net sales, taxes, refunds, etc.
  - Invoice details
  - Payroll details
  - Lottery sales data
  - Register cash
  - Fields are enabled/disabled based on context
  - Required fields are marked with asterisks
  - Field validation provides immediate feedback

- **Read-only Fields (Calculated)**
  - Total Income
  - Total Deductions
  - Cash to Account
  - Over/Short
  - Total Online Balance
  - Lottery Over/Short
  - Payroll totals (for hourly employees)
  - Invoice totals
  - Calculated fields update in real-time
  - Visual distinction for calculated fields

### 6.4 Navigation and Controls
- **Date Selection**
  - Date picker for selecting report date
  - Date changes trigger data loading
  - Date format validation
  - Date range restrictions (no future dates)

- **Store Selection**
  - Dropdown for selecting store
  - Store changes trigger data loading
  - Store selection is preserved across sessions

- **Action Buttons**
  - Save Report: Saves all data to the database
  - Clear Form: Resets all fields to default values
  - Print Report: Generates a printable version
  - Export Data: Exports report data in various formats
  - Buttons are enabled/disabled based on context
  - Confirmation dialogs for destructive actions

## 7. Error Handling

### 7.1 Client-Side Errors
- **Form Validation Errors**
  - Required field validation
  - Format validation
  - Business rule validation
  - Visual indicators for errors
  - Error messages displayed near fields

- **Network Errors**
  - Connection failure handling
  - Retry mechanisms
  - Offline mode support
  - Error messages for network issues

- **Scanner Errors**
  - Camera access errors
  - Invalid scan format
  - Duplicate scan detection
  - Error recovery options

### 7.2 Server-Side Errors
- **Database Errors**
  - Connection errors
  - Constraint violations
  - Transaction failures
  - Error logging and reporting

- **Business Logic Errors**
  - Invalid data combinations
  - Rule violations
  - State transition errors
  - Detailed error messages

## 8. Security

### 8.1 Authentication
- **User Authentication**
  - Login required for access
  - Session management
  - Token-based authentication
  - Secure password storage

- **Authorization**
  - Role-based access control
  - Permission checking
  - Feature access restrictions
  - Audit logging

### 8.2 Data Security
- **Data Protection**
  - HTTPS for all communications
  - Input sanitization
  - SQL injection prevention
  - XSS prevention

- **Sensitive Data**
  - Encryption for sensitive fields
  - Masking for display
  - Access logging
  - Data retention policies 