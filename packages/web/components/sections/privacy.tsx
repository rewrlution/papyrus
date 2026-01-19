import { Lock, Server, Trash2 } from 'lucide-react';

const privacyPoints = [
  {
    icon: Lock,
    title: 'Encrypted at Rest',
    description:
      'All journal content is encrypted using AES-256-GCM on our servers before storage. The plaintext content is never persisted.',
  },
  {
    icon: Server,
    title: 'Local-First Storage',
    description:
      'Journals are stored locally in markdown format. Cloud sync is optional and always encrypted.',
  },
  {
    icon: Trash2,
    title: 'Data Deletion',
    description:
      'You can request deletion of your account and all associated data at any time by contacting support.',
  },
];

export function Privacy() {
  return (
    <section className="py-20 px-4 bg-muted/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Privacy & Security
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Your journal is personal. We built Papyrus with privacy as a core
          principle.
        </p>

        <div className="space-y-8">
          {privacyPoints.map((point) => (
            <div key={point.title} className="flex gap-4">
              <div className="shrink-0">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <point.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">{point.title}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
