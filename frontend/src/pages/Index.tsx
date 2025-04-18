import React, { useState } from 'react';
import {
  TabNavigation,
  BusinessReport,
  PurchaseExpense,
  PayrollSection,
  DailyLotteryReport,
  LotteryActivatedBooks,
  LotteryTicketScan
} from '@/components';
import { Button } from "@/components/ui/button";
import { Save, RefreshCw } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useReport } from '@/context/ReportContext';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("business");
  const { clearAllData } = useReport();

  const tabs = [
    { id: "business", label: "Business Report" },
    { id: "gas", label: "Gas Report" }
  ];

  const handleSaveReport = () => {
    toast({
      title: "Report Saved",
      description: "All report data has been saved successfully",
    });
  };

  const handleClearReport = () => {
    clearAllData();
    toast({
      title: "Report Cleared",
      description: "All report data has been cleared",
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">     
      <div className="container mx-auto px-4 py-4">
        {/* Action buttons at the top */}
        <div className="flex justify-end mb-6">
          <div className="flex gap-2">
            <Button 
              onClick={handleSaveReport}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Save className="h-5 w-5 mr-2" /> Save Report
            </Button>
            <Button 
              onClick={handleClearReport}
              variant="outline"
              size="lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" /> Clear
            </Button>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="mb-6">
          <TabNavigation 
            tabs={tabs} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BusinessReport />
          
          <div className="space-y-4">
            <PurchaseExpense />
            <PayrollSection />
          </div>
        </div>

        <DailyLotteryReport />
        <LotteryActivatedBooks />
        <LotteryTicketScan />
      </div>
    </div>
  );
};

export default Index;
