import { Text } from 'ink';
import Spinner from 'ink-spinner';
import React, { useState, useEffect } from 'react';

interface ColdStartAwareSpinnerProps {
  message: string;
}

export const ColdStartAwareSpinner: React.FC<ColdStartAwareSpinnerProps> = ({
  message,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (elapsed >= 5 && elapsed < 15) {
      setCurrentMessage('Waking up the server (this may take a moment)...');
    } else if (elapsed > 15) {
      setCurrentMessage(
        'Server is starting up (free tier cold start may take up to 1 min)...'
      );
    }
  }, [elapsed]);

  return (
    <Text>
      <Text color="green">
        <Spinner type="dots" />
      </Text>{' '}
      {currentMessage}
      {elapsed >= 5 && <Text color="gray">({elapsed}s)</Text>}
    </Text>
  );
};
