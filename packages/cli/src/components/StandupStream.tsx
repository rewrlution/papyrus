import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { useState, useEffect } from 'react';

import {
  StandupStreamEvent,
  UsageInfo,
  StandupRequest,
} from '@rewrlution/papyrus-shared';

import { sse } from '../lib/api/index.js';

export interface StandupStreamProps extends StandupRequest {
  onComplete: () => void;
}

export function StandupStream({
  date,
  from,
  to,
  onComplete,
}: StandupStreamProps) {
  const [status, setStatus] = useState<
    'thinking' | 'streaming' | 'done' | 'error'
  >('thinking');
  const [thinkingMessage, setThinkingMessage] = useState('');
  const [content, setContent] = useState('');
  const [journalDate, setJournalDate] = useState('');
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const streamStandup = async () => {
      try {
        await sse.generateStandup(
          { date, from, to },
          (event: StandupStreamEvent) => {
            if (!isMounted) return;

            switch (event.type) {
              case 'thinking':
                setThinkingMessage(event.message);
                setStatus('thinking');
                break;

              case 'content':
                setStatus('streaming');
                // Append new text chunk
                setContent((prev) => prev + event.text);
                break;

              case 'done':
                setStatus('done');
                setJournalDate(event.journal_date);
                setUsage(event.usage);
                setTimeout(() => {
                  if (isMounted) onComplete();
                }, 100);
                break;

              case 'error':
                setStatus('error');
                setErrorMessage(event.message);
                setTimeout(() => {
                  if (isMounted) onComplete();
                }, 2000);
                break;
            }
          }
        );
      } catch (err) {
        if (!isMounted) return;
        setStatus('error');
        setErrorMessage(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        setTimeout(() => {
          if (isMounted) onComplete();
        }, 2000);
      }
    };

    streamStandup();

    return () => {
      isMounted = false;
    };
  }, [date, from, to, onComplete]);

  // Render based on status
  if (status === 'thinking') {
    return (
      <Box flexDirection="column">
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {thinkingMessage || 'Generating standup notes...'}</Text>
        </Box>
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ Error: {errorMessage}</Text>
      </Box>
    );
  }

  if (status === 'streaming' || status === 'done') {
    return (
      <Box flexDirection="column">
        {/* Show content as it streams */}
        <Text>{content}</Text>

        {/* Show completion status */}
        {status === 'done' && (
          <Box flexDirection="column" marginTop={1}>
            <Text color="green">✓ Done!</Text>
            {usage && (
              <Box marginTop={1}>
                <Text dimColor>
                  Journal: {journalDate} •{' '}
                  {usage.tier === 'free' ? 'Free tier' : 'Premium'}{' '}
                  {usage.used !== null && usage.limit !== null && (
                    <>
                      ({usage.used}/{usage.limit} requests this month)
                    </>
                  )}
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  }

  return null;
}
