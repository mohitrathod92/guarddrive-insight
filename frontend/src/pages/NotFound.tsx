import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Shield, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "404 — Page Not Found | GuardDrive";
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gd-red/10 border border-gd-red/20">
            <Shield className="h-7 w-7 text-gd-red" />
          </div>
        </div>

        {/* 404 */}
        <h1 className="font-heading text-8xl font-bold text-foreground leading-none">
          4<span className="text-gd-red">0</span>4
        </h1>

        <h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">
          Page not found
        </h2>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The route <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-foreground">{location.pathname}</code> doesn't exist.
          You may have mistyped the URL or the page has been moved.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gd-red px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Home size={16} />
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {[
            { label: 'Live Monitor', href: '/monitor' },
            { label: 'Fleet Map', href: '/fleet' },
            { label: 'Analytics', href: '/analytics' },
            { label: 'Drivers', href: '/drivers' },
          ].map((l) => (
            <Link
              key={l.label}
              to={l.href}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
