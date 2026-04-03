import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10">
      <div className="container mx-auto flex flex-col items-center justify-between gap-6 px-4 md:flex-row">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gd-red" />
          <span className="font-heading text-sm font-bold text-foreground">GuardDrive</span>
        </div>
        <div className="flex gap-6">
          {['Dashboard', 'Fleet', 'Analytics', 'Docs'].map((l) => (
            <Link key={l} to="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l}
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} GuardDrive. All rights reserved.</p>
      </div>
    </footer>
  );
}
