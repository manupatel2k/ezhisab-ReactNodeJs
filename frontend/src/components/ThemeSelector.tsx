
import React from 'react';
import { Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, ThemeType } from './ThemeProvider';

const ThemeSelector = () => {
  const { theme, setTheme } = useTheme();

  const themeOptions: { label: string; value: ThemeType; icon: JSX.Element }[] = [
    { label: 'Light', value: 'light', icon: <Sun className="h-4 w-4" /> },
    { label: 'Dark', value: 'dark', icon: <Moon className="h-4 w-4" /> },
    { label: 'Blue', value: 'blue', icon: <Palette className="h-4 w-4 text-blue-500" /> },
    { label: 'Purple', value: 'purple', icon: <Palette className="h-4 w-4 text-purple-500" /> },
    { label: 'Green', value: 'green', icon: <Palette className="h-4 w-4 text-green-500" /> },
    { label: 'Amber', value: 'amber', icon: <Palette className="h-4 w-4 text-amber-500" /> },
    { label: 'Teal', value: 'teal', icon: <Palette className="h-4 w-4 text-teal-500" /> },
    { label: 'Rose', value: 'rose', icon: <Palette className="h-4 w-4 text-rose-500" /> },
  ];

  const currentIcon = () => {
    switch (theme) {
      case 'dark': return <Moon className="h-4 w-4" />;
      case 'blue': return <Palette className="h-4 w-4 text-blue-500" />;
      case 'purple': return <Palette className="h-4 w-4 text-purple-500" />;
      case 'green': return <Palette className="h-4 w-4 text-green-500" />;
      case 'amber': return <Palette className="h-4 w-4 text-amber-500" />;
      case 'teal': return <Palette className="h-4 w-4 text-teal-500" />;
      case 'rose': return <Palette className="h-4 w-4 text-rose-500" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          {currentIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themeOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="cursor-pointer flex items-center gap-2"
          >
            {option.icon}
            {option.label}
            {theme === option.value && (
              <span className="ml-auto text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;
