import React, { useState } from 'react';
import { 
  Dialog,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { DateSelector } from '@/components';
import LotteryGameDialog from "@/components/dialogs/LotteryGameDialog";
import InventoryDialog from "@/components/dialogs/InventoryDialog";
import { useReport } from '@/context/ReportContext';

interface BusinessReportItem {
  label: string;
  value: number;
  isCalculated?: boolean;
}

const BusinessReport: React.FC = () => {
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const { reportItems, updateReportItem, calculateTotals } = useReport();

  const handleValueChange = (index: number, value: number) => {
    updateReportItem(index, value);
    calculateTotals();
  };

  return (
    <div className="bg-card p-6 rounded-md shadow border border-border">
      <div className="space-y-2">
        {reportItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-foreground font-medium">{item.label}</span>
            <input
              type="text"
              value={item.value}
              onChange={(e) => {
                if (!item.isCalculated) {
                  handleValueChange(index, Number(e.target.value) || 0);
                }
              }}
              disabled={item.isCalculated}
              className={`border border-input rounded-md px-3 py-1 w-32 text-right bg-background text-foreground 
                ${item.isCalculated ? 'bg-muted cursor-not-allowed' : ''} 
                ${index % 2 === 1 ? '' : 'bg-muted/30'}`}
            />
          </div>
        ))}
      </div>

      {/* Dialogs for Lottery management */}
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <LotteryGameDialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen} />
      </Dialog>
      
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <InventoryDialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen} />
      </Dialog>
    </div>
  );
};

export default BusinessReport;
