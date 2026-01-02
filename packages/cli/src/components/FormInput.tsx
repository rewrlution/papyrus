import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import React from 'react';

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mask?: string;
  focus?: boolean;
}

export function FormInput({
  label,
  value,
  onChange,
  placeholder,
  mask,
  focus = true,
}: FormInputProps) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text color="cyan" bold>
        {label}:
      </Text>
      <Box marginLeft={2}>
        <Text color="gray">{'> '}</Text>
        <TextInput
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          mask={mask}
          focus={focus}
        />
      </Box>
    </Box>
  );
}
