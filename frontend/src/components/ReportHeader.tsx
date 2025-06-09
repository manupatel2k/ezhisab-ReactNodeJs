import React from 'react';
import { Save, RefreshCw, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DateSelector from '@/components/DateSelector';
import StoreSelector from '@/components/StoreSelector';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface ReportHeaderProps {
  onSave: () => void;
  onClear: () => void;
  isSaving: boolean;
  reportDate: Date;
  onDateChange: (date: Date) => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({
  onSave,
  onClear,
  isSaving,
  reportDate,
  onDateChange
}) => {
  return (
    <Card className="mb-6 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Store:</span>
              <StoreSelector />
            </div>
            
            <Separator orientation="vertical" className="h-6 hidden md:block" />
            
            <DateSelector 
              value={reportDate}
              onChange={onDateChange}
            />
          </div>
          
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <Button 
              onClick={onSave}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" /> Save Report
                </>
              )}
            </Button>
            <Button 
              onClick={onClear}
              variant="outline"
              disabled={isSaving}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportHeader; 