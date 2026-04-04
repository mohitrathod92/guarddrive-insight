import { Shield, Menu, X, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const navLinks = [
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logOut();
    navigate('/');
    setUserMenuOpen(false);
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gd-red" />
          <span className="font-heading text-lg font-bold text-foreground">DriveX</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label === 'Live Demo' && user 
                ? (user.displayName || user.email?.split('@')[0]) 
                : l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden items-center gap-3 md:flex">
          {showSession && (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-gd-green pulse-green" />
              Active Session
            </span>
          )}

          {user ? (
            /* Logged in — show avatar + dropdown */
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-all hover:border-muted-foreground/30"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gd-red/20 text-[10px] font-bold text-gd-red">
                  {initials}
                </div>
                <span className="max-w-[100px] truncate text-xs">
                  {user.displayName ?? user.email?.split('@')[0]}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-10 z-50 w-48 rounded-xl border border-border bg-card shadow-xl">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {user.displayName ?? 'Fleet Manager'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-gd-red/10 hover:text-gd-red transition-colors"
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in — show Get Started */
            <Link
              to="/login"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Get Started
            </Link>
          )}
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
              {l.label === 'Live Demo' && user 
                ? (user.displayName || user.email?.split('@')[0]) 
                : l.label}
            </Link>
          ))}
          {user ? (
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-gd-red/30 bg-gd-red/10 px-5 py-2 text-sm font-medium text-gd-red"
            >
              <LogOut size={14} /> Sign Out
            </button>
          ) : (
            <Link
              to="/login"
              className="mt-2 block rounded-full bg-foreground px-5 py-2 text-center text-sm font-medium text-background"
              onClick={() => setMobileOpen(false)}
            >
              Get Started
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
