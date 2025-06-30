# Unified Tools Navigation System

## Overview

Centralized system for managing all AI tools navigation and configuration across the application. This eliminates the need to manually update multiple files when adding new tools.

## Problem Solved

Previously, adding a new tool like `prompt-enhancer` required manual updates in multiple places:

- `components/app-sidebar.tsx` - Add to AI Tools section
- `components/tools-navigation.tsx` - Add navigation button
- `app/tools/page.tsx` - Add tool card
- Various import statements and icon definitions

This created inconsistency and made tool management error-prone.

## Architecture

### Core Configuration Files

#### 1. Tools Configuration (`lib/config/tools-config.ts`)

Centralized configuration for all AI tools:

```typescript
export interface ToolConfig {
  id: string; // Unique identifier
  name: string; // Display name
  description: string; // Full description for cards
  shortDescription?: string; // Short name for navigation
  iconName: IconName; // Icon reference
  href: string; // Route path
  category: "generation" | "enhancement" | "utility";
  features: FeatureConfig[]; // Features for tool cards
  primaryColor: string; // Tailwind color class
  hoverColor: string; // Hover state color
  bgColor: string; // Background color
  hoverBgColor: string; // Hover background color
}

export const TOOLS_CONFIG: ToolConfig[] = [
  // All tools defined here
];
```

#### 2. Icon System (`lib/config/tools-icons.tsx`)

Centralized icon management with TypeScript safety:

```typescript
export type IconName =
  | "image"
  | "video"
  | "wand"
  | "sparkles"
  | "zap"
  | "play"
  | "languages";

export function ToolIcon({ name, className = "size-4" }: ToolIconProps) {
  // Icon rendering logic
}
```

### Updated Components

#### 1. App Sidebar (`components/app-sidebar.tsx`)

```typescript
// Dynamic AI Tools section
{
  TOOLS_CONFIG.map((tool) => (
    <SidebarMenuItem key={tool.id}>
      <SidebarMenuButton asChild>
        <Link href={tool.href}>
          <ToolIcon name={tool.iconName} />
          <span>{tool.name}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}
```

#### 2. Tools Navigation (`components/tools-navigation.tsx`)

```typescript
// Dynamic tool buttons
{
  TOOLS_CONFIG.map((tool) => {
    const isActive = pathname.includes(tool.href);
    return (
      <Link
        key={tool.id}
        href={tool.href}
      >
        <Button variant={isActive ? "default" : "outline"}>
          <ToolIcon name={tool.iconName} />
          {tool.shortDescription || tool.name}
        </Button>
      </Link>
    );
  });
}
```

#### 3. Tools Page (`app/tools/page.tsx`)

```typescript
// Dynamic tool cards
{
  TOOLS_CONFIG.map((tool) => (
    <Link
      key={tool.id}
      href={tool.href}
    >
      <Card>
        <CardHeader>
          <ToolIcon
            name={tool.iconName}
            className={`size-8 text-${tool.primaryColor}`}
          />
          <CardTitle>{tool.name}</CardTitle>
          <CardDescription>{tool.description}</CardDescription>
        </CardHeader>
        <CardContent>
          {tool.features.map((feature) => (
            <div key={feature.label}>
              <ToolIcon name={feature.iconName} />
              <span>{feature.label}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </Link>
  ));
}
```

## Adding a New Tool

### Step 1: Add to Configuration

Edit `lib/config/tools-config.ts`:

```typescript
export const TOOLS_CONFIG: ToolConfig[] = [
  // ... existing tools
  {
    id: "new-tool",
    name: "New AI Tool",
    description: "Description of what this tool does",
    shortDescription: "New Tool",
    iconName: "sparkles", // or add new icon to types
    href: "/tools/new-tool",
    category: "utility",
    features: [
      { iconName: "zap", label: "Fast Processing" },
      { iconName: "sparkles", label: "High Quality" },
    ],
    primaryColor: "green-600",
    hoverColor: "green-600",
    bgColor: "green-100",
    hoverBgColor: "green-200",
  },
];
```

### Step 2: Add Icon (if needed)

If using a new icon, update `lib/config/tools-icons.tsx`:

```typescript
export type IconName =
  | "image"
  | "video"
  | "wand"
  | "sparkles"
  | "zap"
  | "play"
  | "languages"
  | "new-icon";

export function ToolIcon({ name, className = "size-4" }: ToolIconProps) {
  switch (name) {
    // ... existing cases
    case "new-icon":
      return <NewIcon className={className} />;
    // ...
  }
}
```

### Step 3: Create Tool Pages

Create the tool implementation:

- `app/tools/new-tool/page.tsx`
- `app/tools/new-tool/layout.tsx`
- `app/tools/new-tool/components/`
- `app/tools/new-tool/hooks/`

### Step 4: Add ToolsNavigation

In your tool page, add navigation:

```typescript
import { ToolsNavigation } from "@/components/tools-navigation";

export default function NewToolPage() {
  return (
    <div>
      <ToolsNavigation />
      {/* Tool content */}
    </div>
  );
}
```

### That's it!

The tool will automatically appear in:

- ✅ App sidebar under "AI Tools"
- ✅ Tools navigation breadcrumbs
- ✅ Main tools page grid
- ✅ Inter-tool navigation buttons

## Benefits

### For Developers

- **Single source of truth** for tool configuration
- **Type safety** with TypeScript interfaces
- **Consistent styling** across all components
- **Easy maintenance** - one place to update tool info

### For Users

- **Consistent navigation** experience
- **Automatic discoverability** of new tools
- **Responsive design** across all devices
- **Visual consistency** in UI/UX

## Helper Functions

### Navigation Utilities

```typescript
// Get tool by ID
const tool = getToolById("image-generator");

// Get tool by URL path
const tool = getToolByHref("/tools/video-generator");

// Get tools by category
const generationTools = getToolsByCategory("generation");

// Get navigation data
const navItems = getToolNavigation();

// Get display name for breadcrumbs
const toolName = getToolDisplayName(pathname);
```

## File Structure

```
lib/config/
├── tools-config.ts          # Main configuration
└── tools-icons.tsx          # Icon system

components/
├── app-sidebar.tsx          # Uses TOOLS_CONFIG
├── tools-navigation.tsx     # Uses TOOLS_CONFIG
└── ui/                      # Shared UI components

app/tools/
├── page.tsx                 # Uses TOOLS_CONFIG
├── tool-name/               # Individual tool implementations
│   ├── page.tsx
│   ├── layout.tsx
│   ├── components/
│   └── hooks/
└── ...
```

## Migration Notes

### Before (Manual Approach)

- Tool info scattered across 4+ files
- Inconsistent icon imports
- Manual navigation updates required
- Prone to human error and inconsistency

### After (Unified System)

- Single configuration file
- Automatic propagation to all navigation
- Type-safe icon system
- Guaranteed consistency across app

## Integration with AI Tools

This system works seamlessly with the existing AI tools architecture:

- Maintains compatibility with `artifactDefinitions` for chat artifacts
- Preserves individual tool implementations
- Enhances navigation without breaking existing functionality

## Future Enhancements

Potential extensions to the system:

- **Tool categories** - Group tools by functionality
- **Permission system** - Role-based tool access
- **Tool metrics** - Usage tracking and analytics
- **Dynamic loading** - Lazy load tool components
- **Tool marketplace** - Plugin-style tool additions
