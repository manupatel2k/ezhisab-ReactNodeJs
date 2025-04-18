
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StoreHeader } from '@/components';
import { Edit, Trash, Plus, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedStores: string[];
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Store name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(2, { message: "City is required" }),
  state: z.string().min(2, { message: "State is required" }),
  zip: z.string().min(5, { message: "Valid ZIP code is required" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
});

type FormValues = z.infer<typeof formSchema>;

const ManageStores = () => {
  const [stores, setStores] = useState<Store[]>([
    {
      id: '1',
      name: 'Main Branch',
      address: '123 Main St',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      phone: '(212) 555-1234'
    },
    {
      id: '2',
      name: 'Downtown Store',
      address: '456 Market Ave',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90012',
      phone: '(213) 555-5678'
    }
  ]);
  
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john@example.com',
      role: 'Manager',
      assignedStores: ['1']
    },
    {
      id: '2',
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'Cashier',
      assignedStores: ['2']
    }
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: ""
    }
  });

  const openAddDialog = () => {
    form.reset({
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: ""
    });
    setCurrentStore(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (store: Store) => {
    form.reset({
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zip: store.zip,
      phone: store.phone,
    });
    setCurrentStore(store);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: FormValues) => {
    if (currentStore) {
      // Update existing store
      setStores(stores.map(store => 
        store.id === currentStore.id 
        ? { ...store, ...data }
        : store
      ));
      toast.success(`Store "${data.name}" updated successfully`);
    } else {
      // Add new store - make sure all required fields are present
      const newStore: Store = {
        id: Date.now().toString(),
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zip: data.zip,
        phone: data.phone
      };
      setStores([...stores, newStore]);
      toast.success(`Store "${data.name}" added successfully`);
    }
    setIsDialogOpen(false);
  };

  const deleteStore = (id: string) => {
    setStores(stores.filter(store => store.id !== id));
    toast.success("Store deleted successfully");
  };

  const openAssignStoreDialog = (storeId: string) => {
    setSelectedStoreId(storeId);
    setIsAssignDialogOpen(true);
  };

  const assignStoreToUser = () => {
    if (selectedStoreId && selectedUserId) {
      setUsers(users.map(user => 
        user.id === selectedUserId
          ? { 
              ...user, 
              assignedStores: user.assignedStores.includes(selectedStoreId)
                ? user.assignedStores
                : [...user.assignedStores, selectedStoreId] 
            }
          : user
      ));
      
      const storeName = stores.find(store => store.id === selectedStoreId)?.name;
      const userName = users.find(user => user.id === selectedUserId)?.name;
      toast.success(`Store "${storeName}" assigned to ${userName}`);
      setIsAssignDialogOpen(false);
    }
  };

  const getAssignedUsers = (storeId: string) => {
    return users.filter(user => user.assignedStores.includes(storeId))
      .map(user => user.name)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <StoreHeader />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manage Stores</h1>
          <Button onClick={openAddDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Store
          </Button>
        </div>
        
        <div className="bg-white rounded-md shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ZIP</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Users</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{store.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{store.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{store.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{store.state}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{store.zip}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{store.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAssignedUsers(store.id) || "No users assigned"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button variant="ghost" size="sm" onClick={() => openAssignStoreDialog(store.id)}>
                      <UserPlus className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(store)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteStore(store.id)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No stores found. Add a new store to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
            <DialogDescription>
              {currentStore ? 'Update the store information below.' : 'Enter the details for your new store.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter store name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter street address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter city" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter state" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter ZIP code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter phone number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">{currentStore ? 'Update Store' : 'Add Store'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Store to User</DialogTitle>
            <DialogDescription>
              Select a user to assign to this store.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select User</label>
              <Select
                value={selectedUserId}
                onValueChange={setSelectedUserId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              type="button" 
              onClick={assignStoreToUser}
              disabled={!selectedUserId}
            >
              Assign Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageStores;
