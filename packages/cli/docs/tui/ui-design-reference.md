# UI Design Reference

**Last Updated**: December 20, 2025
**Purpose**: Visual design guidelines for Papyrus CLI TUI

## Design Philosophy

### Principles

1. **Clarity over Decoration** - Every element serves a purpose
2. **Keyboard-First** - Optimized for power users
3. **Terminal Native** - Use terminal capabilities, don't fight them
4. **Consistent Patterns** - Same actions work the same everywhere
5. **Progressive Disclosure** - Show basics first, advanced features on demand

### Inspiration

- **vim/neovim** - Modal editing, keyboard shortcuts
- **htop** - Information density, header/footer layout
- **GitHub CLI** - Modern CLI aesthetics
- **lazygit** - View switching, intuitive navigation
- **Obsidian** - Note-taking UX patterns

## Layout System

### Standard Layout Template

```
┌─────────────────────────────────────────────────────────┐
│  [ICON] Title                         [STATUS] [STATS] │  ← Header (1-2 lines)
├─────────────────────────────────────────────────────────┤  ← Separator
│                                                         │
│                                                         │
│                    Content Area                         │  ← Main content (fills available space)
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤  ← Optional separator for status
│ [STATUS MESSAGE OR SECONDARY INFO]                     │  ← Optional status line
├─────────────────────────────────────────────────────────┤  ← Separator
│ [KEYBOARD SHORTCUTS HELP]                              │  ← Footer (1-2 lines)
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

| Terminal Width | Layout Adjustments                             |
| -------------- | ---------------------------------------------- |
| < 60 chars     | Minimal: Compact labels, abbreviated shortcuts |
| 60-80 chars    | Standard: Normal labels, key shortcuts visible |
| 80-120 chars   | Comfortable: Full labels, detailed shortcuts   |
| > 120 chars    | Wide: Extra stats, preview panes               |

### Minimum Requirements

- **Width**: 60 characters (absolute minimum)
- **Height**: 15 lines (absolute minimum)
- **Optimal**: 80x24 (standard terminal size)

## Typography & Text

### Hierarchy

```
# Large Title (Headers)
📔 Browse Your Journals

## Section Headers
December 2025

### Sub-headers
Today's Entry

Body Text
Regular journal entries and descriptions
```

### Text Styles

**Bold/Emphasis** - Not directly supported, use:

- ALL CAPS for strong emphasis
- Inverse colors for selection
- Color for semantic meaning

**Alignment**:

- Left-aligned: Default for all text
- Right-aligned: Statistics, counts
- Center-aligned: Empty states, modals

### Special Characters & Icons

#### Common Icons

```
📔 Journals (main app icon)
📅 Calendar view
📊 Statistics/analytics
🔍 Search
⚙️  Settings
📝 Edit/write
✓ Success/complete
✗ Error/fail
⚠ Warning
🔥 Streak/hot
🏆 Achievement/best
● Today/current
○ Empty/inactive
⦿ Selected today
```

#### Box Drawing Characters

```
Borders:
┌ ─ ┐
│   │
└ ─ ┘

├ ─ ┤  (dividers)

Complex:
┬ ┴ ├ ┤ ┼  (intersections)
```

#### Progress/Density Indicators

```
░ ▒ ▓ █  (density levels)
□ ▢ ▣ ■  (checkboxes)
◯ ◔ ◑ ◕ ●  (circles)
```

## Color System

### Terminal Color Palette

Using ANSI colors for maximum compatibility:

```typescript
// Basic colors (use sparingly, rely on terminal theme)
const colors = {
  // Semantic colors
  primary: 'blue', // Selected, active, today
  success: 'green', // Completed, saved
  warning: 'yellow', // Caution, needs attention
  error: 'red', // Errors, destructive actions
  muted: 'gray', // Secondary text, disabled

  // Text colors
  text: 'default', // Primary text (terminal default)
  textDim: 'dim', // Secondary text

  // Special
  inverse: 'inverse', // Selected items
  highlight: 'cyan', // Today, special markers
};
```

### Color Usage Guidelines

**Do**:

- Use color to convey meaning (red = danger, green = success)
- Provide non-color alternatives (icons, text labels)
- Test in both light and dark terminal themes
- Use terminal default colors when possible

**Don't**:

- Use color as the only way to convey information
- Override user's terminal color scheme unnecessarily
- Use too many colors (3-4 colors max per screen)
- Use low-contrast color combinations

### Color Patterns

#### Selection States

```
> December 20, 2025 (20251220.md)    ← Inverse/highlighted
  December 18, 2025 (20251218.md)    ← Default
