# Journal App & Browse Feature - Migration Guide

This guide explains how the journal browsing feature was migrated from the previous `nav` command to the new `app` command (previously called `list`), integrating with the enhanced `JournalViewer` component.

## What We Built

An interactive journal browser that lets users:

- View a list of all journal entries with navigation
- Select and read full journal content
- Return to list view from reader mode
- Use familiar keyboard shortcuts (vim-style navigation)

**Previous version**: `papyrus nav` - Basic browse functionality with separate `JournalReader` component
**Current version**: `papyrus app` - Enhanced browse with unified `JournalViewer` component (renamed from `list`)

## Architecture

The browser is composed of four main components working together:

```
┌─────────────────────────────────────────────┐
│              Browser (Main)                  │
│  - State management (view mode, selection)  │
│  - Keyboard input coordination              │
│  - View switching logic                     │
└──────────────┬──────────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
   List View        Reader View
       │                │
┌──────▼─────────┐  ┌──▼───────────────┐
│ BrowserHeader  │  │ JournalViewer    │
│ (Total count)  │  │ (Full content)   │
└────────────────┘  └──────────────────┘
┌────────────────┐
│JournalListView │
│ (Entry list)   │
└────────────────┘
┌────────────────┐
│ BrowserFooter  │
│ (Shortcuts)    │
└────────────────┘
```

### Component Responsibilities

1. **Browser** (`Browser.tsx`)
   - Manages view state (list vs reader)
   - Handles keyboard navigation in list view
   - Loads journal content when opening entries
   - Switches between list and reader views

2. **BrowserHeader** (`BrowserHeader.tsx`)
   - Displays "Browse Your Journals" title
   - Shows total journal count
   - Simple, stateless component

3. **JournalListView** (`JournalListView.tsx`)
   - Virtual scrolling for large journal collections
   - Shows selection indicator and today marker
   - Displays formatted dates and filenames
   - Supports window-based viewing (shows 10 at a time)

4. **BrowserFooter** (`BrowserFooter.tsx`)
   - Shows keyboard shortcuts
   - Context-aware help text
   - Simple, stateless component

5. **JournalViewer** (`JournalViewer.tsx`)
   - Full journal content display with line numbers
   - Advanced scrolling (vertical + horizontal)
   - **Enhanced**: Now accepts `onExit` callback for returning to list view
   - Rich keyboard navigation (vim keys, page up/down, etc.)

## What Changed from Previous Version

### Command Name

- **Before**: `papyrus nav`
- **After**: `papyrus app` (previously `list` with alias `ls`, now simplified to just `app`)

### Reader Component

- **Before**: Separate `JournalReader` component
- **After**: Unified `JournalViewer` component with enhanced features

### Key Improvements

1. **Enhanced Viewer**
   - Line numbers for reference
   - Horizontal panning for long lines
   - More keyboard shortcuts (g/G for top/bottom, 0 for line start)
   - Progress indicator showing current position
   - Virtual scrolling for performance

2. **Better Navigation**
   - Circular navigation (wraps around at edges)
   - Virtual scrolling in list view (handles thousands of entries)
   - Context-aware keyboard handling

3. **Improved UX**
   - Press `q` in reader returns to list (not exit app)
   - Today marker shows current date's entry
   - Cleaner error handling
   - Consistent styling across components

## Implementation Details

### File Structure

```
src/
├── commands/
│   └── journal/
│       └── list.ts              # Main command (updated)
└── components/
    ├── Browser.tsx              # Main browser (new)
    ├── BrowserHeader.tsx        # Header component (new)
    ├── BrowserFooter.tsx        # Footer component (new)
    ├── JournalListView.tsx      # List view (new)
    └── JournalViewer.tsx        # Reader (enhanced with onExit)
```

### Key Code Changes

#### 1. JournalViewer Enhancement

**What changed**: Added optional `onExit` callback to support returning to list view.

```typescript
// Before (implicit behavior - always exit app)
export const JournalViewer = ({ date, content }: JournalViewerProps) => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit(); // Always exits app
    }
  });
};

// After (flexible behavior - callback or exit)
export const JournalViewer = ({
  date,
  content,
  onExit,
}: JournalViewerProps) => {
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      if (onExit) {
        onExit(); // Call callback if provided
      } else {
        exit(); // Exit app if no callback (standalone mode)
      }
    }
  });
};
```

**Why this approach**:

