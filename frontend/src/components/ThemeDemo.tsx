import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeDemo() {
  const { theme, colorTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Demo</CardTitle>
        <CardDescription>
          Current theme: {theme} mode with {colorTheme} color scheme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Button Variants */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Button Variants</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm">Primary</Button>
            <Button variant="secondary" size="sm">Secondary</Button>
            <Button variant="outline" size="sm">Outline</Button>
            <Button variant="destructive" size="sm">Destructive</Button>
            <Button variant="success" size="sm">Success</Button>
            <Button variant="warning" size="sm">Warning</Button>
            <Button variant="info" size="sm">Info</Button>
            <Button variant="ghost" size="sm">Ghost</Button>
            <Button variant="link" size="sm">Link</Button>
          </div>
        </div>

        {/* Badge Variants */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Badge Variants</h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary text-primary-foreground">Primary</Badge>
            <Badge className="bg-secondary text-secondary-foreground">Secondary</Badge>
            <Badge className="bg-success text-success-foreground">Success</Badge>
            <Badge className="bg-warning text-warning-foreground">Warning</Badge>
            <Badge className="bg-destructive text-destructive-foreground">Destructive</Badge>
            <Badge className="bg-info text-info-foreground">Info</Badge>
            <Badge className="bg-accent text-accent-foreground">Accent</Badge>
          </div>
        </div>

        {/* Color Scales */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Primary Color Scale</h4>
          <div className="grid grid-cols-11 gap-1">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
              <div
                key={shade}
                className={`aspect-square rounded text-xs flex items-center justify-center bg-primary-${shade} text-primary-${shade > 500 ? '50' : '950'}`}
              >
                {shade}
              </div>
            ))}
          </div>
        </div>

        {/* Text Hierarchy */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Text Hierarchy</h4>
          <div className="space-y-1">
            <p className="text-foreground text-lg font-semibold">Primary text (foreground)</p>
            <p className="text-muted-foreground">Muted text (muted-foreground)</p>
            <p className="text-primary">Primary colored text</p>
            <p className="text-secondary-foreground">Secondary text</p>
            <p className="text-destructive">Destructive/error text</p>
            <p className="text-success">Success text</p>
            <p className="text-warning">Warning text</p>
            <p className="text-info">Info text</p>
          </div>
        </div>

        {/* Background Examples */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Background Examples</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded bg-card border border-border">
              <p className="text-card-foreground text-sm">Card background</p>
            </div>
            <div className="p-3 rounded bg-muted">
              <p className="text-muted-foreground text-sm">Muted background</p>
            </div>
            <div className="p-3 rounded bg-accent">
              <p className="text-accent-foreground text-sm">Accent background</p>
            </div>
            <div className="p-3 rounded bg-secondary">
              <p className="text-secondary-foreground text-sm">Secondary background</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}