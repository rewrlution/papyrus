import { Box, Text, useInput, useApp, useStdout } from 'ink';
import React, { useState } from 'react';

import { journalStore } from '../lib/storage/index.js';
import { type JournalFileInfo } from '../lib/storage/journal-storage.js';
import { getTodayDate } from '../utils/date.js';

import { AppLayout } from './AppLayout.js';
import { JournalList } from './JournalList.js';
import { JournalViewer } from './JournalViewer.js';

interface JournalBrowserProps {
  journals: JournalFileInfo[];
}

type ViewMode = 'list' | 'viewer';

/**
 * Journal browser - shows all journals with navigation.
 *
 * Uses AppLayout for consistent layout structure.
 * Handles list navigation and state management.
 * Can switch to viewer mode when opening a journal.
 */
export const JournalBrowser: React.FC<JournalBrowserProps> = ({ journals }) => {
  const { exit } = useApp();
  const { stdout } = useStdout();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [viewerContent, setViewerContent] = useState('');
  const [viewerDate, setViewerDate] = useState('');

  const today = getTodayDate();
  const terminalHeight = stdout?.rows || 24;

  // Calculate available height for journal list
  // Terminal height - header (logo 1 + divider 1 + title 1 + divider 1 = 4)
  //                 - footer (divider 1 + shortcuts 1 = 2)
  //                 - borders (2)
  //                 - content margins (2)
  const availableHeight = Math.max(5, terminalHeight - 10);

  // Navigation handlers
  const handleNavigateUp = () => {
    setSelectedIndex((current) => {
      const next = current - 1;
      // Circular navigation: wrap to bottom if at top
      return next < 0 ? journals.length - 1 : next;
    });
  };

  const handleNavigateDown = () => {
    setSelectedIndex((current) => {
      const next = current + 1;
      // Circular navigation: wrap to top if at bottom
      return next >= journals.length ? 0 : next;
    });
  };

  const handleOpenJournal = () => {
    const journal = journals[selectedIndex];
    if (journal) {
      try {
        const content = journalStore.load(journal.date);
        if (content) {
          setViewerDate(journal.date);
          setViewerContent(content);
          setViewMode('viewer');
        }
      } catch (error) {
        console.error(`Failed to load journal: ${error}`);
      }
    }
  };

  const handleBackToList = () => {
    setViewMode('list');
    setViewerContent('');
    setViewerDate('');
  };

  // Keyboard input handlers (only for list view)
  useInput((input, key) => {
    // Only handle keyboard in list view
    if (viewMode !== 'list') return;

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

    // Open journal (Enter)
    if (key.return) {
      handleOpenJournal();
      return;
    }

    // Quit (q or Escape)
    if (input === 'q' || key.escape) {
      exit();
      return;
    }
  });

  // Viewer mode - show journal content
  if (viewMode === 'viewer' && viewerDate && viewerContent) {
    return (
      <JournalViewer
        date={viewerDate}
        content={viewerContent}
        onExit={handleBackToList}
      />
    );
  }

  // List mode - show journal list
  const headerContent = (
    <Box>
      <Text bold color="cyan">
        Browse Your Journals
      </Text>
      <Text dimColor> ({journals.length} entries)</Text>
    </Box>
  );

  const footerContent = (
    <Text dimColor>↑↓/jk Navigate • Enter Read • q Quit</Text>
  );

  return (
    <AppLayout headerContent={headerContent} footerContent={footerContent}>
      <JournalList
        journals={journals}
        selectedIndex={selectedIndex}
        todayDate={today}
        availableHeight={availableHeight}
      />
    </AppLayout>
  );
};
