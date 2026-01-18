import { Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-12 px-4 border-t">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="font-bold text-lg mb-1">Papyrus</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered journaling for developers
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2">
            <h4 className="font-semibold text-sm">Support</h4>
            <a
              href="mailto:rewrlution@gmail.com"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              rewrlution@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Papyrus. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
