import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const pages = [
  { label: 'Dashboard', href: '/' },
  { label: 'Live Monitor', href: '/monitor' },
  { label: 'Fleet Map', href: '/fleet' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Drivers', href: '/drivers' },
];

const legal = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use', href: '#' },
  { label: 'Support', href: '#' },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/60 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gd-red/10">
                <Shield className="h-4 w-4 text-gd-red" />
              </div>
              <span className="font-heading text-base font-bold text-foreground">GuardDrive</span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Real-time AI fleet safety monitoring. Detecting fatigue and rash driving before it becomes a tragedy.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pages</p>
            <ul className="space-y-2">
              {pages.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Company</p>
            <ul className="space-y-2">
              {legal.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} GuardDrive. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built for safer roads. Powered by AI.
          </p>
        </div>
      </div>
    </footer>
  );
}
