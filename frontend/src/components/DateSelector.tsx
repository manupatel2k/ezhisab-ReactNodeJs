import React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateSelectorProps {
  className?: string;
  showLabel?: boolean;
  value?: Date;
  onChange?: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ 
  className, 
  showLabel = true,
  value = new Date(),
  onChange
}) => {
  const handleSelect = (newDate: Date | undefined) => {
    if (newDate && onChange) {
      onChange(newDate);
    }
  };

  return (
    <div className={cn("flex items-center", className)}>
      {showLabel && <span className="mr-2 text-sm font-medium text-foreground">Report Date:</span>}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={cn(
              "w-[200px] justify-start text-left font-normal",
              "bg-background border-border"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleSelect}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateSelector;
