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
import { useStoreContext } from '@/context/StoreContext';

interface BusinessReportItem {
  label: string;
  value: number;
  isCalculated?: boolean;
}

const BusinessReport: React.FC = () => {
  const [isGameDialogOpen, setIsGameDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const { reportItems, updateReportItem, calculateTotals } = useReport();
  const { currentStore } = useStoreContext();

  const handleValueChange = (index: number, value: number) => {
    updateReportItem(index, value);
    calculateTotals();
  };

  return (
    <div className="bg-card p-4 rounded-lg shadow border border-border">
      <h2 className="font-semibold mb-4 text-foreground">Business Report</h2>
      <div className="space-y-2">
        {reportItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-foreground">{item.label}</span>
            <input
              type="number"
              value={item.value}
              onChange={(e) => handleValueChange(index, Number(e.target.value))}
              disabled={item.isCalculated}
              className={`border border-input rounded-md px-3 py-1 w-32 bg-background text-foreground
                ${item.isCalculated ? 'opacity-70 cursor-not-allowed' : ''}`}
            />
          </div>
        ))}
      </div>

      {/* Dialogs for Lottery management */}
      <Dialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen}>
        <LotteryGameDialog open={isGameDialogOpen} onOpenChange={setIsGameDialogOpen} />
      </Dialog>
      
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <InventoryDialog 
          open={isInventoryDialogOpen} 
          onOpenChange={setIsInventoryDialogOpen} 
          storeId={currentStore?.id}
        />
      </Dialog>
    </div>
  );
};

export default BusinessReport;
