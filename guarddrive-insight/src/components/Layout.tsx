import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  showSession?: boolean;
  hideFooter?: boolean;
  pageTitle?: string;
}

export default function Layout({ children, showSession, hideFooter, pageTitle }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    document.title = pageTitle
      ? `${pageTitle} — GuardDrive`
      : 'GuardDrive — Fleet Safety Intelligence';
  }, [pageTitle]);

  // Scroll to #features after navigation from another page
  useEffect(() => {
    if (location.hash === '#features') {
      const el = document.getElementById('features');
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar showSession={showSession} />
      <main className="flex-1 pt-16">
        {children}
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}
