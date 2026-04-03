import { Shield, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navLinks = [
  { label: 'Features', href: '/#features' },
  { label: 'Fleet', href: '/fleet' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Over-Speeding', href: '/overspeeding' },
  { label: 'Rash Driving', href: '/rashdriving' },
  { label: 'Live Demo', href: '/monitor' },
];

interface NavbarProps {
  showSession?: boolean;
}

export default function Navbar({ showSession }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gd-red" />
          <span className="font-heading text-lg font-bold text-foreground">GuardDrive</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {showSession && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-gd-green pulse-green" />
              Active Session
            </span>
          )}
          <Link
            to="/monitor"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="block py-3 text-sm text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/monitor"
            className="mt-2 block rounded-full bg-foreground px-5 py-2 text-center text-sm font-medium text-background"
            onClick={() => setMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
