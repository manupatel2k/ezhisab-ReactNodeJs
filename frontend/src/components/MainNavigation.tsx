
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Store, FileText, Users, Activity, Settings } from 'lucide-react';

const MainNavigation: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="w-full py-2 bg-card border-b border-border">
      <div className="container mx-auto">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/dashboard">
                <div className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/dashboard') ? "bg-accent text-accent-foreground" : ""
                )}>
                  <Store className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </div>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/admin">
                <div className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/admin') ? "bg-accent text-accent-foreground" : ""
                )}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Admin</span>
                </div>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/audit">
                <div className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/audit') ? "bg-accent text-accent-foreground" : ""
                )}>
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Audit Logs</span>
                </div>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/reports">
                <div className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/reports') ? "bg-accent text-accent-foreground" : ""
                )}>
                  <FileText className="mr-2 h-4 w-4" />
                  <span>Reports</span>
                </div>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/settings">
                <div className={cn(
                  navigationMenuTriggerStyle(),
                  isActive('/settings') ? "bg-accent text-accent-foreground" : ""
                )}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </div>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default MainNavigation;
