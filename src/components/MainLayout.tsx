import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Lock, Scroll, Archive, Home } from 'lucide-react';
import logo from '@/assets/logo-ordre.png';

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Sanctuaire', icon: Home },
  { path: '/cipher', label: 'Chiffrement', icon: Lock },
  { path: '/doctrine', label: 'Doctrine', icon: Scroll },
  { path: '/archives', label: 'Archives', icon: Archive },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="L'Ordre" 
                className="w-10 h-10 transition-all duration-300 group-hover:lunar-glow"
              />
              <span className="font-heading text-lg tracking-widest hidden sm:block">
                L'ORDRE
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link flex items-center gap-2 ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden md:inline text-sm font-heading tracking-wide">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-background/80 backdrop-blur-md border-t border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/50">
            <span className="font-heading tracking-widest">☽ L'ORDRE DES OMBRES ☽</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
