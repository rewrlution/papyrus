import { Box, Text } from 'ink';
import React from 'react';

import { type JournalFileInfo } from '../lib/storage/journal-storage.js';
import { formatDate } from '../utils/date.js';

interface JournalListViewSimpleProps {
  journals: JournalFileInfo[];
  selectedIndex: number;
  todayDate: string;
  availableHeight: number; // How many lines we can display
}

/**
 * Simplified journal list view with viewport-based rendering.
 *
 * Only renders journals that fit in the available height, centered around
 * the selected item. Much simpler than the original virtual scrolling.
 */
export const JournalListViewSimple: React.FC<JournalListViewSimpleProps> = ({
  journals,
  selectedIndex,
  todayDate,
  availableHeight,
}) => {
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

  return (
    <Box flexDirection="column">
      {visible.map((journal, viewportIndex) => {
        const actualIndex = startIndex + viewportIndex;
        const isSelected = actualIndex === selectedIndex;
        const isToday = journal.date === todayDate;
        const formattedDate = formatDate(journal.date);

        return (
          <Box key={journal.date}>
            {/* Selection indicator */}
            <Text color={isSelected ? 'cyan' : 'white'}>
              {isSelected ? '> ' : '  '}
            </Text>

            {/* Date */}
            <Text color={isSelected ? 'cyan' : 'white'}>{formattedDate}</Text>

            {/* Filename */}
            <Text dimColor> ({journal.date}.md)</Text>

            {/* Today marker */}
            {isToday && <Text color="blue"> ●</Text>}
          </Box>
        );
      })}
    </Box>
  );
};
