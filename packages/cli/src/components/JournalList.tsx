import { Box, Text, useStdout } from 'ink';
import React from 'react';

import { journalStore } from '../lib/storage/index.js';
import { type JournalFileInfo } from '../lib/storage/journal-storage.js';
import { formatDate } from '../utils/date.js';
import { extractPreview } from '../utils/journal-preview.js';
import { truncateToWidth, padToWidth } from '../utils/text.js';

interface JournalListProps {
  journals: JournalFileInfo[];
  selectedIndex: number;
  todayDate: string;
  availableHeight: number; // How many lines we can display
}

// Column widths for alignment
const SELECTION_INDICATOR_WIDTH = 2; // "> " or "  "
const DATE_COLUMN_WIDTH = 27; // "December 31, 2025 ●" = 20 chars + padding
const BORDER_AND_PADDING = 4; // Box borders and padding

/**
 * Journal list view with viewport-based rendering.
 *
 * Only renders journals that fit in the available height, centered around
 * the selected item. Shows date and content preview for each journal.
 */
export const JournalList: React.FC<JournalListProps> = ({
  journals,
  selectedIndex,
  todayDate,
  availableHeight,
}) => {
  const { stdout } = useStdout();
  const terminalWidth = stdout?.columns || 120;
  // Calculate which journals to show (viewport around selection)
  const getVisibleJournals = () => {
    const maxItems = Math.max(3, availableHeight); // At least show 3 items

    if (journals.length <= maxItems) {
      // All journals fit, show everything
      return { visible: journals, startIndex: 0 };
    }

    // Center the selection in the viewport
    const halfWindow = Math.floor(maxItems / 2);
    let start = selectedIndex - halfWindow;

    // Keep viewport within bounds
    if (start < 0) {
      start = 0;
    } else if (start + maxItems > journals.length) {
      start = journals.length - maxItems;
    }

    return {
      visible: journals.slice(start, start + maxItems),
      startIndex: start,
    };
  };

  const { visible, startIndex } = getVisibleJournals();

  // Calculate available width for preview
  const availableWidthForPreview =
    terminalWidth -
    SELECTION_INDICATOR_WIDTH -
    DATE_COLUMN_WIDTH -
    BORDER_AND_PADDING;

  return (
    <Box flexDirection="column">
      {visible.map((journal, viewportIndex) => {
        const actualIndex = startIndex + viewportIndex;
        const isSelected = actualIndex === selectedIndex;
        const isToday = journal.date === todayDate;
        const formattedDate = formatDate(journal.date);

        // Load journal content and extract preview
        let preview = '';
        try {
          const content = journalStore.load(journal.date);
          if (content) {
            preview = extractPreview(content);
          }
        } catch {
          preview = '(error loading)';
        }

        // Format date with today indicator as one unit
        const dateWithIndicator = isToday
          ? `${formattedDate} ●`
          : formattedDate;
        const paddedDate = padToWidth(dateWithIndicator, DATE_COLUMN_WIDTH);
        const truncatedPreview = truncateToWidth(
          preview,
          availableWidthForPreview
        );

        return (
          <Box key={journal.date}>
            {/* Selection indicator */}
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '> ' : '  '}
            </Text>

            {/* Date column with today indicator (fixed width) */}
            <Text color={isSelected ? 'cyan' : 'white'}>{paddedDate}</Text>

            {/* Preview column */}
            <Text dimColor>{truncatedPreview}</Text>
          </Box>
        );
      })}
    </Box>
  );
};
