import { Box, Text } from 'ink';
import React from 'react';

import { type JournalFileInfo } from '../lib/storage/journal-storage.js';
import { formatDate } from '../utils/date.js';

interface JournalListViewProps {
  journals: JournalFileInfo[];
  selectedIndex: number;
  todayDate: string;
  windowSize?: number; // How many to show at once
}

export const JournalListView: React.FC<JournalListViewProps> = ({
  journals,
  selectedIndex,
  todayDate,
  windowSize = 10,
}) => {
  // Virtual scrolling logic - show a window around the selected index
  const getVisibleJournals = () => {
    const total = journals.length;

    if (total <= windowSize) return journals;

    const halfWindow = Math.floor(windowSize / 2);
    let start = selectedIndex - halfWindow;
    let end = selectedIndex + halfWindow;

    // Adjust if window goes out of bounds
    if (start < 0) {
      start = 0;
      end = windowSize;
    } else if (end > total) {
      end = total;
      start = total - windowSize;
    }

    return journals.slice(start, end);
  };

  const visibleJournals = getVisibleJournals();
  const showMoreAbove = selectedIndex > Math.floor(windowSize / 2);
  const showMoreBelow =
    selectedIndex < journals.length - Math.floor(windowSize / 2) - 1;

  // Calculate padding needed to fill terminal height
  const linesUsed =
    visibleJournals.length + (showMoreAbove ? 1 : 0) + (showMoreBelow ? 1 : 0);
  const paddingNeeded = Math.max(0, windowSize - linesUsed);
  const emptyLines = Array(paddingNeeded).fill('');

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Indicator: More items above */}
      {showMoreAbove && (
        <Box justifyContent="center">
          <Text dimColor>↑ More above</Text>
        </Box>
      )}

      {/* Render visible journals */}
      {visibleJournals.map((journal) => {
        // Find actual index in full array
        const actualIndex = journals.findIndex((j) => j.date === journal.date);
        const isSelected = actualIndex === selectedIndex;
        const isToday = journal.date === todayDate;

        return (
          <JournalItem
            key={journal.date}
            journal={journal}
            isSelected={isSelected}
            isToday={isToday}
          />
        );
      })}

      {/* Indicator: More items below */}
      {showMoreBelow && (
        <Box justifyContent="center">
          <Text dimColor>↓ More below</Text>
        </Box>
      )}

      {/* Fill remaining space with empty lines to use full terminal height */}
      {emptyLines.map((_, idx) => (
        <Box key={`empty-${idx}`} minHeight={1}>
          <Text>{'\u00A0'}</Text>
        </Box>
      ))}
    </Box>
  );
};

// ---------------------------------------------------------------------------
// JOURNAL ITEM SUB-COMPONENT
// ---------------------------------------------------------------------------

interface JournalItemProps {
  journal: JournalFileInfo;
  isSelected: boolean;
  isToday: boolean;
}

const JournalItem: React.FC<JournalItemProps> = ({
  journal,
  isSelected,
  isToday,
}) => {
  // Format date for display
  const formattedDate = formatDate(journal.date);

  return (
    <Box>
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
};
