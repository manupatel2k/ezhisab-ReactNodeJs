import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

// Types
export interface BusinessReportItem {
  label: string;
  value: number;
  isCalculated?: boolean;
}

export interface Invoice {
  id: string;
  type: 'purchase' | 'expense';
  date: string;
  invoiceNumber: string;
  vendorName: string;
  paymentMethod: 'cash' | 'check' | 'bank_card' | 'ach' | 'eft';
  amount: number;
}

export interface PayrollEntry {
  id: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  paymentMethod: 'cash' | 'check' | 'bank_card' | 'ach' | 'eft';
  checkNumber?: string;
  salaryUnit: 'hourly' | 'weekly' | 'bi_weekly' | 'monthly';
  hours?: number;
  rate?: number;
  amount: number;
}

// Context interface
interface ReportContextType {
  // Business Report
  reportItems: BusinessReportItem[];
  updateReportItem: (index: number, value: number) => void;
  calculateTotals: () => void;
  
  // Invoices
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  
  // Payroll
  payrollEntries: PayrollEntry[];
  addPayrollEntry: (entry: PayrollEntry) => void;
  deletePayrollEntry: (id: string) => void;
  
  // Actions
  clearAllData: () => void;
}

// Create context
const ReportContext = createContext<ReportContextType | undefined>(undefined);

// Provider component
export const ReportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Business Report state
  const [reportItems, setReportItems] = useState<BusinessReportItem[]>([
    { label: "Net Sales Register", value: 0 },
    { label: "Net Taxes", value: 0 },
    { label: "Meal Tax", value: 0 },
    { label: "Refund", value: 0 },
    { label: "Cheque", value: 0 },
    { label: "Credit Card", value: 0 },
    { label: "Register Cash", value: 0 },
    { label: "Over/Short", value: 0, isCalculated: true },
    { label: "Cash to Account", value: 0, isCalculated: true },
  ]);

  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Payroll state
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);

  // Calculate totals based on all data
  const calculateTotals = useCallback(() => {
    setReportItems(prevItems => {
      const newItems = [...prevItems];
      
      // Calculate Total Income
      const totalIncome = newItems[0].value + newItems[1].value + newItems[2].value;
      
      // Calculate Total Deductions
      const totalDeductions = newItems[3].value + newItems[4].value + newItems[5].value;
      
      // Calculate total invoices and payroll
      const totalInvoices = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const totalPayroll = payrollEntries.reduce((sum, entry) => sum + entry.amount, 0);
      
      // Calculate Cash to Account
      const cashToAccount = totalIncome - totalDeductions - totalInvoices - totalPayroll;
      newItems[8].value = cashToAccount;
      
      // Calculate Over/Short
      const overShort = newItems[6].value - cashToAccount;
      newItems[7].value = overShort;
      
      return newItems;
    });
  }, [invoices, payrollEntries]);

  // Update a report item
  const updateReportItem = useCallback((index: number, value: number) => {
    setReportItems(prevItems => {
      const newItems = [...prevItems];
      newItems[index].value = value;
      return newItems;
    });
  }, []);

  // Add an invoice
  const addInvoice = useCallback((invoice: Invoice) => {
    setInvoices(prevInvoices => [...prevInvoices, invoice]);
  }, []);

  // Delete an invoice
  const deleteInvoice = useCallback((id: string) => {
    setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== id));
  }, []);

  // Add a payroll entry
  const addPayrollEntry = useCallback((entry: PayrollEntry) => {
    setPayrollEntries(prevEntries => [...prevEntries, entry]);
  }, []);

  // Delete a payroll entry
  const deletePayrollEntry = useCallback((id: string) => {
    setPayrollEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
  }, []);

  // Clear all data
  const clearAllData = useCallback(() => {
    setReportItems(reportItems.map(item => ({ ...item, value: 0 })));
    setInvoices([]);
    setPayrollEntries([]);
  }, [reportItems]);

  // Calculate totals whenever relevant data changes
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  // Context value
  const value = {
    reportItems,
    updateReportItem,
    calculateTotals,
    invoices,
    addInvoice,
    deleteInvoice,
    payrollEntries,
    addPayrollEntry,
    deletePayrollEntry,
    clearAllData
  };

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
};

// Custom hook to use the context
export const useReport = () => {
  const context = useContext(ReportContext);
  if (context === undefined) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
};

export default ReportContext; 