import { Shield, Menu, X, LayoutDashboard, Map, BarChart2, Users, Activity, Sparkles } from 'lucide-react';
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
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-border/50 bg-background/70 backdrop-blur-xl shadow-[0_4px_30px_rgba(0,0,0,0.4)] py-2'
            : 'border-b border-transparent bg-background/40 backdrop-blur-md py-4'
        }`}
      >
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 md:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-gd-red/20 to-gd-red/5 border border-gd-red/30 shadow-[0_0_15px_rgba(255,0,0,0.15)] transition-all duration-500 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(255,0,0,0.3)] group-hover:border-gd-red/50">
              <Shield className="h-5 w-5 text-gd-red transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 rounded-xl bg-gd-red/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-xl font-bold tracking-tight text-foreground leading-none group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/70 transition-all duration-300">
                GuardDrive
              </span>
              <span className="text-[10px] font-semibold text-gd-red uppercase tracking-[0.2em] mt-1 ml-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                Insight
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 md:flex bg-surface/40 backdrop-blur-md border border-white/5 rounded-full px-2 py-1.5 shadow-inner">
            {navLinks.map((l) => (
              <NavLink
                key={l.label}
                to={l.href}
                end={l.href === '/'}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10'
                      : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <l.icon
                      className={`h-4 w-4 transition-all duration-300 ${
                        isActive ? 'text-gd-red scale-110' : 'text-muted-foreground group-hover:text-white group-hover:scale-110'
                      }`}
                    />
                    {l.label}
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 w-4 h-0.5 bg-gd-red rounded-full -translate-x-1/2 shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* Right side — session + CTA */}
          <div className="hidden items-center gap-4 md:flex">
            {showSession && (
              <div className="flex items-center gap-2 rounded-full border border-gd-green/20 bg-gd-green/5 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gd-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gd-green"></span>
                </span>
                <span className="text-xs font-medium text-gd-green tracking-wide">Live Session</span>
              </div>
            )}
            <Link
              to="/monitor"
              className="relative overflow-hidden rounded-full bg-gd-red px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 shadow-[0_0_15px_rgba(255,0,0,0.2)] hover:shadow-[0_0_25px_rgba(255,0,0,0.5)] hover:scale-105 active:scale-95 flex items-center gap-2 group border border-gd-red/50"
            >
              <Sparkles className="h-4 w-4 relative z-10 transition-transform duration-500 group-hover:rotate-12" />
              <span className="relative z-10">Live Monitor</span>
              {/* Shimmer inner effect */}
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="rounded-xl border border-white/5 bg-surface/50 p-2.5 text-foreground hover:bg-white/10 active:scale-95 transition-all duration-300 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu — slide down */}
        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out md:hidden ${
            mobileOpen ? 'max-h-[26rem] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-surface/80 backdrop-blur-xl p-4 shadow-2xl">
            <div className="flex flex-col gap-1">
              {navLinks.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.href}
                  end={l.href === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'text-white bg-white/10 border border-white/5 shadow-sm'
                        : 'text-muted-foreground hover:text-white hover:bg-white/5 border border-transparent'
                    }`
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  {({ isActive }) => (
                    <>
                      <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-gd-red/10 text-gd-red' : 'bg-surface text-muted-foreground'}`}>
                        <l.icon className="h-5 w-5" />
                      </div>
                      {l.label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            
            <div className="mt-4 border-t border-white/10 pt-4">
              {showSession && (
                <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-gd-green/20 bg-gd-green/5 px-4 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gd-green opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gd-green"></span>
                  </span>
                  <span className="text-sm font-medium text-gd-green tracking-wide">Live Session Active</span>
                </div>
              )}
              <Link
                to="/monitor"
                className="flex items-center justify-center gap-2 rounded-xl bg-gd-red px-5 py-3.5 text-center text-sm font-bold text-white shadow-[0_0_15px_rgba(255,0,0,0.2)] active:scale-95 transition-all"
                onClick={() => setMobileOpen(false)}
              >
                <Sparkles className="h-4 w-4" />
                Live Monitor
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from going under the fixed navbar */}
      <div className="h-20" />
    </>
  );
}
