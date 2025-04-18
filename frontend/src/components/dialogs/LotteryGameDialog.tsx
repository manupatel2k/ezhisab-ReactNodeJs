
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { AlertCircle, Edit, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface LotteryGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Dummy data structure for a lottery game
interface LotteryGame {
  id: string;
  name: string;
  number: string;
  cost: number;
  ticketsPerBook: number;
}

const formSchema = z.object({
  name: z.string().min(1, { message: "Game name is required" }),
  number: z.string().min(1, { message: "Game number is required" }),
  cost: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "Cost must be greater than or equal to 0" })
  ),
  ticketsPerBook: z.preprocess(
    (val) => (val === '' ? 0 : Number(val)),
    z.number().min(0, { message: "Tickets per book must be greater than or equal to 0" })
  ),
});

type FormValues = z.infer<typeof formSchema>;

const LotteryGameDialog: React.FC<LotteryGameDialogProps> = ({ open, onOpenChange }) => {
  const [games, setGames] = useState<LotteryGame[]>([]);
  const [error, setError] = useState<string | null>("Failed to load games");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      number: '',
      cost: 0,
      ticketsPerBook: 0,
    },
  });

  const addGame = (data: FormValues) => {
    const newGame: LotteryGame = {
      id: `game-${Date.now()}`,
      name: data.name,
      number: data.number,
      cost: data.cost,
      ticketsPerBook: data.ticketsPerBook
    };
    
    setGames([...games, newGame]);
    form.reset();
    toast.success('Game added successfully!');
    // If we had an error showing, clear it since we've added a game
    if (error) setError(null);
  };

  const deleteGame = (id: string) => {
    setGames(games.filter(game => game.id !== id));
    toast.success('Game deleted successfully!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lottery Game Management</DialogTitle>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(addGame)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Game Number</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Ticket</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ticketsPerBook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tickets per Book</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value === '' ? '' : e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full md:w-auto">Add Game</Button>
          </form>
        </Form>

        <div className="mt-6 border-t pt-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Game Name</th>
                  <th className="text-left py-2">Game Number</th>
                  <th className="text-left py-2">Cost per Ticket</th>
                  <th className="text-left py-2">Tickets per Book</th>
                  <th className="text-left py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.length > 0 ? (
                  games.map((game) => (
                    <tr key={game.id} className="border-b">
                      <td className="py-2">{game.name}</td>
                      <td className="py-2">{game.number}</td>
                      <td className="py-2">${game.cost.toFixed(2)}</td>
                      <td className="py-2">{game.ticketsPerBook}</td>
                      <td className="py-2">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteGame(game.id)}>
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      No games available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LotteryGameDialog;
