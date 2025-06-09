import React, { useState, useEffect } from 'react';
import { StoreHeader } from '@/components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { 
  UserPlus, 
  Users, 
  ShieldCheck, 
  Building, 
  Settings, 
  Trash, 
  PenTool,
  Plus,
  Edit,
  UserPlus as UserAssign,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Badge
} from "@/components/ui/badge";
import {
  Checkbox
} from "@/components/ui/checkbox";
import { useAuthContext } from '@/context/AuthContext';
import { userAPI, storeAPI } from '@/lib/api';

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
  storeId?: string; // Legacy field for backward compatibility
  userStores?: { 
    storeId: string;
    isPrimary?: boolean;
  }[];
  lastLoginAt?: string;
  createdAt?: string;
}

interface Store {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const userFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  role: z.string(),
  isActive: z.boolean().default(true),
  phoneNumber: z.string().optional(),
  storeId: z.string().optional(),
});

const storeFormSchema = z.object({
  name: z.string().min(2, { message: "Store name must be at least 2 characters" }),
  address: z.string().min(5, { message: "Address is required" }),
  city: z.string().min(1, { message: "City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  zipCode: z.string().min(1, { message: "ZIP code is required" }),
  phone: z.string().min(10, { message: "Valid phone number is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  isActive: z.boolean().default(true)
});

type StoreFormValues = z.infer<typeof storeFormSchema>;

const AdminPage = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState("users");
  
  const [isStoreDialogOpen, setIsStoreDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  
  // Enhanced user assignment dialog
  const [multipleUserAssignmentDialogOpen, setMultipleUserAssignmentDialogOpen] = useState(false);
  const [storeForMultipleAssignment, setStoreForMultipleAssignment] = useState<Store | null>(null);
  
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "employee",
      isActive: true,
      phoneNumber: "",
      storeId: "",
    },
  });
  
  const storeForm = useForm<StoreFormValues>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      isActive: true
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch users with their store assignments
      const usersResponse = await userAPI.getAll();
      const usersWithStores = usersResponse.data.map(user => ({
        ...user,
        userStores: user.userStores || []
      }));
      
      // Fetch stores
      const storesResponse = await storeAPI.getAll();
      
      setUsers(usersWithStores);
      setStores(storesResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Failed to fetch data');
      toast.error('Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof userFormSchema>) => {
    try {
      // Create the user first
      const response = await userAPI.create(data);
      
      // If a store is selected, assign it to the user
      if (data.storeId && data.storeId !== "none") {
        try {
          // Assign the store to the user
          await userAPI.assignStore(response.data.id, data.storeId);
          
          // Update the user in the local state with the store assignment
          const updatedUser = {
            ...response.data,
            userStores: [{ storeId: data.storeId }]
          };
          
          setUsers(prev => [...prev, updatedUser]);
          toast.success('User created and store assigned successfully');
        } catch (assignError: any) {
          console.error('Error assigning store:', assignError);
          // Still add the user to the list even if store assignment fails
          setUsers(prev => [...prev, response.data]);
          toast.warning('User created but store assignment failed');
        }
      } else {
        // No store selected, just add the user
        setUsers(prev => [...prev, response.data]);
        toast.success('User created successfully');
      }
      
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create user');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await userAPI.delete(userId);
      setUsers(prev => prev.filter(user => user.id !== userId));
      toast.success('User deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const updateUser = async (userId: string, data: any) => {
    try {
      const response = await userAPI.update(userId, data);
      setUsers(prev => prev.map(user => 
        user.id === userId ? response.data : user
      ));
      toast.success('User updated successfully');
      return true;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
      return false;
    }
  };

  const assignStoreToUser = async (userId: string, storeId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      // Check if the user is currently assigned to this store
      const isCurrentlyAssigned = user.userStores?.some(us => us.storeId === storeId) || 
                                 (user.storeId && user.storeId !== "none" && user.storeId === storeId);
      
      if (isCurrentlyAssigned) {
        // Remove store assignment
        await userAPI.assignStore(userId, null, storeId);
        toast.success("Store assignment removed");
        
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === userId) {
              // Remove the store from userStores array
              const updatedUserStores = u.userStores?.filter(us => us.storeId !== storeId) || [];
              return {
                ...u,
                userStores: updatedUserStores,
                // Also clear the legacy storeId if it matches
                storeId: u.storeId === storeId ? null : u.storeId
              };
            }
            return u;
          })
        );
      } else {
        // Add store assignment
        await userAPI.assignStore(userId, storeId);
        toast.success("Store assigned successfully");
        
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(u => {
            if (u.id === userId) {
              // Create a new userStores array if it doesn't exist
              const userStores = u.userStores || [];
              
              // Check if the store is already in the array
              const storeExists = userStores.some(us => us.storeId === storeId);
              
              if (!storeExists) {
                // Add the new store to the userStores array
                return {
                  ...u,
                  userStores: [...userStores, { storeId }]
                };
              }
            }
            return u;
          })
        );
      }
      
      // Refresh data to ensure UI is in sync with backend
      await fetchData();
    } catch (error: any) {
      console.error('Error toggling user store assignment:', error);
      toast.error(error.response?.data?.message || 'Failed to update user assignment. Please try again.');
    }
  };

  // Store management functions
  const openAddStoreDialog = () => {
    storeForm.reset({
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: "",
      isActive: true
    });
    setCurrentStore(null);
    setIsStoreDialogOpen(true);
  };

  const openEditStoreDialog = (store: Store) => {
    storeForm.reset({
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zipCode: store.zipCode,
      phone: store.phone,
      email: store.email,
      isActive: store.isActive
    });
    setCurrentStore(store);
    setIsStoreDialogOpen(true);
  };

  const onStoreSubmit = async (data: StoreFormValues) => {
    try {
      if (currentStore) {
        // Update existing store
        await storeAPI.update(currentStore.id, data);
        
        // Preserve the store ID and any other properties that might be lost
        const updatedStore = {
          ...currentStore,
          ...data
        };
        
        setStores(stores.map(store => 
          store.id === currentStore.id 
          ? updatedStore
          : store
        ));
        
        toast.success(`Store "${data.name}" updated successfully`);
      } else {
        // Create new store
        const newStore = await storeAPI.create(data);
        setStores([...stores, newStore]);
        toast.success(`Store "${data.name}" created successfully`);
      }
      
      setIsStoreDialogOpen(false);
      // Don't reset the current tab
    } catch (error) {
      console.error('Error saving store:', error);
      toast.error('Failed to save store');
    }
  };

  const deleteStore = async (id: string) => {
    try {
      await storeAPI.delete(id);
      setStores(stores.filter(store => store.id !== id));
      toast.success("Store deleted successfully");
    } catch (error: any) {
      console.error('Error deleting store:', error);
      toast.error(error.response?.data?.message || 'Failed to delete store. Please try again.');
    }
  };

  const openAssignStoreDialog = (storeId: string) => {
    setSelectedStoreId(storeId);
    setIsAssignDialogOpen(true);
  };

  // New function to manage multiple users for a store
  const openMultipleUserAssignmentDialog = (store: Store) => {
    if (!isAdmin) {
      toast.error("Only Admin users can assign multiple users to stores");
      return;
    }
    
    setStoreForMultipleAssignment(store);
    setMultipleUserAssignmentDialogOpen(true);
  };

  // Check if a user is assigned to a specific store
  const isUserAssignedToStore = (userId: string, storeId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return false;
    
    // Check if the user has this storeId in their userStores array
    return user.userStores?.some(us => us.storeId === storeId) || 
           (user.storeId && user.storeId !== "none" && user.storeId === storeId);
  };

  const getAssignedUsers = (storeId: string) => {
    // Find users assigned to this store
    const assignedUsers = users.filter(user => {
      // Check if the user has this storeId in their userStores array
      return user.userStores?.some(us => us.storeId === storeId) || 
             (user.storeId && user.storeId !== "none" && user.storeId === storeId);
    });
    
    if (assignedUsers.length === 0) {
      return "No users assigned";
    }
    
    return assignedUsers.map(user => `${user.firstName} ${user.lastName}`).join(", ");
  };

  // Add a function to open the edit user dialog
  const openEditUserDialog = (user: UserData) => {
    form.reset({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "", // Don't pre-fill password for security
      role: user.role,
      isActive: user.isActive,
      phoneNumber: user.phoneNumber || "",
      storeId: user.storeId || ""
    });
    setSelectedUserId(user.id);
    setIsUserDialogOpen(true);
  };

  // Add state for user dialog
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100">
        <StoreHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-600">You do not have permission to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      
      <div className="container mx-auto px-4 py-4">
        <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users Management
              </TabsTrigger>
              <TabsTrigger value="stores">
                <Building className="h-4 w-4 mr-2" />
                Manage Stores
              </TabsTrigger>
              <TabsTrigger value="store-settings">
                <Building className="h-4 w-4 mr-2" />
                Store Settings
              </TabsTrigger>
              <TabsTrigger value="system">
                <Settings className="h-4 w-4 mr-2" />
                System Configuration
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <div className="flex items-center">
                          <UserPlus className="h-5 w-5 mr-2" />
                          Add New User
                        </div>
                      </CardTitle>
                      <CardDescription>Create a new user account with specific permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Smith" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="john@example.com" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="manager">Manager</SelectItem>
                                    <SelectItem value="employee">Employee</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="storeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assigned Store</FormLabel>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select store (optional)" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {stores.map(store => (
                                      <SelectItem key={store.id} value={store.id}>
                                        {store.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Active Status</FormLabel>
                                  <p className="text-sm text-muted-foreground">
                                    User will be able to log in if active
                                  </p>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create User'
                            )}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        <div className="flex items-center">
                          <ShieldCheck className="h-5 w-5 mr-2" />
                          User Accounts
                        </div>
                      </CardTitle>
                      <CardDescription>Manage existing user accounts and permissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Name</th>
                              <th className="text-left py-2">Email</th>
                              <th className="text-left py-2">Role</th>
                              <th className="text-left py-2">Status</th>
                              <th className="text-left py-2">Assigned Store</th>
                              <th className="text-left py-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {users.map((user) => (
                              <tr key={user.id} className="border-b">
                                <td className="py-2">{user.firstName} {user.lastName}</td>
                                <td className="py-2">{user.email}</td>
                                <td className="py-2">{user.role}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    user.isActive 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td className="py-2">
                                  {user.userStores && user.userStores.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                      {user.userStores.map((userStore, index) => {
                                        const store = stores.find(s => s.id === userStore.storeId);
                                        return store ? (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {store.name}
                                          </Badge>
                                        ) : null;
                                      })}
                                    </div>
                                  ) : user.storeId && user.storeId !== "none" ? (
                                    <Badge variant="secondary" className="text-xs">
                                      {stores.find(s => s.id === user.storeId)?.name || user.storeId}
                                    </Badge>
                                  ) : (
                                    <span className="text-xs text-gray-500">No store assigned</span>
                                  )}
                                </td>
                                <td className="py-2">
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => openEditUserDialog(user)}
                                    >
                                      <PenTool className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => deleteUser(user.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                            {users.length === 0 && (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-gray-500">
                                  No users found. Add a new user to get started.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="stores" className="space-y-4">
              <div className="bg-white rounded-md shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Manage Stores</h2>
                  <Button onClick={openAddStoreDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Store
                  </Button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Users</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {stores.map((store) => (
                        <tr key={store.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">{store.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{store.address}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{`${store.city}, ${store.state} ${store.zipCode}`}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{store.phone}</td>
                          <td className="px-6 py-4 whitespace-nowrap">{store.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              store.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {store.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getAssignedUsers(store.id) || "No users assigned"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {isAdmin && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openMultipleUserAssignmentDialog(store)}
                                title="Assign multiple users"
                              >
                                <UserAssign className="h-4 w-4 text-blue-500" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => openEditStoreDialog(store)}>
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
            </TabsContent>
            
            <TabsContent value="store-settings">
              <Card>
                <CardHeader>
                  <CardTitle>Store Settings</CardTitle>
                  <CardDescription>Configure your store's basic information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Store Name</label>
                      <Input defaultValue="My Convenience Store" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Store ID/Number</label>
                      <Input defaultValue="ST-12345" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Address</label>
                      <Input defaultValue="123 Main St" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">City, State, ZIP</label>
                      <Input defaultValue="Anytown, ST 12345" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone</label>
                      <Input defaultValue="(555) 123-4567" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email</label>
                      <Input defaultValue="store@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tax Rate (%)</label>
                      <Input defaultValue="8.25" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Business Hours</label>
                      <Input defaultValue="24/7" />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button>Save Store Settings</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>Advanced settings for your store management system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Security Settings</h3>
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
                          <div className="font-medium">Two-Factor Authentication</div>
                          <p className="text-sm text-muted-foreground">
                            Require 2FA for admin accounts
                          </p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
                          <div className="font-medium">Session Timeout</div>
                          <p className="text-sm text-muted-foreground">
                            Auto-logout after 30 minutes of inactivity
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Data Management</h3>
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
                          <div className="font-medium">Auto Backup</div>
                          <p className="text-sm text-muted-foreground">
                            Automatically backup data daily
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
                          <div className="font-medium">Data Retention</div>
                          <p className="text-sm text-muted-foreground">
                            Keep transaction history for 2 years
                          </p>
                        </div>
                        <div>
                          <select className="border border-gray-300 rounded-md px-2 py-1">
                            <option>6 months</option>
                            <option>1 year</option>
                            <option selected>2 years</option>
                            <option>5 years</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-medium">Notifications</h3>
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
                          <div className="font-medium">Email Alerts</div>
                          <p className="text-sm text-muted-foreground">
                            Send email for important alerts
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div>
                          <div className="font-medium">Low Stock Alerts</div>
                          <p className="text-sm text-muted-foreground">
                            Alert when inventory is below threshold
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                    
                    <div className="pt-4">
                      <Button>Save Configuration</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
      
      {/* Store Management Dialogs */}
      <Dialog open={isStoreDialogOpen} onOpenChange={setIsStoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
            <DialogDescription>
              {currentStore ? 'Update the store information below.' : 'Enter the details for your new store.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...storeForm}>
            <form onSubmit={storeForm.handleSubmit(onStoreSubmit)} className="space-y-4">
              <FormField
                control={storeForm.control}
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
                control={storeForm.control}
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
              
              <FormField
                control={storeForm.control}
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
                control={storeForm.control}
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
              
              <FormField
                control={storeForm.control}
                name="zipCode"
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
                control={storeForm.control}
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
              
              <FormField
                control={storeForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter email address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {currentStore ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    currentStore ? 'Update Store' : 'Add Store'
                  )}
                </Button>
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
                      {user.firstName} {user.lastName} - {user.email}
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
              onClick={() => assignStoreToUser(selectedUserId, selectedStoreId)}
              disabled={!selectedUserId}
            >
              Assign Store
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New dialog for multiple user assignments */}
      <Dialog open={multipleUserAssignmentDialogOpen} onOpenChange={setMultipleUserAssignmentDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Users for {storeForMultipleAssignment?.name}</DialogTitle>
            <DialogDescription>
              Select which users should have access to this store.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 max-h-60 overflow-y-auto">
            {users.length > 0 ? (
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center space-x-2 p-2 border rounded-md">
                    <Checkbox 
                      id={`user-${user.id}`}
                      checked={storeForMultipleAssignment ? isUserAssignedToStore(user.id, storeForMultipleAssignment.id) : false}
                      onCheckedChange={() => storeForMultipleAssignment && assignStoreToUser(user.id, storeForMultipleAssignment.id)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {user.firstName} {user.lastName}
                        <span className="ml-1 text-xs text-muted-foreground">({user.email})</span>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Role: {user.role}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No users available to assign
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Done</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUserId ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUserId ? 'Update user information below.' : 'Enter the details for the new user.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter first name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter last name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter email address" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{selectedUserId ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder={selectedUserId ? 'Enter new password' : 'Enter password'} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active Status</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        User will be able to log in if active
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {selectedUserId ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    selectedUserId ? 'Update User' : 'Add User'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
