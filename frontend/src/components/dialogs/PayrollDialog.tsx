import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useReport } from '@/context/ReportContext';
import { useStoreContext } from '@/context/StoreContext';
import { userAPI } from '@/lib/api';

interface PayrollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  employeeName: z.string().min(1, { message: "Employee name is required" }),
  amount: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "Amount must be greater than or equal to 0" })
  ),
  startDate: z.date(),
  endDate: z.date(),
  totalHours: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "Total hours must be greater than or equal to 0" })
  ),
  paymentMethod: z.string(),
  notes: z.string().optional(),
  salaryUnit: z.string()
});

type FormValues = z.infer<typeof formSchema>;

const PayrollDialog: React.FC<PayrollDialogProps> = ({ open, onOpenChange }) => {
  const { addPayrollEntry } = useReport();
  const { currentStore } = useStoreContext();
  const [employees, setEmployees] = React.useState<Array<{id: string, firstName: string, lastName: string}>>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = React.useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeName: '',
      amount: 0,
      startDate: new Date(),
      endDate: new Date(),
      totalHours: 0,
      paymentMethod: 'cash',
      notes: '',
      salaryUnit: 'hourly'
    },
  });

  const amount = form.watch("amount");
  const totalHours = form.watch("totalHours");
  const salaryUnit = form.watch("salaryUnit");
  const totalAmountRef = useRef<HTMLSpanElement>(null);

  // Fetch employees for the current store
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentStore) return;
      
      try {
        setIsLoadingEmployees(true);
        const response = await userAPI.getAll();
        // Filter users who are assigned to the current store
        const storeEmployees = response.data.filter((user: any) => 
          user.userStores?.some((us: any) => us.store.id === currentStore.id)
        );
        setEmployees(storeEmployees);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, [currentStore]);

  useEffect(() => {
    // Only update if the element exists and salary unit is hourly
    if (salaryUnit === 'hourly' && totalAmountRef.current) {
      const total = amount * totalHours;
      totalAmountRef.current.textContent = `$${total.toFixed(2)}`;
    }
  }, [amount, totalHours, salaryUnit]);

  const onSubmit = (data: FormValues) => {
    const payrollEntry = {
      id: crypto.randomUUID(),
      employeeName: data.employeeName,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      endDate: format(data.endDate, 'yyyy-MM-dd'),
      paymentMethod: data.paymentMethod as 'cash' | 'check' | 'bank_card' | 'ach' | 'eft',
      salaryUnit: data.salaryUnit as 'hourly' | 'weekly' | 'bi_weekly' | 'monthly',
      hours: data.totalHours,
      rate: data.amount,
      amount: data.salaryUnit === 'hourly' ? data.amount * data.totalHours : data.amount
    };

    addPayrollEntry(payrollEntry);
    toast.success('Payroll entry added successfully!');
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payroll Entry</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="employeeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee Name</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isLoadingEmployees || !currentStore}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingEmployees ? "Loading..." : "Select employee"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {employees.length === 0 ? (
                        <SelectItem value="no_employees">No employees found</SelectItem>
                      ) : (
                        employees.map((employee) => (
                          <SelectItem 
                            key={employee.id} 
                            value={`${employee.firstName} ${employee.lastName}`}
                          >
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salary Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="totalHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Hours</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.5" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                      <SelectItem value="bank_card">Bank Card</SelectItem>
                      <SelectItem value="ach">ACH</SelectItem>
                      <SelectItem value="eft">EFT</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">Total Amount: </span>
                <span ref={totalAmountRef} className="font-bold">
                  ${salaryUnit === 'hourly' ? (amount * totalHours).toFixed(2) : amount.toFixed(2)}
                </span>
              </div>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default PayrollDialog;
