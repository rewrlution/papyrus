import { Box, Text, useInput, useApp } from 'ink';
import React, { useState } from 'react';

import { journalStore } from '../lib/storage/index.js';
import { type JournalFileInfo } from '../lib/storage/journal-storage.js';
import { getTodayDate } from '../utils/date.js';

import { BrowserFooter } from './BrowserFooter.js';
import { BrowserHeader } from './BrowserHeader.js';
import { JournalListView } from './JournalListView.js';
import { JournalViewer } from './JournalViewer.js';

interface BrowserProps {
  journals: JournalFileInfo[];
}

type ViewMode = 'list' | 'reader';

/**
 * Interactive browser for navigating and reading journal entries.
 *
 * Features:
 * - List view with keyboard navigation (↑/↓ or j/k)
 * - Reader view with full journal content
 * - Circular navigation (wrap around at top/bottom)
 * - Today marker for current date's entry
 * - Virtual scrolling for large journal collections
 * - Press Enter to read, q to return to list or quit
 *
 * Architecture:
 * 1. BrowserHeader - Shows total journal count
 * 2. JournalListView - Virtual scrolling list of journals
 * 3. BrowserFooter - Keyboard shortcuts reference
 * 4. JournalViewer - Full journal reader (opens when selecting entry)
 *
 * State Management:
 * - viewMode: 'list' | 'reader' - Current view
 * - selectedIndex: number - Currently selected journal in list
 * - selectedJournal: JournalFileInfo | null - Journal being read
 */
export const Browser: React.FC<BrowserProps> = ({ journals }) => {
  // State management
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedJournal, setSelectedJournal] =
    useState<JournalFileInfo | null>(null);
  const [journalContent, setJournalContent] = useState<string>('');

  const { exit } = useApp();
  const today = getTodayDate();

  // Keyboard input handlers
  useInput((input, key) => {
    // Handle list view navigation
    if (viewMode === 'list') {
      // Navigate up (↑ or k)
      if (key.upArrow || input === 'k') {
        handleNavigateUp();
        return;
      }

      // Navigate down (↓ or j)
      if (key.downArrow || input === 'j') {
        handleNavigateDown();
        return;
      }

      // Open journal (Enter or Space)
      if (key.return || input === ' ') {
        handleOpenJournal();
        return;
      }

      // Quit from list view (q or Escape)
      if (input === 'q' || key.escape) {
        exit();
        return;
      }
    }

    // Note: Reader view keyboard handling is done by JournalViewer component
    // It will call handleBackToList() when user presses 'q'
  });

  // Navigation handlers
  const handleNavigateUp = () => {
    setSelectedIndex((current) => {
      const next = current - 1;
      // Circular navigation: if at top, wrap to bottom
      if (next < 0) {
        return journals.length - 1;
      }
      return next;
    });
  };

  const handleNavigateDown = () => {
    setSelectedIndex((current) => {
      const next = current + 1;
      // Circular navigation: if at bottom, wrap to top
      if (next >= journals.length) {
        return 0;
      }
      return next;
    });
  };

  const handleOpenJournal = () => {
    const journal = journals[selectedIndex];
    if (journal) {
      try {
        // Load journal content
        const content = journalStore.load(journal.date);
        if (content) {
          setSelectedJournal(journal);
          setJournalContent(content);
          setViewMode('reader');
        }
      } catch (error) {
        // If loading fails, stay in list view
        // The error will be visible in the console
        console.error(`Failed to load journal: ${error}`);
      }
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedJournal(null);
    setJournalContent('');
  };

  // Empty state
  if (journals.length === 0) {
    return (
      <Box flexDirection="column" borderStyle="round" padding={1}>
        <Text color="yellow">No journal entries yet.</Text>
        <Text dimColor> Run 'papyrus add' to create your first entry.</Text>
        <Box marginTop={1}>
          <Text dimColor>Press 'q' to quit</Text>
        </Box>
      </Box>
    );
  }

  // Reader view
  if (viewMode === 'reader' && selectedJournal) {
    return (
      <JournalViewer
        date={selectedJournal.date}
        content={journalContent}
        onExit={handleBackToList}
      />
    );
  }

  // List view (default)
  return (
    <Box flexDirection="column">
      <BrowserHeader totalJournals={journals.length} />

      <JournalListView
        journals={journals}
        selectedIndex={selectedIndex}
        todayDate={today}
        windowSize={10}
      />

      <BrowserFooter shortcuts="↑↓/jk Navigate • Enter Read • q Quit" />
    </Box>
  );
};
