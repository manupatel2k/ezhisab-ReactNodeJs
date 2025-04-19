import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, RefreshCw, AlertCircle, History } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { lotteryAPI, auditAPI } from '@/lib/api';
import DailyLotteryReport from '../DailyLotteryReport';
import LotteryTicketScan from '../LotteryTicketScan';
import LotteryActivatedBooks from '../LotteryActivatedBooks';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';

interface LotteryReportProps {
  date: string;
  storeId: string;
}

interface LotteryReportData {
  dailyReport: {
    todayInvoice: {
      onlineNetSales: number;
      onlineCashing: number;
      instantCashing: number;
      instantSaleSr34: number;
    };
    yesterdayInvoice: {
      onlineNetSales: number;
      onlineCashing: number;
      instantCashing: number;
    };
    todayCash: {
      totalOnlineBalance: number;
      creditSales: number;
      debitSales: number;
      registerCash: number;
      overShort: number;
    };
  };
  scannedTickets: Array<{
    id: string;
    price: string;
    gameName: string;
    gameNumber: string;
    bookNumber: string;
    status: string;
    activatedOn: string;
    overAllTickets: string;
    shiftStartedTicket: string;
    currentTicket: string;
    quantitySold: number;
    total: string;
  }>;
  activatedBooks: Array<{
    id: string;
    gameName: string;
    gameNumber: string;
    bookNumber: string;
    referenceNumber: string;
    status: string;
  }>;
}

interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

