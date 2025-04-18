import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import PurchaseInvoiceDialog from './dialogs/PurchaseInvoiceDialog';
import ExpenseInvoiceDialog from './dialogs/ExpenseInvoiceDialog';
import { useReport } from '@/context/ReportContext';

const PurchaseExpense: React.FC = () => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const { invoices, deleteInvoice } = useReport();

  const handleDialogState = (dialogName: string | null) => {
    setOpenDialog(dialogName);
  };

  return (
    <div className="bg-card p-4 rounded-md shadow border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-foreground">Purchase/Expense</h2>
        <div className="flex gap-2">
          <Button 
            onClick={() => handleDialogState('purchase')}
            variant="default"
          >
            Purchase Invoice
          </Button>
          <Button 
            onClick={() => handleDialogState('expense')}
            variant="default"
          >
            Expense Invoice
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="pb-2 text-muted-foreground">Type</th>
              <th className="pb-2 text-muted-foreground">Date</th>
              <th className="pb-2 text-muted-foreground">Invoice No</th>
              <th className="pb-2 text-muted-foreground">Vendor Name</th>
              <th className="pb-2 text-muted-foreground">Payment Method</th>
              <th className="pb-2 text-muted-foreground">Amount</th>
              <th className="pb-2 text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted-foreground">
                  No invoices available
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border">
                  <td className="py-2">{invoice.type}</td>
                  <td className="py-2">{invoice.date}</td>
                  <td className="py-2">{invoice.invoiceNumber}</td>
                  <td className="py-2">{invoice.vendorName}</td>
                  <td className="py-2">{invoice.paymentMethod}</td>
                  <td className="py-2">${invoice.amount.toFixed(2)}</td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteInvoice(invoice.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialogs */}
      {openDialog === 'purchase' && (
        <PurchaseInvoiceDialog 
          open={true} 
          onOpenChange={() => handleDialogState(null)}
        />
      )}
      {openDialog === 'expense' && (
        <ExpenseInvoiceDialog 
          open={true} 
          onOpenChange={() => handleDialogState(null)}
        />
      )}
    </div>
  );
};

export default PurchaseExpense;
