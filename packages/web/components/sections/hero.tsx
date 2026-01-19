'use client';

import { Copy, Check, Terminal } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

export function Hero() {
  const [copied, setCopied] = useState(false);
  const installCommand = 'npm i -g @rewrlution/papyrus-cli';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="flex items-center gap-2 mb-6">
        <Terminal className="h-10 w-10" />
        <h1 className="text-5xl font-bold tracking-tight">PAPYRUS</h1>
      </div>

      <p className="text-xl text-muted-foreground mb-2">
        AI-Powered Journaling for Developers
      </p>

      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        Capture your thoughts — right from your terminal
      </p>

      <div className="flex items-center gap-2 bg-muted rounded-lg p-2 mb-8">
        <code className="px-4 py-2 text-sm font-mono">{installCommand}</code>
        <Button variant="ghost" size="sm" onClick={copyToClipboard}>
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>

      <a
        href="https://www.npmjs.com/package/@rewrlution/papyrus-cli"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Button size="lg">View on npm</Button>
      </a>
    </section>
  );
}
