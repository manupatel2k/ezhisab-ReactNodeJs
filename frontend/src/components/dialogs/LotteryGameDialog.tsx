import React, { useState, useEffect } from 'react';
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
import { AlertCircle, Edit, Trash, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { lotteryAPI } from '@/lib/api';
import { LotteryGame } from '@/types';

interface LotteryGameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      number: '',
      cost: 0,
      ticketsPerBook: 0,
    },
  });

  // Load games when dialog opens
  useEffect(() => {
    if (open) {
      loadGames();
    }
  }, [open]);

  const loadGames = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await lotteryAPI.getAllGames();
      setGames(response.data);
    } catch (err) {
      console.error('Failed to load games:', err);
      setError('Failed to load games. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (game: LotteryGame) => {
    setEditingId(game.id);
    form.reset({
      name: game.gameName,
      number: game.gameNumber,
      cost: game.price,
      ticketsPerBook: game.ticketsPerBook,
    });
    setError(null);
  };

  const handleDelete = async (id: string) => {
    try {
      // Call the API to delete the game
      await lotteryAPI.deleteGame(id);
      
      // Update local state
      setGames(games.filter(game => game.id !== id));
      toast.success('Game deleted successfully!');
    } catch (err) {
      console.error('Failed to delete game:', err);
      toast.error('Failed to delete game. Please try again.');
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Format data for API - using the exact field names expected by the API
      const gameData = {
        gameName: data.name,
        gameNumber: data.number,
        price: Number(data.cost), // API expects 'price' not 'gamePrice'
        ticketsPerBook: Number(data.ticketsPerBook), // API expects 'ticketsPerBook' not 'totalTickets'
        isActive: true
      };
      
      let response;
      
      if (editingId) {
        // Update existing game
        response = await lotteryAPI.updateGame(editingId, gameData);
        toast.success('Game updated successfully!');
      } else {
        // Save new game to database
        response = await lotteryAPI.createGame(gameData);
        toast.success('Game added successfully!');
      }
      
      // Force reload the entire games list to ensure we have the latest data
      await loadGames();
      
      // Reset form and editing state
      form.reset();
      setEditingId(null);
    } catch (err: unknown) {
      console.error('Failed to save game:', err);
      
      // Handle specific error cases
      if (err && typeof err === 'object' && 'response' in err) {
        const errorResponse = err as { response?: { status?: number } };
        if (errorResponse.response?.status === 409) {
          setError('A game with this number already exists.');
        } else if (errorResponse.response?.status === 403) {
          setError('You do not have permission to manage games.');
        } else {
          setError('Failed to save game. Please try again.');
        }
      } else {
        setError('Failed to save game. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                      <Input {...field} disabled={!!editingId} />
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

            <div className="flex justify-end space-x-2">
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                className="w-full md:w-auto"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...
                  </>
                ) : (
                  editingId ? 'Update Game' : 'Add Game'
                )}
              </Button>
            </div>
          </form>
        </Form>

        <div className="mt-6 border-t pt-4">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
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
                        <td className="py-2">{game.gameName || 'N/A'}</td>
                        <td className="py-2">{game.gameNumber || 'N/A'}</td>
                        <td className="py-2">${(game.price || 0).toFixed(2)}</td>
                        <td className="py-2">{game.ticketsPerBook || 0}</td>
                        <td className="py-2">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEdit(game)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(game.id)}
                            >
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
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LotteryGameDialog;
