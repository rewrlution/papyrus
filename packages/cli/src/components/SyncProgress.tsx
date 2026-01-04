import { Box, Text, useApp } from 'ink';
import React, { useState, useEffect } from 'react';

import { performSync, type SyncResult } from '../lib/sync/sync-engine.js';

import { ColdStartAwareSpinner } from './ColdStart.js';

export const SyncProgress = () => {
  const { exit } = useApp();
  const [status, setStatus] = useState<'syncing' | 'done' | 'error'>('syncing');
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    performSync((_message) => {
      // progress messages could be displayed here in future
      // for mvp, just show the spinner
    })
      .then((syncResult) => {
        setResult(syncResult);
        setStatus('done');
        setTimeout(() => exit(), 1000);
      })
      .catch((err) => {
        setError(err.message || 'Sync failed');
        setStatus('error');
        setTimeout(() => exit(err), 1000);
      });
  }, [exit]);

  if (status === 'syncing') {
    return (
      <Box>
        <ColdStartAwareSpinner message="Syncning journals..." />
      </Box>
    );
  }

  if (status === 'error') {
    return <Text color="red">✗ {error}</Text>;
  }

  if (status === 'done' && result) {
    return (
      <Box flexDirection="column">
        <Text color="green">
          ✓ Sync complete: {result.uploaded} uploaded, {result.downloaded}{' '}
          downloaded
        </Text>
      </Box>
    );
  }

  return null;
};