const LotteryReport: React.FC<LotteryReportProps> = ({ date, storeId }) => {
  const [activeTab, setActiveTab] = useState('daily');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [reportData, setReportData] = useState<LotteryReportData>({
    dailyReport: {
      todayInvoice: {
        onlineNetSales: 0,
        onlineCashing: 0,
        instantCashing: 0,
        instantSaleSr34: 0,
      },
      yesterdayInvoice: {
        onlineNetSales: 0,
        onlineCashing: 0,
        instantCashing: 0,
      },
      todayCash: {
        totalOnlineBalance: 0,
        creditSales: 0,
        debitSales: 0,
        registerCash: 0,
        overShort: 0,
      },
    },
    scannedTickets: [],
    activatedBooks: [],
  });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const { user } = useAuth();

  // Load report data when date or store changes
  useEffect(() => {
    const loadReportData = async () => {
      setIsLoading(true);
      setError(null);
      setApiError(null);
      
      try {
        // Load daily report data
        const dailyReportResponse = await lotteryAPI.getDailyReport(date, storeId);
        
        // Load scanned tickets
        const ticketsResponse = await lotteryAPI.getAllTickets(date, date);
        
        // Load activated books
        const booksResponse = await lotteryAPI.getBooks({ status: 'active' });
        
        setReportData({
          dailyReport: dailyReportResponse.data,
          scannedTickets: ticketsResponse.data,
          activatedBooks: booksResponse.data,
        });
      } catch (err: any) {
        console.error('Error loading report data:', err);
        
        // Handle specific API error cases
        if (err.response) {
          const status = err.response.status;
          const errorData = err.response.data;
          
          if (status === 404) {
            setError('No report data found for the selected date and store');
            setApiError({
              message: 'Report not found',
              code: 'REPORT_NOT_FOUND',
              details: errorData
            });
          } else if (status === 403) {
            setError('You do not have permission to access this report');
            setApiError({
              message: 'Permission denied',
              code: 'PERMISSION_DENIED',
              details: errorData
            });
          } else if (status === 500) {
            setError('Server error occurred while loading report data');
            setApiError({
              message: 'Server error',
              code: 'SERVER_ERROR',
              details: errorData
            });
          } else {
            setError('Failed to load report data');
            setApiError({
              message: errorData.message || 'Unknown error',
              code: errorData.code || 'UNKNOWN_ERROR',
              details: errorData
            });
          }
        } else if (err.request) {
          // Network error
          setError('Network error occurred. Please check your connection');
          setApiError({
            message: 'Network error',
            code: 'NETWORK_ERROR',
            details: err.message
          });
        } else {
          // Other errors
          setError('An unexpected error occurred');
          setApiError({
            message: err.message || 'Unexpected error',
            code: 'UNEXPECTED_ERROR',
            details: err
          });
        }
        
        toast({
          title: 'Error',
          description: error || 'Failed to load lottery report data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [date, storeId]);

  // Function to log data changes
  const logDataChange = async (
    entityType: string,
    actionType: string,
    oldValues: any,
    newValues: any,
    metadata?: any
  ) => {
    try {
      await auditAPI.create({
        userId: user?.id,
        entityType,
        entityId: `${storeId}-${date}`,
        actionTypeId: actionType,
        oldValues,
        newValues,
        metadata: {
          ...metadata,
          storeId,
          date,
          timestamp: new Date().toISOString(),
        }
      });
    } catch (err) {
      console.error('Failed to create audit log:', err);
    }
  };

  // Function to fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      const response = await auditAPI.getAll({
        entityType: 'lottery_report',
        entityId: `${storeId}-${date}`,
      });
      setAuditLogs(response.data);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  // Load audit logs when showing the audit log
  useEffect(() => {
    if (showAuditLog) {
      fetchAuditLogs();
    }
  }, [showAuditLog, storeId, date]);

  const handleSaveReport = async () => {
    setIsSaving(true);
    setApiError(null);
    
    try {
      // Log the save action
      await logDataChange(
        'lottery_report',
        'SAVE_REPORT',
        null,
        reportData,
        { action: 'save_report' }
      );
      
      await lotteryAPI.saveReport({
        date,
        storeId,
        data: reportData,
      });
      
      toast({
        title: 'Success',
        description: 'Lottery report saved successfully',
      });
    } catch (err: any) {
      console.error('Error saving report:', err);
      
      // Handle specific API error cases
      if (err.response) {
        const status = err.response.status;
        const errorData = err.response.data;
        
        if (status === 400) {
          setApiError({
            message: 'Invalid report data',
            code: 'INVALID_DATA',
            details: errorData
          });
          toast({
            title: 'Error',
            description: 'Invalid report data. Please check your inputs.',
            variant: 'destructive',
          });
        } else if (status === 403) {
          setApiError({
            message: 'Permission denied',
            code: 'PERMISSION_DENIED',
            details: errorData
          });
          toast({
            title: 'Error',
            description: 'You do not have permission to save this report',
            variant: 'destructive',
          });
        } else if (status === 409) {
          setApiError({
            message: 'Report already exists',
            code: 'REPORT_EXISTS',
            details: errorData
          });
          toast({
            title: 'Error',
            description: 'A report for this date already exists',
            variant: 'destructive',
          });
        } else {
          setApiError({
            message: errorData.message || 'Unknown error',
            code: errorData.code || 'UNKNOWN_ERROR',
            details: errorData
          });
          toast({
            title: 'Error',
            description: 'Failed to save lottery report',
            variant: 'destructive',
          });
        }
      } else {
        setApiError({
          message: err.message || 'Unexpected error',
          code: 'UNEXPECTED_ERROR',
          details: err
        });
        toast({
          title: 'Error',
          description: 'Failed to save lottery report',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearReport = () => {
    // Log the clear action
    logDataChange(
      'lottery_report',
      'CLEAR_REPORT',
      reportData,
      {
        dailyReport: {
          todayInvoice: {
            onlineNetSales: 0,
            onlineCashing: 0,
            instantCashing: 0,
            instantSaleSr34: 0,
          },
          yesterdayInvoice: {
            onlineNetSales: 0,
            onlineCashing: 0,
            instantCashing: 0,
          },
          todayCash: {
            totalOnlineBalance: 0,
            creditSales: 0,
            debitSales: 0,
            registerCash: 0,
            overShort: 0,
          },
        },
        scannedTickets: [],
        activatedBooks: [],
      },
      { action: 'clear_report' }
    );
    
    setReportData({
      dailyReport: {
        todayInvoice: {
          onlineNetSales: 0,
          onlineCashing: 0,
          instantCashing: 0,
          instantSaleSr34: 0,
        },
        yesterdayInvoice: {
          onlineNetSales: 0,
          onlineCashing: 0,
          instantCashing: 0,
        },
        todayCash: {
          totalOnlineBalance: 0,
          creditSales: 0,
          debitSales: 0,
          registerCash: 0,
          overShort: 0,
        },
      },
      scannedTickets: [],
      activatedBooks: [],
    });
    
    toast({
      title: 'Report Cleared',
      description: 'Lottery report has been cleared',
    });
  };

  // Handle data changes from child components with audit logging
  const handleDailyReportChange = (newData: any) => {
    logDataChange(
      'lottery_report',
      'UPDATE_DAILY_REPORT',
      reportData.dailyReport,
      newData,
      { action: 'update_daily_report' }
    );
    
    setReportData(prev => ({
      ...prev,
      dailyReport: newData,
    }));
  };

  const handleTicketsChange = (newTickets: any) => {
    logDataChange(
      'lottery_report',
      'UPDATE_TICKETS',
      reportData.scannedTickets,
      newTickets,
      { action: 'update_tickets' }
    );
    
    setReportData(prev => ({
      ...prev,
      scannedTickets: newTickets,
    }));
  };

  const handleBooksChange = (newBooks: any) => {
    logDataChange(
      'lottery_report',
      'UPDATE_BOOKS',
      reportData.activatedBooks,
      newBooks,
      { action: 'update_books' }
    );
    
    setReportData(prev => ({
      ...prev,
      activatedBooks: newBooks,
    }));
  };

  // Loading skeleton for the report content
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render audit log dialog
  const renderAuditLog = () => {
    if (!showAuditLog) return null;
    
    return (
      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Audit Log</CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowAuditLog(false)}
          >
            Close
          </Button>
        </CardHeader>
        <CardContent>
          {auditLogs.length === 0 ? (
            <p className="text-muted-foreground">No audit logs found</p>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log, index) => (
                <div key={index} className="border rounded-md p-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{log.actionTypeId}</span>
                    <span className="text-muted-foreground">
                      {new Date(log.metadata.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    User: {log.userId || 'Unknown'}
                  </div>
                  {log.metadata.action && (
                    <div className="text-xs text-muted-foreground">
                      Action: {log.metadata.action}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Lottery Report</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAuditLog(!showAuditLog)}
            variant="outline"
            className="mr-2"
          >
            <History className="h-4 w-4 mr-1" /> Audit Log
          </Button>
          <Button
            onClick={handleSaveReport}
            disabled={isLoading || isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-1" /> Save Report
              </>
            )}
          </Button>
          <Button
            variant="outline"
            disabled={isLoading || isSaving}
            onClick={handleClearReport}
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {apiError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {apiError.message}
            {apiError.code && (
              <span className="text-xs ml-2">(Error code: {apiError.code})</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="daily">Daily Report</TabsTrigger>
            <TabsTrigger value="tickets">Ticket Scanning</TabsTrigger>
            <TabsTrigger value="books">Activated Books</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card>
              <CardHeader>
                <CardTitle>Daily Lottery Report</CardTitle>
              </CardHeader>
              <CardContent>
                <DailyLotteryReport 
                  data={reportData.dailyReport}
                  onDataChange={handleDailyReportChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Scanning</CardTitle>
              </CardHeader>
              <CardContent>
                <LotteryTicketScan 
                  data={reportData.scannedTickets}
                  onTicketsChange={handleTicketsChange}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle>Activated Books</CardTitle>
              </CardHeader>
              <CardContent>
                <LotteryActivatedBooks 
                  data={reportData.activatedBooks}
                  onBooksChange={handleBooksChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
      
      {renderAuditLog()}
    </div>
  );
};

export default LotteryReport; 