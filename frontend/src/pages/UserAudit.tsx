import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { StoreHeader } from '@/components';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Activity, Download, Filter, Search } from 'lucide-react';
import { auditAPI } from '../lib/api';
import { toast } from 'react-hot-toast';

interface AuditLog {
  id: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  actionTypeId: string | null;
  entityType: string;
  entityId: string | null;
  oldValues: any | null;
  newValues: any | null;
  metadata: any | null;
  actionType?: {
    name: string;
    description: string | null;
  } | null;
}

const UserAudit = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStore, setFilterStore] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('7days');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stores, setStores] = useState<string[]>([]);
  
  // Fetch audit logs from API
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setIsLoading(true);
        
        // Calculate date range
        let startDate: Date | undefined;
        const endDate = new Date();
        
        switch(dateRange) {
          case 'today':
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            break;
          case '7days':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case '30days':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            break;
          case 'all':
            startDate = undefined;
            break;
        }
        
        // Fetch audit logs
        const response = await auditAPI.getAll({
          startDate,
          endDate
        });
        
        if (response.data) {
          setAuditLogs(response.data);
          
          // Extract unique stores from logs
          const uniqueStores = new Set<string>();
          response.data.forEach((log: AuditLog) => {
            if (log.metadata) {
              try {
                const metadata = JSON.parse(log.metadata);
                if (metadata.store) {
                  uniqueStores.add(metadata.store);
                }
              } catch (e) {
                console.error('Error parsing metadata:', e);
              }
            }
          });
          setStores(Array.from(uniqueStores));
        } else {
          toast.error('Failed to fetch audit logs');
        }
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        toast.error('Failed to fetch audit logs');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAuditLogs();
  }, [dateRange]);
  
  // Filter logs based on search term and filters
  const filteredLogs = auditLogs.filter(log => {
    const userEmail = log.user?.email || 'System';
    const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System';
    const details = `${log.entityType} ${log.entityId ? `#${log.entityId}` : ''}`;
    
    const matchesSearch = 
      userEmail.toLowerCase().includes(searchTerm.toLowerCase()) || 
      userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Parse metadata to get store
    let store = 'System';
    if (log.metadata) {
      try {
        const metadata = JSON.parse(log.metadata);
        if (metadata.store) {
          store = metadata.store;
        }
      } catch (e) {
        console.error('Error parsing metadata:', e);
      }
    }
    
    const matchesStore = filterStore === 'all' || store === filterStore;
    
    // Map actionTypeId to action name
    let action = 'Other';
    switch(log.actionTypeId) {
      case '1': action = 'Create'; break;
      case '2': action = 'Update'; break;
      case '3': action = 'Delete'; break;
      case '4': action = 'Read'; break;
    }
    
    const matchesAction = filterAction === 'all' || action === filterAction;
    
    return matchesSearch && matchesStore && matchesAction;
  });

  const getActionBadgeClass = (actionTypeId: string | null) => {
    switch(actionTypeId) {
      case '1': // Create
        return 'bg-green-100 text-green-800';
      case '2': // Update
        return 'bg-blue-100 text-blue-800';
      case '3': // Delete
        return 'bg-red-100 text-red-800';
      case '4': // Read
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionName = (actionTypeId: string | null) => {
    switch(actionTypeId) {
      case '1': return 'Create';
      case '2': return 'Update';
      case '3': return 'Delete';
      case '4': return 'Read';
      default: return 'Other';
    }
  };

  const availableActions = ['Create', 'Update', 'Delete', 'Read', 'Other'];

  return (
    <div className="min-h-screen bg-gray-100">
      <StoreHeader />
      
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                User Audit Log
              </CardTitle>
              <CardDescription>
                Comprehensive record of all user actions and system changes
              </CardDescription>
            </div>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </CardHeader>
          
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by user, action or details..." 
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Select value={filterStore} onValueChange={setFilterStore}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Stores</SelectItem>
                      {stores.map(store => (
                        <SelectItem key={store} value={store}>{store}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      {availableActions.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="rounded-md border shadow">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead className="w-[300px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6">
                          Loading audit logs...
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => {
                        // Parse metadata to get store
                        let store = 'System';
                        if (log.metadata) {
                          try {
                            const metadata = JSON.parse(log.metadata);
                            if (metadata.store) {
                              store = metadata.store;
                            }
                          } catch (e) {
                            console.error('Error parsing metadata:', e);
                          }
                        }
                        
                        // Format user name
                        const userName = log.user 
                          ? `${log.user.firstName} ${log.user.lastName} (${log.user.email})`
                          : 'System';
                          
                        // Format details
                        let details = `${log.entityType} ${log.entityId ? `#${log.entityId}` : ''}`;
                        if (log.oldValues && log.newValues) {
                          details += ` - Changed from "${log.oldValues}" to "${log.newValues}"`;
                        } else if (log.newValues) {
                          details += ` - Set to "${log.newValues}"`;
                        }
                        
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell>{userName}</TableCell>
                            <TableCell>{store}</TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionBadgeClass(log.actionTypeId)}`}>
                                {getActionName(log.actionTypeId)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[300px] break-words">{details}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                          No audit logs found matching your filters.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableCaption>
                    A list of all user actions and system changes across all stores.
                  </TableCaption>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAudit;