- Maintains backward compatibility (works standalone without callback)
- Enables component reuse in different contexts
- Clear separation of concerns (viewer doesn't need to know about browser)

#### 2. Browser State Management

**Implementation**: Uses React hooks for view state and selection tracking.

```typescript
export const Browser: React.FC<BrowserProps> = ({ journals }) => {
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedJournal, setSelectedJournal] = useState<JournalFileInfo | null>(null);
  const [journalContent, setJournalContent] = useState<string>('');

  // Handle opening journal
  const handleOpenJournal = () => {
    const journal = journals[selectedIndex];
    if (journal) {
      const content = journalStore.load(journal.date);
      if (content) {
        setSelectedJournal(journal);
        setJournalContent(content);
        setViewMode('reader'); // Switch to reader view
      }
    }
  };

  // Handle returning to list
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedJournal(null);
    setJournalContent('');
  };

  // Render based on view mode
  if (viewMode === 'reader' && selectedJournal) {
    return (
      <JournalViewer
        date={selectedJournal.date}
        content={journalContent}
        onExit={handleBackToList} // Pass callback
      />
    );
  }

  // Default: list view
  return (
    <Box flexDirection="column">
      <BrowserHeader totalJournals={journals.length} />
      <JournalListView ... />
      <BrowserFooter ... />
    </Box>
  );
};
```

**Why this works**:

- Single source of truth for view state
- Clean separation between list and reader modes
- Callback pattern for communication between components
- No prop drilling (viewer doesn't need to know about Browser's state)

#### 3. Virtual Scrolling in List View

**Implementation**: Shows only a window of journals around the selected index.

```typescript
const getVisibleJournals = () => {
  const total = journals.length;

  // If total fits in window, show all
  if (total <= windowSize) return journals;

  // Calculate window boundaries
  const halfWindow = Math.floor(windowSize / 2);
  let start = selectedIndex - halfWindow;
  let end = selectedIndex + halfWindow;

  // Adjust boundaries if out of range
  if (start < 0) {
    start = 0;
    end = windowSize;
  } else if (end > total) {
    end = total;
    start = total - windowSize;
  }

  return journals.slice(start, end);
};
```

**Why this matters**:

- Performance: Only renders ~10 items regardless of total count
- UX: Keeps selected item centered in view
- Scalability: Handles thousands of journals smoothly

#### 4. Command Implementation

**Before** (`browse.ts`):

```typescript
export function registerBrowseCommand(program: Command) {
  program
    .command('nav')
    .description('Browse journals interactively')
    .action(async () => {
      const journals = listJournals();
      render(React.createElement(Browser, { journals }));
    });
}
```

**After** (`list.ts`):

```typescript
export async function listEntries(): Promise<void> {
  try {
    const journals = journalStore.list();
    const { waitUntilExit } = render(
      React.createElement(Browser, { journals })
    );
    await waitUntilExit();
  } catch (error: any) {
    console.error(`\n❌ Error: Failed to list journal entries`);
    console.error(`${error.message}\n`);
    process.exit(1);
  }
}
```

**Key differences**:

- Proper error handling with try-catch
- Waits for exit before returning
- Uses new `journalStore` API
- Consistent error message formatting

## How to Use

### List and Browse Journals

```bash
# Launch the Papyrus TUI to browse journals interactively
papyrus app
```

### Keyboard Shortcuts

**In List View:**

- `↑` or `k` - Move up
- `↓` or `j` - Move down
- `Enter` or `Space` - Open selected journal
- `q` or `Esc` - Quit

**In Reader View:**

- `↑`/`↓` or `j`/`k` - Scroll line by line
- `←`/`→` or `h`/`l` - Pan horizontally (10 chars)
- `PgUp`/`PgDn` - Page up/down
- `Space` - Page down
- `g` or `Home` - Jump to top
- `G` or `End` - Jump to bottom
- `0` - Jump to start of line
- `q` or `Esc` - Return to list view

## Common Patterns

### Using Browser Standalone

The Browser component can be used directly in any command:

```typescript
import { Browser } from '../components/Browser.js';
import { journalStore } from '../lib/storage/index.js';

// In your command
const journals = journalStore.list();
render(React.createElement(Browser, { journals }));
```

### Using JournalViewer Standalone

The JournalViewer works independently without Browser:

```typescript
import { JournalViewer } from '../components/JournalViewer.js';

// Standalone viewer (q exits app)
render(
  React.createElement(JournalViewer, {
    date: '20260104',
    content: journalContent,
  })
);

// Viewer with callback (q calls function)
render(
  React.createElement(JournalViewer, {
    date: '20260104',
    content: journalContent,
    onExit: () => console.log('Back to list'),
  })
);
```

## Design Decisions

### 1. Why `onExit` callback instead of event system?

**Decision**: Use simple callback prop instead of event emitter or global state.

**Reasoning**:

- Simpler: No need for event subscription/cleanup
- Clear: Data flow is explicit (parent passes callback)
- Type-safe: TypeScript ensures callback signature
- Testable: Easy to mock in tests

**Trade-off**: Requires prop passing, but in this case it's only one level deep.

### 2. Why separate list view and reader view components?

**Decision**: Keep `JournalListView` and `JournalViewer` as separate components.

**Reasoning**:

- Single Responsibility: Each component does one thing well
- Reusability: Both components can be used independently
- Testability: Easier to test in isolation
- Performance: Can optimize each view separately

**Alternative considered**: Combine into single mega-component. Rejected because it would violate SRP and reduce flexibility.

### 3. Why virtual scrolling in list view?

**Decision**: Only render visible journals (window of 10).

**Reasoning**:

- Performance: Ink renders to terminal - fewer elements = faster
- Scalability: Handles 1000+ journals smoothly
- UX: Keeps UI focused on relevant items

**Trade-off**: Slightly more complex logic, but worth it for large collections.

### 4. Why circular navigation?

**Decision**: Wrap around at top/bottom of list.

**Reasoning**:

- UX: Common pattern in CLI tools (vim, less, etc.)
- Convenience: Easy to jump from bottom to top
- Predictable: Users expect this behavior

**Alternative considered**: Stop at edges. Rejected because it requires more keypresses to navigate.

## Migration Checklist

If you're migrating code that used the old `nav` command:

- [ ] Update command name from `nav` to `list` (or `ls`)
- [ ] Replace `JournalReader` imports with `JournalViewer`
- [ ] Add `onExit` callback to `JournalViewer` if using in browser context
- [ ] Update storage calls to use `journalStore.list()` instead of `listJournals()`
- [ ] Add error handling with try-catch
- [ ] Update keyboard shortcut documentation
- [ ] Test circular navigation works correctly
- [ ] Verify today marker appears for current date
- [ ] Check virtual scrolling with 20+ journals

## Testing Recommendations

### Manual Testing

1. **List View Navigation**

   ```bash
   # Create multiple journals first
   papyrus add -d 20260101
   papyrus add -d 20260102
   papyrus add -d 20260103

   # Test list view
   papyrus app
   # - Press j/k to navigate
   # - Verify selection indicator moves
   # - Verify circular navigation at edges
   ```

2. **Reader View**

   ```bash
   # Open a journal
   papyrus app
   # - Press Enter on an entry
   # - Verify reader opens with content
   # - Press q to return to list
   # - Verify you're back in list view
   ```

3. **Virtual Scrolling**

   ```bash
   # Create 20+ journals
   for i in {1..25}; do
     papyrus add -d $(date -d "2026-01-$i" +%Y%m%d)
   done

   # Test scrolling
   papyrus app
   # - Navigate through all entries
   # - Verify "More above/below" indicators
   # - Verify selection stays centered
   ```

### Unit Testing

```typescript
import { render } from 'ink-testing-library';
import { Browser } from '../src/components/Browser.js';

it('should switch to reader view when selecting journal', () => {
  const journals = [
    { date: '20260101', path: '/path', size: 100, modified: new Date() }
  ];

  const { stdin, lastFrame } = render(<Browser journals={journals} />);

  // Should start in list view
  expect(lastFrame()).toContain('Browse Your Journals');

  // Press Enter to open
  stdin.write('\r');

  // Should switch to reader view
  expect(lastFrame()).toContain('January 1, 2026');
});
```

## Troubleshooting

### Issue: "q" exits app instead of returning to list

**Solution**: Verify `onExit` callback is passed to `JournalViewer`.

```typescript
// Check Browser.tsx
<JournalViewer
  date={selectedJournal.date}
  content={journalContent}
  onExit={handleBackToList} // ← Make sure this is present
/>
```

### Issue: List shows empty even though journals exist

**Solution**: Check that `journalStore.list()` returns data.

```bash
# Debug: Check journal directory
ls ~/.local/share/papyrus/journals/

# Should see .md files like 20260101.md
```

### Issue: Virtual scrolling doesn't work properly

**Solution**: Verify window size calculation in `JournalListView`.

```typescript
// Check that windowSize is reasonable (default: 10)
<JournalListView
  journals={journals}
  selectedIndex={selectedIndex}
  todayDate={today}
  windowSize={10} // ← Adjust if needed
/>
```

### Issue: Today marker not showing

**Solution**: Ensure date format matches exactly (YYYYMMDD).

```typescript
// getTodayDate() must return YYYYMMDD format
const today = getTodayDate(); // e.g., "20260104"
```

## Next Steps

Now that you have the browse functionality:

1. **Add search**: Implement text search across journals
2. **Add filters**: Filter by date range or tags
3. **Add preview**: Show first few lines in list view
4. **Add sorting**: Sort by date, size, or modified time
5. **Add bulk operations**: Delete/export multiple journals

## Related Documentation

- [Journal Storage Architecture](./ARCHITECTURE-JOURNAL-STORAGE.md) - How journals are stored
- [React CLI Components](./03-REACT-CLI-COMPONENTS.md) - Building Ink components
- [Journal Commands](./06-JOURNAL-ADD-IMPLEMENTATION.md) - Other journal operations

## Summary

**What we did**:

- Migrated `nav` command to enhanced `list` command
- Integrated with unified `JournalViewer` component
- Added `onExit` callback for returning to list view
- Implemented virtual scrolling for performance
- Added circular navigation and today marker

**Key improvements**:

- Better keyboard shortcuts and navigation
- Enhanced reader with line numbers and horizontal panning
- Cleaner component architecture
- Proper error handling
- Consistent with project patterns

**Result**: Users can now browse journals interactively with a rich, performant UI that scales to thousands of entries.
