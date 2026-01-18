import {
  Terminal,
  Cloud,
  Lock,
  Sparkles,
  Calendar,
  Keyboard,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const features = [
  {
    icon: Terminal,
    title: 'Terminal-First',
    description:
      'Write journal entries in your favorite editor (vim, nano, VS Code) without leaving the terminal.',
  },
  {
    icon: Calendar,
    title: 'Date-Based Organization',
    description:
      'Entries organized by date. Easily browse and search through your journal history.',
  },
  {
    icon: Keyboard,
    title: 'Vim-Style Navigation',
    description:
      'Navigate your journals with familiar keyboard shortcuts (j/k, g/G, and more).',
  },
  {
    icon: Cloud,
    title: 'Cloud Sync',
    description:
      'Sync journals across all your devices. Your entries are always available wherever you code.',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description:
      'Your journals are encrypted at rest. Only you can read your entries.',
  },
  {
    icon: Sparkles,
    title: 'AI Standup Notes',
    description:
      'Generate standup summaries from your journal entries with a single command.',
  },
];

export function Features() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">Features</h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Everything you need to maintain a developer journal, designed for the
          command line.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
