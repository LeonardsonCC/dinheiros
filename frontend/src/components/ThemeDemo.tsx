import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeDemo() {
  const { theme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Demo</CardTitle>
        <CardDescription>
          Current theme: {theme} mode
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
            <Badge className="bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100">Success</Badge>
            <Badge className="bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100">Warning</Badge>
            <Badge className="bg-destructive text-destructive-foreground">Destructive</Badge>
            <Badge className="bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100">Info</Badge>
            <Badge className="bg-accent text-accent-foreground">Accent</Badge>
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
            <p className="text-green-600 dark:text-green-400">Success text</p>
            <p className="text-yellow-600 dark:text-yellow-400">Warning text</p>
            <p className="text-blue-600 dark:text-blue-400">Info text</p>
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