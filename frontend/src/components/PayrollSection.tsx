import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import PayrollDialog from './dialogs/PayrollDialog';
import { useReport } from '@/context/ReportContext';

const PayrollSection: React.FC = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const { payrollEntries, addPayrollEntry, deletePayrollEntry } = useReport();

  const handleDialogState = (isOpen: boolean) => {
    setOpenDialog(isOpen);
  };

  return (
    <div className="bg-card p-4 rounded-md shadow border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-foreground">Payroll</h2>
        <Button 
          onClick={() => handleDialogState(true)}
          variant="default"
        >
          Add Payroll
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-border">
              <th className="pb-2 text-muted-foreground">Employee Name</th>
              <th className="pb-2 text-muted-foreground">Period</th>
              <th className="pb-2 text-muted-foreground">Payment Method</th>
              <th className="pb-2 text-muted-foreground">Salary Unit</th>
              <th className="pb-2 text-muted-foreground">Hours</th>
              <th className="pb-2 text-muted-foreground">Rate</th>
              <th className="pb-2 text-muted-foreground">Amount</th>
              <th className="pb-2 text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {payrollEntries.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4 text-muted-foreground">
                  No payroll entries available
                </td>
              </tr>
            ) : (
              payrollEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border">
                  <td className="py-2">{entry.employeeName}</td>
                  <td className="py-2">{entry.startDate} - {entry.endDate}</td>
                  <td className="py-2">{entry.paymentMethod}</td>
                  <td className="py-2">{entry.salaryUnit}</td>
                  <td className="py-2">{entry.hours || '-'}</td>
                  <td className="py-2">{entry.rate ? `$${entry.rate.toFixed(2)}` : '-'}</td>
                  <td className="py-2">${entry.amount.toFixed(2)}</td>
                  <td className="py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deletePayrollEntry(entry.id)}
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

      {/* Payroll Dialog */}
      <PayrollDialog 
        open={openDialog} 
        onOpenChange={handleDialogState}
        onSave={addPayrollEntry}
      />
    </div>
  );
};

export default PayrollSection;
