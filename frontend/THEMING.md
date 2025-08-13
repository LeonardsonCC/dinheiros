# Theming System

This document describes the comprehensive theming system implemented in the Dinheiros frontend application.

## Overview

The theming system provides:
- **Dark/Light mode support** - Automatic switching based on system preference with manual override
- **Multiple color themes** - Blue (default), Green, Purple, Orange, and Rose color schemes
- **Consistent color hierarchy** - Primary, secondary, accent, success, warning, info, and destructive colors
- **Complete shadcn/ui integration** - All components automatically adapt to theme changes

## Color Hierarchy

### Semantic Colors
- **Primary**: Main brand color, used for primary actions and key UI elements
- **Secondary**: Supporting color for secondary actions and backgrounds
- **Accent**: Highlight color for interactive elements and emphasis
- **Success**: Green tones for positive states (confirmations, success messages)
- **Warning**: Yellow/orange tones for caution states
- **Info**: Blue tones for informational content
- **Destructive**: Red tones for errors and destructive actions

### UI Colors
- **Background**: Main application background
- **Foreground**: Primary text color
- **Card**: Card/panel background
- **Border**: Border color for elements
- **Input**: Input field backgrounds
- **Muted**: Subdued backgrounds and muted text
- **Popover**: Dropdown and popover backgrounds

## Usage

### Using Theme Context

```tsx
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { theme, colorTheme, toggleTheme, setColorTheme } = useTheme();
  
  return (
    <div>
      <p>Current theme: {theme}</p>
      <p>Current color: {colorTheme}</p>
      <button onClick={toggleTheme}>Toggle Dark/Light</button>
      <button onClick={() => setColorTheme('green')}>Set Green Theme</button>
    </div>
  );
}
```

### Using Color Classes

#### Primary Colors
```tsx
// Use primary color scale (50-950)
<div className="bg-primary-100 text-primary-900">Light primary background</div>
<div className="bg-primary-600 text-primary-50">Primary button</div>
<button className="bg-primary hover:bg-primary/90 text-primary-foreground">
  Primary Action
</button>
```

#### Secondary Colors
```tsx
<div className="bg-secondary text-secondary-foreground">Secondary content</div>
<button className="bg-secondary-500 text-secondary-50">Secondary button</button>
```

#### Status Colors
```tsx
// Success states
<div className="bg-success-100 text-success-900 border border-success-200">
  Success message
</div>

// Warning states
<div className="bg-warning-100 text-warning-900 border border-warning-200">
  Warning message
</div>

// Error states
<div className="bg-destructive-100 text-destructive-900 border border-destructive-200">
  Error message
</div>

// Info states
<div className="bg-info-100 text-info-900 border border-info-200">
  Info message
</div>
```

#### UI Elements
```tsx
// Cards and containers
<div className="bg-card text-card-foreground border border-border">
  Card content
</div>

// Muted content
<p className="text-muted-foreground">Subdued text</p>
<div className="bg-muted">Muted background</div>

// Interactive elements
<div className="bg-accent text-accent-foreground">Highlighted content</div>
```

### Theme Settings Component

Use the `ThemeSettings` component to provide users with theme customization:

```tsx
import { ThemeSettings } from '../components/ThemeSettings';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <ThemeSettings />
    </div>
  );
}
```

## Available Color Themes

### Blue (Default)
- Clean, professional appearance
- Primary: `hsl(221.2, 83.2%, 53.3%)`
- Good for business and financial applications

### Green
- Natural, growth-oriented feeling
- Primary: `hsl(142, 70%, 49%)`
- Excellent for success states and eco-friendly themes

### Purple
- Creative, modern appearance
- Primary: `hsl(262, 83%, 58%)`
- Great for creative and tech applications

### Orange
- Energetic, warm feeling
- Primary: `hsl(24, 95%, 53%)`
- Perfect for call-to-action elements

### Rose
- Elegant, sophisticated appearance
- Primary: `hsl(330, 81%, 60%)`
- Ideal for lifestyle and design-focused applications

## Best Practices

### 1. Use Semantic Classes
```tsx
// Good - semantic meaning
<button className="bg-primary text-primary-foreground">Primary Action</button>
<div className="bg-success-100 text-success-900">Success message</div>

// Avoid - hardcoded colors
<button className="bg-blue-600 text-white">Button</button>
```

### 2. Respect Color Hierarchy
- Use `primary` for main actions and brand elements
- Use `secondary` for supporting actions
- Use `accent` sparingly for highlights
- Use status colors (`success`, `warning`, `destructive`, `info`) appropriately

### 3. Maintain Contrast
All color combinations are tested for accessibility, but when creating custom combinations:
```tsx
// Good contrast pairs
<div className="bg-primary-100 text-primary-900">High contrast</div>
<div className="bg-primary text-primary-foreground">Designed pair</div>
```

### 4. Use Color Scales
Take advantage of the 50-950 color scales for subtle variations:
```tsx
// Hover states
<button className="bg-primary-600 hover:bg-primary-700">Button</button>

// Gradual emphasis
<div className="bg-primary-50 border border-primary-200">
  <h3 className="text-primary-900">Title</h3>
  <p className="text-primary-700">Content</p>
</div>
```

## CSS Custom Properties

All colors are available as CSS custom properties:

```css
/* Primary color scale */
--primary-50 through --primary-950
--primary (main primary color)
--primary-foreground (contrasting text)

/* Other semantic colors */
--secondary, --secondary-foreground
--accent, --accent-foreground
--success, --success-foreground
--warning, --warning-foreground
--info, --info-foreground
--destructive, --destructive-foreground

/* UI colors */
--background, --foreground
--card, --card-foreground
--border, --input, --ring
--muted, --muted-foreground
--popover, --popover-foreground
```

## Extending the Theme

To add a new color theme:

1. **Add CSS variables** in `src/index.css`:
```css
.theme-teal {
  --primary: 178 78% 46%;
  --primary-foreground: 210 40% 98%;
  --primary-50: 240 253 250;
  /* ... rest of the scale */
}
```

2. **Update the theme context** in `src/contexts/ThemeContext.tsx`:
```tsx
const availableColorThemes = [
  // ... existing themes
  { value: 'teal' as ColorTheme, label: 'Teal', preview: 'hsl(178, 78%, 46%)' },
];
```

3. **Update TypeScript types**:
```tsx
type ColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'rose' | 'teal';
```

## Migration Guide

If updating from the old theme system:

1. Replace hardcoded color classes:
   - `bg-blue-600` → `bg-primary`
   - `text-green-600` → `text-success`
   - `bg-red-100` → `bg-destructive-100`

2. Update custom CSS to use CSS custom properties:
   - `#3B82F6` → `hsl(var(--primary))`
   - `rgba(59, 130, 246, 0.1)` → `hsl(var(--primary-100))`

3. Use semantic color names instead of specific colors:
   - Success states → `success` colors
   - Error states → `destructive` colors
   - Primary actions → `primary` colors