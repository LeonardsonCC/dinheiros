# Theme Simplification

This document describes the changes made to simplify the theme system.

## What was removed:

1. **Custom color themes** - Removed multiple color variants (green, purple, orange, rose)
2. **Extended color scales** - Removed custom color variables (primary-50 through primary-950, etc.)
3. **Complex theme utilities** - Simplified theme utility functions
4. **Color theme selection** - Removed color theme picker from settings

## What was kept:

1. **Light/Dark mode** - Basic light and dark theme support
2. **Default shadcn theme** - Standard shadcn/ui color variables
3. **Theme context** - Simplified to only handle light/dark mode
4. **Theme toggle** - Basic light/dark mode switcher

## Default theme structure:

The theme now uses the standard shadcn/ui color variables:
- `--primary` / `--primary-foreground`
- `--secondary` / `--secondary-foreground`
- `--accent` / `--accent-foreground`
- `--muted` / `--muted-foreground`
- `--destructive` / `--destructive-foreground`
- `--background` / `--foreground`
- `--card` / `--card-foreground`
- `--popover` / `--popover-foreground`
- `--border`, `--input`, `--ring`

## For future customization:

If you want to add custom themes later, you can:
1. Add CSS variables to `index.css` under `:root` and `.dark`
2. Extend the Tailwind config in `tailwind.config.cjs`
3. Update the theme context to include color theme selection
4. Add theme picker back to `ThemeSettings.tsx`

The foundation is clean and ready for easy customization when needed.