import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Scroll, Archive, Home, Shield, LogOut, AlertTriangle, DoorOpen, Mail, Brain } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import logo from '@/assets/logo-ordre.png';

interface MainLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/', label: 'Sanctuaire', icon: Home },
  { path: '/cipher', label: 'Chiffrement', icon: Lock },
  { path: '/doctrine', label: 'Doctrine', icon: Scroll },
  { path: '/archives', label: 'Archives', icon: Archive },
  { path: '/messages', label: 'Messages', icon: Mail },
];

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, isGuardianSupreme, signOut } = useAuth();
  const { unreadCount } = useUnreadMessages();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

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
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const isMessages = item.path === '/messages';
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link flex items-center gap-2 relative ${isActive ? 'active' : ''}`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="hidden md:inline text-sm font-heading tracking-wide">
                      {item.label}
                    </span>
                    {isMessages && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Knowledge link - for Archontes and Guardian */}
              {isGuardianSupreme && (
                <Link
                  to="/knowledge"
                  className={`nav-link flex items-center gap-2 text-purple-400 ${location.pathname === '/knowledge' ? 'active' : ''}`}
                >
                  <Brain className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-heading tracking-wide">
                    Savoir
                  </span>
                </Link>
              )}

              {/* Guardian link */}
              {isGuardianSupreme && (
                <Link
                  to="/guardian"
                  className={`nav-link flex items-center gap-2 text-mystic-gold ${location.pathname === '/guardian' ? 'active' : ''}`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden md:inline text-sm font-heading tracking-wide">
                    Gardien
                  </span>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 gap-2 text-xs font-heading">
                    <span className="hidden sm:inline">{profile?.pseudonym || 'Initié'}</span>
                    <span className="sm:hidden">☽</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-border">
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {profile?.pseudonym}
                    <span className="block text-[10px] capitalize">{profile?.grade}</span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/report')} className="gap-2 cursor-pointer">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Signaler un membre
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/exit-request')} className="gap-2 cursor-pointer text-red-400">
                    <DoorOpen className="w-4 h-4" />
                    Quitter l'Ordre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
