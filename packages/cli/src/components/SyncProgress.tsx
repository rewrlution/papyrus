import { Box, Text, useApp } from 'ink';
import React, { useState, useEffect } from 'react';

import { performSync, type SyncResult } from '../lib/sync/sync-engine.js';

import { ColdStartAwareSpinner } from './ColdStart.js';

type SyncStatus = 'syncing' | 'done' | 'error';

export const SyncProgress = () => {
  const { exit } = useApp();
  const [status, setStatus] = useState<SyncStatus>('syncing');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');
  const [progressMessages, setProgressMessages] = useState<string[]>([]);

  useEffect(() => {
    performSync((message) => {
      // Show progress messages in real-time
      setProgressMessages((prev) => [...prev, message]);
    })
      .then((syncResult) => {
        setResult(syncResult);
        setStatus('done');
        setTimeout(() => exit(), 1000);
      })
      .catch((err) => {
        setError(err.message || 'Sync failed');
        setStatus('error');
        setTimeout(() => exit(err), 2000);
      });
  }, [exit]);

  if (status === 'syncing') {
    return (
      <Box flexDirection="column">
        <ColdStartAwareSpinner message="Syncing journals..." />
        {/* Show progress messages as they come in */}
        {progressMessages.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {progressMessages.slice(-5).map((msg, idx) => (
              <Text key={idx} dimColor>
                {msg}
              </Text>
            ))}
          </Box>
        )}
      </Box>
    );
  }

  if (status === 'error') {
    return (
      <Box flexDirection="column">
        <Text color="red">✗ Sync failed</Text>
        <Text color="red">{error}</Text>
      </Box>
    );
  }

  if (status === 'done' && result) {
    const { uploaded, downloaded, conflicts } = result;
    const total = uploaded + downloaded + conflicts;

    // Nothing to sync
    if (total === 0) {
      return (
        <Box flexDirection="column">
          <Text color="green">✓ Everything is in sync</Text>
          <Text dimColor>No changes to upload or download</Text>
        </Box>
      );
    }

    // Show detailed results
    return (
      <Box flexDirection="column">
        <Text color="green">✓ Sync complete</Text>
        <Box flexDirection="column" marginTop={1}>
          {uploaded > 0 && (
            <Text>
              ↑ <Text color="cyan">{uploaded}</Text> uploaded
            </Text>
          )}
          {downloaded > 0 && (
            <Text>
              ↓ <Text color="cyan">{downloaded}</Text> downloaded
            </Text>
          )}
          {conflicts > 0 && (
            <Text>
              ⚠️ <Text color="yellow">{conflicts}</Text> conflict
              {conflicts > 1 ? 's' : ''} resolved
            </Text>
          )}
        </Box>
      </Box>
    );
  }

  return null;
};
