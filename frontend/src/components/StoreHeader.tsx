import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import StoreSelector from './StoreSelector';
import ThemeSelector from './ThemeSelector';
import { ChevronDown, Store, User, Settings, LogOut } from "lucide-react";
import { useAuthContext } from '@/context/AuthContext';

const StoreHeader: React.FC = () => {
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';

  return (
    <header className="bg-card shadow border-b border-border">
      <div className="container mx-auto px-4 flex justify-between items-center h-16">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold flex items-center text-foreground">
            <Store className="mr-2 h-5 w-5" />
            ezHisab
          </Link>
        </div>
        
        <div className="flex items-center justify-center space-x-6">
          {isAdmin && (
            <>
              <Link to="/admin" className="text-foreground hover:text-primary transition-colors">Admin</Link>
              <Link to="/audit" className="text-foreground hover:text-primary transition-colors">Audit Logs</Link>
            </>
          )}
          <Link to="/reports" className="text-foreground hover:text-primary transition-colors">Reports</Link>
          <Link to="/settings" className="text-foreground hover:text-primary transition-colors">Settings</Link>
        </div>
        
        <div className="flex items-center gap-4">
          <StoreSelector />
          <ThemeSelector />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="inline-flex items-center">
                <User className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{user?.firstName || 'User'}</span>
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link to="/admin" className="flex items-center">
                    <Store className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild>
                <Link to="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/login" className="flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default StoreHeader;
