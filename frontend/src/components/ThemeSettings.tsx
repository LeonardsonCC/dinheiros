import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline';

export function ThemeSettings() {
  const { theme, colorTheme, toggleTheme, setColorTheme, availableColorThemes } = useTheme();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Customize how the application looks and feels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dark/Light Mode Toggle */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Theme Mode
            </label>
            <div className="flex items-center space-x-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => theme === 'dark' && toggleTheme()}
                className="flex items-center space-x-2"
              >
                <SunIcon className="h-4 w-4" />
                <span>Light</span>
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => theme === 'light' && toggleTheme()}
                className="flex items-center space-x-2"
              >
                <MoonIcon className="h-4 w-4" />
                <span>Dark</span>
              </Button>
            </div>
          </div>

          {/* Color Theme Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Color Theme
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {availableColorThemes.map((themeOption) => (
                <button
                  key={themeOption.value}
                  onClick={() => setColorTheme(themeOption.value)}
                  className={`
                    relative flex flex-col items-center space-y-2 rounded-lg border p-4 hover:bg-accent hover:text-accent-foreground
                    ${colorTheme === themeOption.value 
                      ? 'border-primary bg-primary/5 text-primary' 
                      : 'border-border'
                    }
                  `}
                >
                  <div
                    className="h-8 w-8 rounded-full border border-border/50"
                    style={{ backgroundColor: themeOption.preview }}
                  />
                  <span className="text-sm font-medium">{themeOption.label}</span>
                  {colorTheme === themeOption.value && (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Preview
            </label>
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center space-x-2">
                <Button size="sm">Primary Button</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-16 rounded bg-primary" />
                <div className="h-2 w-12 rounded bg-secondary" />
                <div className="h-2 w-8 rounded bg-accent" />
              </div>
              <div className="text-sm text-muted-foreground">
                This is how text appears with the current theme.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}