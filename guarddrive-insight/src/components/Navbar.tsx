import { Shield, Menu, X, LayoutDashboard, Map, BarChart2, Users, Activity } from 'lucide-react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

const navLinks = [
  { label: 'Dashboard',  href: '/',          icon: LayoutDashboard },
  { label: 'Monitor',    href: '/monitor',   icon: Activity },
  { label: 'Fleet',      href: '/fleet',     icon: Map },
  { label: 'Analytics',  href: '/analytics', icon: BarChart2 },
  { label: 'Drivers',    href: '/drivers',   icon: Users },
];

interface NavbarProps {
  showSession?: boolean;
}

export default function Navbar({ showSession }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Elevate navbar on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleFeaturesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/#features');
    }
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'border-border bg-background/95 backdrop-blur-xl shadow-lg shadow-black/20'
          : 'border-transparent bg-background/80 backdrop-blur-xl'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gd-red/10 transition-colors group-hover:bg-gd-red/20">
            <Shield className="h-4 w-4 text-gd-red" />
          </div>
          <span className="font-heading text-lg font-bold text-foreground">GuardDrive</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => {
            const isFeatures = l.href === '/';
            if (isFeatures) {
              return (
                <NavLink
                  key={l.label}
                  to={l.href}
                  end
                  className={({ isActive }) =>
                    `relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-foreground bg-muted'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    }`
                  }
                >
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                </NavLink>
              );
            }
            return (
              <NavLink
                key={l.label}
                to={l.href}
                className={({ isActive }) =>
                  `relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`
                }
              >
                <l.icon className="h-3.5 w-3.5" />
                {l.label}
              </NavLink>
            );
          })}
        </div>

        {/* Right side — session + CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {showSession && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-gd-green pulse-green" />
              Live Session
            </span>
          )}
          <Link
            to="/monitor"
            className="rounded-full bg-gd-red px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Live Monitor
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-lg p-2 text-foreground hover:bg-muted md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu — slide down */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="border-t border-border bg-background px-4 pb-4 pt-2">
          {navLinks.map((l) => (
            <NavLink
              key={l.label}
              to={l.href}
              end={l.href === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-foreground bg-muted'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`
              }
              onClick={() => setMobileOpen(false)}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
          <div className="mt-3 border-t border-border pt-3">
            {showSession && (
              <p className="mb-2 flex items-center gap-2 px-3 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-gd-green pulse-green" />
                Live Session Active
              </p>
            )}
            <Link
              to="/monitor"
              className="block rounded-full bg-gd-red px-5 py-2.5 text-center text-sm font-medium text-white"
              onClick={() => setMobileOpen(false)}
            >
              Live Monitor
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