● December 19, 2025 (20251219.md)    ← Blue (today)
```

#### Status Messages

```
✓ Journal saved successfully         ← Green text
⚠ Journal already exists             ← Yellow text
✗ Failed to save journal             ← Red text
```

## Component Patterns

### List Items

**Standard List Item**:

```
  December 20, 2025 (20251220.md)
  ^^                ^^
  2 spaces          filename in parens
```

**With Selection**:

```
> December 20, 2025 (20251220.md)
^
Arrow indicator + highlight
```

**With Today Marker**:

```
● December 19, 2025 (20251219.md)
^
Filled circle (different color)
```

**With Multiple States**:

```
>● December 19, 2025 (20251219.md)
^^
Selected + Today (combine both)
```

### Calendar Cells

**Single Cell Design**:

```
┌────┐
│ 15 │  ← Day number (right-aligned)
│ ✓  │  ← Indicator (centered)
└────┘
    ^
  6 chars total width
```

**States**:

```
 15    ← Regular day
 ✓     ← Has journal

[19]   ← Selected (brackets)
 ✓

 19    ← Today (different color)
 ⦿     ← Filled circle

[19]   ← Selected + Today
 ⦿     ← Combined state
```

### Buttons & Actions

**Primary Action Button**:

```
┌──────────────┐
│   Confirm    │
└──────────────┘
```

**Action List**:

```
> Create New Journal     ← Selected
  Edit Existing
  Delete Journal
  Cancel
```

### Input Fields

**Text Input**:

```
┌─────────────────────────────────────┐
│ Search: therapy session_            │  ← Cursor shown with _
└─────────────────────────────────────┘
```

**Date Input**:

```
Enter date: 2025-12-20_
            ^^^^^^^^^^
            Format hint shown
```

### Status/Info Bars

**Header with Stats**:

```
📔 Browse Your Journals              Total: 45 entries
^                                                     ^
Left-aligned title                    Right-aligned stats
```

**Footer with Shortcuts**:

```
↑/↓: Navigate | Enter: Read | e: Edit | n: New | q: Quit
^             ^                                         ^
Key           Action                           No periods at end
```

### Empty States

**Centered, Helpful**:

```
┌─────────────────────────────────────────────────────────┐
│  📔 Browse Your Journals                                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│              No journal entries yet.                    │
│                                                         │
│         Run 'papyrus new' to create your first one.    │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ q: Quit                                                 │
└─────────────────────────────────────────────────────────┘
```

**Principles**:

- Clear, friendly message
- Actionable next step
- Adequate whitespace
- Icon for visual interest

### Modals/Dialogs

**Centered, Focused**:

```
           ┌────────────────────────────────┐
           │  Delete Journal?               │
           ├────────────────────────────────┤
           │                                │
           │  December 20, 2025             │
           │                                │
           │  This cannot be undone.        │
           │                                │
           │  > Confirm                     │
           │    Cancel                      │
           │                                │
           └────────────────────────────────┘
```

**Principles**:

- Smaller than main screen
- Clear title
- Brief explanation
- Obvious actions
- Default selection on safe option

## Animation & Transitions

### Supported Animations

**Smooth Scrolling**:

- List items scroll smoothly when navigating
- Not instant jumps (unless using Home/End)
- ~50ms delay between updates

**Loading Spinners**:

```typescript
import Spinner from 'ink-spinner';

