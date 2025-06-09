import React, { useState, useEffect } from 'react';
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
import { toast } from "sonner";
import { useReport } from '@/context/ReportContext';
import { format } from 'date-fns';
import { reportAPI, lotteryAPI } from '@/lib/api';
import { useStoreContext } from '@/context/StoreContext';
import ReportHeader from '@/components/ReportHeader';
import { ScannedTicket } from "@/types";

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("business");
  const { clearAllData, reportItems, invoices, payrollEntries } = useReport();
  const { currentStore } = useStoreContext();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportDate, setReportDate] = useState<Date>(new Date());
  const [dailyReportId, setDailyReportId] = useState<string | null>(null);
  const [tempDailyReportId, setTempDailyReportId] = useState<string | null>(null);
  const [scannedTickets, setScannedTickets] = useState<ScannedTicket[]>([]);

  const tabs = [
    { id: "business", label: "Business Report" },
    { id: "gas", label: "Gas Report" }
  ];

  useEffect(() => {
    const fetchOrCreateBusinessReport = async () => {
      if (!currentStore?.id) {
        setDailyReportId(null);
        setTempDailyReportId(null);
        return;
      }

      const tempId = crypto.randomUUID();
      setTempDailyReportId(tempId);

      setIsLoading(true);
      try {
        const formattedDate = format(reportDate, 'yyyy-MM-dd');

        const existingReportsResponse = await reportAPI.getByStore(currentStore.id, formattedDate, formattedDate);
        const existingReport = existingReportsResponse.data?.[0];

        if (existingReport) {
          setDailyReportId(existingReport.id);
        } else {
        }
      } catch (error) {
        console.error('Error fetching or creating business report:', error);
        toast.error('Failed to load or create daily report. Please try again.', {
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }
        });
        setDailyReportId(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrCreateBusinessReport();
    return () => {
      setDailyReportId(null);
      setTempDailyReportId(null);
    };
  }, [currentStore?.id, reportDate]);

  const handleSaveReport = async () => {
    if (!currentStore) {
      toast.error('Please select a store first', {
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      });
      return;
    }

    if (isLoading) {
      toast.error('Please wait while the report is being loaded...', {
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      });
      return;
    }

    if (!currentStore.id) {
      toast.error('Store not selected. Cannot save.', {
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      });
      return;
    }

    setIsSaving(true);

    try {
      let currentReportId = dailyReportId;

      if (!currentReportId) {
        setIsLoading(true);
        try {
          const formattedDate = format(reportDate, 'yyyy-MM-dd');
          
          // Calculate totals
          const totalIncome = reportItems.reduce((sum, item) => sum + item.value, 0);
          const totalDeductions = reportItems
            .filter(item => item.value < 0)
            .reduce((sum, item) => sum + Math.abs(item.value), 0);

          const initialBusinessReportData = {
            date: formattedDate,
            storeId: currentStore.id.toString(),
            reportItems: reportItems.map(item => ({
              label: item.name,
              value: item.value
            })),
            totalIncome,
            totalDeductions,
            netSalesRegister: reportItems[0].value,
            netTaxes: reportItems[1].value,
            mealTax: reportItems[2].value,
            refund: reportItems[3].value,
            cheque: reportItems[4].value,
            creditCard: reportItems[5].value,
            registerCash: reportItems[6].value,
            overShort: reportItems[7].value,
            cashToAccount: reportItems[8].value
          };

          const newReportResponse = await reportAPI.createOrUpdate(initialBusinessReportData);
          if (newReportResponse.data?.id) {
            currentReportId = newReportResponse.data.id;
            setDailyReportId(currentReportId);
          } else {
            throw new Error('Failed to create new business report during save');
          }
        } catch (error) {
          console.error('Error creating new report during save:', error);
          toast.error('Failed to create new report during save. Please try again.', {
            style: {
              background: 'white',
              color: 'black',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
          });
          setIsLoading(false);
          setIsSaving(false);
          return;
        } finally {
          setIsLoading(false);
        }
      }

      if (!currentReportId) {
        toast.error('Daily report ID is missing. Cannot save dependent data.', {
          style: {
            background: 'white',
            color: 'black',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }
        });
        setIsSaving(false);
        return;
      }

      const businessReportDataToSave = {
        id: currentReportId,
        date: format(reportDate, 'yyyy-MM-dd'),
        storeId: currentStore.id.toString(),
        reportItems: reportItems.map(item => ({
          label: item.name,
          value: item.value
        })),
        totalIncome: reportItems.reduce((sum, item) => sum + item.value, 0),
        totalDeductions: reportItems
          .filter(item => item.value < 0)
          .reduce((sum, item) => sum + Math.abs(item.value), 0),
        netSalesRegister: reportItems[0].value,
        netTaxes: reportItems[1].value,
        mealTax: reportItems[2].value,
        refund: reportItems[3].value,
        cheque: reportItems[4].value,
        creditCard: reportItems[5].value,
        registerCash: reportItems[6].value,
        overShort: reportItems[7].value,
        cashToAccount: reportItems[8].value
      };

      await reportAPI.createOrUpdate(businessReportDataToSave);

      const scannedTicketsToSave = scannedTickets.map(ticket => ({
        businessReportId: currentReportId,
        storeId: currentStore.id,
        gameId: parseInt(ticket.gameId, 10),
        bookNumber: ticket.bookNumber,
        ticketNumber: ticket.ticketNumber,
        gameName: ticket.gameName,
        gamePrice: ticket.price,
        status: ticket.status,
        activatedOn: ticket.activatedOn,
        shiftStartTicket: ticket.shiftStartTicket,
        currentTicket: ticket.currentTicket,
        quantitySold: ticket.quantitySold,
        total: ticket.total
      }));

      clearAllData();
      setScannedTickets([]);
      setReportDate(new Date());
      setDailyReportId(null);
      setTempDailyReportId(null);

      toast.success('Report saved successfully', {
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      });
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error('Failed to save report. Please try again.', {
        style: {
          background: 'white',
          color: 'black',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTicketScanned = (ticket: ScannedTicket) => {
    const ticketWithTempId = { ...ticket, tempDailyReportId: tempDailyReportId };
    setScannedTickets(prevTickets => [...prevTickets, ticketWithTempId]);
  };

  const handleClearReport = () => {
    clearAllData();
    setScannedTickets([]);
    setReportDate(new Date());
    toast.success('All report data has been cleared', {
      style: {
        background: 'white',
        color: 'black',
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    });
  };

  const handleDateChange = (date: Date) => {
    setReportDate(date);
  };

  return (
    <div className="min-h-screen bg-gray-100">     
      <div className="container mx-auto px-4 py-4">
        <ReportHeader 
          onSave={handleSaveReport}
          onClear={handleClearReport}
          isSaving={isSaving}
          reportDate={reportDate}
          onDateChange={handleDateChange}
        />
        
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

        <DailyLotteryReport className="mt-4" dailyReportId={dailyReportId} />
        <LotteryActivatedBooks />
        <LotteryTicketScan className="mt-4" onTicketScanned={handleTicketScanned} />
      </div>
    </div>
  );
};

export default Index;
