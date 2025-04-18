import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Save, RefreshCw } from 'lucide-react';

interface LotteryReportItem {
  label: string;
  value: number;
  isCalculated?: boolean;
}

const DailyLotteryReport: React.FC = () => {
  const [todayInvoice, setTodayInvoice] = useState<LotteryReportItem[]>([
    { label: "Online Net Sales", value: 0 },
    { label: "Online Cashing", value: 0 },
    { label: "Instant Cashing", value: 0 },
    { label: "Instant Sale SR34", value: 0 },
  ]);

  const [yesterdayInvoice, setYesterdayInvoice] = useState<LotteryReportItem[]>([
    { label: "Online Net Sales", value: 0 },
    { label: "Online Cashing", value: 0 },
    { label: "Instant Cashing", value: 0 },
    { label: "Previous Day Online Net Sales", value: 0 },
    { label: "Previous Day Online Cashing", value: 0 },
    { label: "Previous Day Instant Cashing", value: 0 },
  ]);

  const [todayCash, setTodayCash] = useState<LotteryReportItem[]>([
    { label: "Total Online Balance", value: 0, isCalculated: true },
    { label: "Credit Sales", value: 0 },
    { label: "Debit Sales", value: 0 },
    { label: "Register Cash", value: 0 },
    { label: "Over/Short", value: 0, isCalculated: true },
  ]);

  const calculateTotals = useCallback(() => {
    // Calculate Online Sales Difference
    const onlineSalesDiff = todayInvoice[0].value - yesterdayInvoice[0].value;
    
    // Calculate Online Cashing Difference
    const onlineCashingDiff = todayInvoice[1].value - yesterdayInvoice[1].value;
    
    // Calculate Instant Cashing Difference
    const instantCashingDiff = todayInvoice[2].value - yesterdayInvoice[2].value;
    
    // Calculate Total Online Balance
    const totalOnlineBalance = onlineSalesDiff - onlineCashingDiff - instantCashingDiff + todayInvoice[3].value;
    
    // Calculate Over/Short
    const overShort = todayCash[3].value - totalOnlineBalance;
    
    // Update calculated fields
    setTodayCash(prevCash => {
      const newCash = [...prevCash];
      newCash[0].value = totalOnlineBalance;
      newCash[4].value = overShort;
      return newCash;
    });
  }, [todayInvoice, yesterdayInvoice, todayCash[3].value]);

  // Calculate totals whenever relevant data changes
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleValueChange = (section: string, index: number, value: number) => {
    if (section === 'todayInvoice') {
      setTodayInvoice(prev => {
        const newItems = [...prev];
        newItems[index].value = value;
        return newItems;
      });
    } else if (section === 'yesterdayInvoice') {
      setYesterdayInvoice(prev => {
        const newItems = [...prev];
        newItems[index].value = value;
        return newItems;
      });
    } else if (section === 'todayCash') {
      setTodayCash(prev => {
        const newItems = [...prev];
        newItems[index].value = value;
        return newItems;
      });
    }
  };

  const handleSaveReport = () => {
    toast({
      title: "Report Saved",
      description: "Lottery report has been saved successfully",
    });
  };

  const handleClearReport = () => {
    // Reset all data to zero
    setTodayInvoice(prev => prev.map(item => ({ ...item, value: 0 })));
    setYesterdayInvoice(prev => prev.map(item => ({ ...item, value: 0 })));
    setTodayCash(prev => prev.map(item => ({ ...item, value: 0 })));
    
    toast({
      title: "Report Cleared",
      description: "Lottery report has been cleared",
    });
  };

  return (
    <div className="bg-card p-4 rounded-md shadow border border-border">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Daily Lottery Report</h2>
        <div className="flex gap-2">
          <Button 
            onClick={handleSaveReport}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            size="sm"
          >
            <Save className="h-4 w-4 mr-1" /> Save Report
          </Button>
          <Button 
            onClick={handleClearReport}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="font-medium mb-3">Today Invoice</h3>
          <div className="space-y-2">
            {todayInvoice.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-foreground">{item.label}</span>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    if (!item.isCalculated) {
                      handleValueChange('todayInvoice', index, Number(e.target.value) || 0);
                    }
                  }}
                  disabled={item.isCalculated}
                  className={`border border-input rounded-md px-3 py-1 w-24 text-right bg-background text-foreground 
                    ${item.isCalculated ? 'bg-muted cursor-not-allowed' : ''} 
                    ${index % 2 === 1 ? '' : 'bg-muted/30'}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Yesterday Invoice</h3>
          <div className="space-y-2">
            {yesterdayInvoice.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-foreground">{item.label}</span>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    if (!item.isCalculated) {
                      handleValueChange('yesterdayInvoice', index, Number(e.target.value) || 0);
                    }
                  }}
                  disabled={item.isCalculated}
                  className={`border border-input rounded-md px-3 py-1 w-24 text-right bg-background text-foreground 
                    ${item.isCalculated ? 'bg-muted cursor-not-allowed' : ''} 
                    ${index % 2 === 1 ? '' : 'bg-muted/30'}`}
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-3">Today Cash</h3>
          <div className="space-y-2">
            {todayCash.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-foreground">{item.label}</span>
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    if (!item.isCalculated) {
                      handleValueChange('todayCash', index, Number(e.target.value) || 0);
                    }
                  }}
                  disabled={item.isCalculated}
                  className={`border border-input rounded-md px-3 py-1 w-24 text-right bg-background text-foreground 
                    ${item.isCalculated ? 'bg-muted cursor-not-allowed' : ''} 
                    ${index % 2 === 1 ? '' : 'bg-muted/30'}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyLotteryReport;