<Spinner type="dots" />  // ⠋ ⠙ ⠹ ⠸ ⠼ ⠴ ⠦ ⠧ ⠇ ⠏
```

**Status Message Fade**:

- Appear instantly
- Stay for 2 seconds
- Dismissible immediately with any key

### No Animations

- No fancy transitions between views
- No fade effects
- No slide effects
- Keep it simple and fast

## Accessibility

### Keyboard Navigation

**Universal Keys** (work everywhere):

- `q` or `Esc` - Exit/Back/Cancel
- `?` or `h` - Help (future)
- `Ctrl+C` - Force quit (emergency exit)

**Navigation Keys** (consistent across views):

- `↑/↓` or `k/j` - Up/Down
- `←/→` or `h/l` - Left/Right (when applicable)
- `PgUp/PgDn` - Jump by page
- `Home/End` - Jump to start/end

**Action Keys** (mnemonic):

- `e` - Edit
- `n` - New
- `d` - Delete
- `s` - Statistics/Stats
- `f` - Filter
- `/` - Search (standard in vim/less/etc)

### Screen Reader Considerations

**Text Alternatives**:

- Always provide text labels with icons
- Don't rely solely on color
- Use semantic labels

**Example**:

```
✓ Success     ← Icon + Text
⚠ Warning     ← Icon + Text
✗ Error       ← Icon + Text
```

### High Contrast Mode

Test with:

```bash
# High contrast terminal themes
# Light background
# Dark background
# Solarized
# Monochrome
```

All UI should remain readable without color.

## Error Handling UI

### Error Message Pattern

```
┌─────────────────────────────────────────────────────────┐
│  ✗ Error: Failed to save journal                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Could not write to file: Permission denied            │
│                                                         │
│  Path: /home/user/.local/share/papyrus/journals/       │
│                                                         │
│  Try:                                                   │
│  • Check file permissions                              │
│  • Ensure directory exists                             │
│  • Run with appropriate user permissions               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Press any key to continue                              │
└─────────────────────────────────────────────────────────┘
```

**Error Components**:

1. **Icon + Title**: Clear error indicator
2. **Primary Message**: What went wrong
3. **Context**: Relevant details (paths, dates, etc.)
4. **Actionable Steps**: How to fix it
5. **Dismissal**: Clear how to close

### Error Severity Levels

**Critical** (red, blocks usage):

```
✗ Cannot access journals directory
```

**Warning** (yellow, can continue):

```
⚠ Journal already exists for today
```

**Info** (blue, just FYI):

```
ℹ Switched to list view
```

## Performance Considerations

### Virtual Rendering

For lists with 100+ items:

- Only render visible items (8-10 at a time)
- Maintain buffer above/below (2-3 items)
- Total DOM elements: ~15 max

### Debouncing

**Search Input**:

- Debounce at 150ms
- Show spinner if search takes > 300ms

**Terminal Resize**:

- Debounce at 100ms
- Redraw layout only after resize stops

### Lazy Loading

- Load journal content only when needed
- Don't read all files at startup
- Cache recently accessed journals

## Testing Checklist

### Cross-Platform

- [ ] Windows Terminal
- [ ] Windows Command Prompt
- [ ] macOS Terminal.app
- [ ] iTerm2
- [ ] Linux terminal emulators (gnome-terminal, konsole, etc.)

### Terminal Sizes

- [ ] 60x15 (minimum)
- [ ] 80x24 (standard)
- [ ] 120x40 (large)
- [ ] 200x60 (very large)

### Color Schemes

- [ ] Dark theme
- [ ] Light theme
- [ ] Solarized
- [ ] High contrast
- [ ] Monochrome

### Accessibility

- [ ] All features accessible via keyboard
- [ ] No color-only information
- [ ] Text alternatives for icons
- [ ] Logical tab order
- [ ] Clear focus indicators

## Implementation Notes

### Ink Specific

**Layout Components**:

```tsx
<Box flexDirection="column">       // Vertical stack
<Box flexDirection="row">          // Horizontal stack
<Box justifyContent="space-between"> // Spread
<Box alignItems="center">          // Center align
<Box marginTop={1} marginLeft={2}> // Spacing
<Box borderStyle="round">          // Border
```

**Text Components**:

```tsx
<Text color="blue">                // Colored text
<Text bold>                        // Bold text
<Text dimColor>                    // Dim text
<Text inverse>                     // Inverse (selection)
<Text wrap="truncate">             // Text overflow
```

**Useful Hooks**:

```tsx
useInput((input, key) => {...})    // Keyboard input
useStdout()                         // Terminal info
useFocus()                          // Focus management
```

### Box Model

```
┌─────────────────────────────────┐
│ margin                          │
│  ┌───────────────────────────┐  │
│  │ border                    │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ padding             │  │  │
│  │  │  ┌───────────────┐  │  │  │
│  │  │  │   content     │  │  │  │
│  │  │  └───────────────┘  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

## Resources

### Box Drawing Reference

- [Unicode Box Drawing](https://en.wikipedia.org/wiki/Box-drawing_character)
- [Unicode Block Elements](https://en.wikipedia.org/wiki/Block_Elements)

### Terminal Capabilities

- [ANSI Escape Codes](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [Terminal Colors](https://en.wikipedia.org/wiki/ANSI_escape_code#Colors)

### Ink Documentation

- [Ink GitHub](https://github.com/vadimdemedes/ink)
- [Ink Components](https://github.com/vadimdemedes/ink#components)

### Inspiration Projects

- [lazygit](https://github.com/jesseduffield/lazygit) - Git TUI
- [k9s](https://github.com/derailed/k9s) - Kubernetes TUI
- [bottom](https://github.com/ClementTsang/bottom) - System monitor TUI
- [gh](https://github.com/cli/cli) - GitHub CLI
