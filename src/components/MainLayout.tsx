import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Settings, BarChart3, Newspaper, Hash } from 'lucide-react';
import { Lock, Scroll, Archive, Home, Shield, LogOut, AlertTriangle, DoorOpen, Mail, Brain, Gavel, Trophy } from 'lucide-react';
import { CustomContextMenu } from './CustomContextMenu';
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
  { path: '/', label: 'Tableau', icon: BarChart3 },
  { path: '/feed', label: 'Actualités', icon: Newspaper },
  { path: '/channels', label: 'Canaux', icon: Hash },
  { path: '/messages', label: 'Messages', icon: Mail },
  { path: '/cipher', label: 'Chiffrement', icon: Lock },
  { path: '/leaderboard', label: 'Classement', icon: Trophy },
  { path: '/tribunal', label: 'Tribunal', icon: Gavel },
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
    <CustomContextMenu>
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-gold-dim/20" style={{
        background: 'linear-gradient(180deg, hsl(30 10% 3% / 0.95) 0%, hsl(30 10% 3% / 0.85) 100%)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
              <img 
                src={logo} 
                alt="L'Ordre" 
                className="w-8 h-8 sm:w-10 sm:h-10 transition-all duration-500 group-hover:lunar-glow"
              />
              <span className="font-heading text-xs sm:text-sm tracking-[0.2em] hidden lg:block text-gold-dim group-hover:text-gold transition-colors duration-300">
                L'ORDRE
              </span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-0.5 sm:gap-1 ml-2 overflow-x-auto scrollbar-none">
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
                    <span className="hidden lg:inline text-sm font-heading-text tracking-wider">
                      {item.label}
                    </span>
                    {isMessages && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-crimson-bright text-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}

              {/* Knowledge link */}
              {isGuardianSupreme && (
                <Link
                  to="/knowledge"
                  className={`nav-link flex items-center gap-2 ${location.pathname === '/knowledge' ? 'active' : ''}`}
                  style={{ color: location.pathname === '/knowledge' ? 'hsl(var(--mystic-purple))' : undefined }}
                >
                  <Brain className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm font-heading-text tracking-wider">
                    Savoir
                  </span>
                </Link>
              )}

              {/* Guardian link */}
              {isGuardianSupreme && (
                <Link
                  to="/guardian"
                  className={`nav-link flex items-center gap-2 ${location.pathname === '/guardian' ? 'active' : ''}`}
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden lg:inline text-sm font-heading-text tracking-wider">
                    Gardien
                  </span>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2 gap-2 text-xs font-heading-text tracking-wider text-gold-dim hover:text-gold">
                    <span className="hidden sm:inline">{profile?.pseudonym || 'Initié'}</span>
                    <span className="sm:hidden text-gold-dim">◆</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border-gold-dim/30">
                  <div className="px-3 py-2 text-xs text-gold-dim">
                    <span className="font-heading-text tracking-wider">{profile?.pseudonym}</span>
                    <span className="block text-[10px] capitalize text-muted-foreground mt-0.5">{profile?.grade}</span>
                  </div>
                  <DropdownMenuSeparator className="bg-gold-dim/20" />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                    <Settings className="w-4 h-4 text-gold-dim" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/report')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                    <AlertTriangle className="w-4 h-4 text-gold-dim" />
                    Signaler un membre
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/exit-request')} className="gap-2 cursor-pointer text-crimson-bright hover:text-crimson-bright">
                    <DoorOpen className="w-4 h-4" />
                    Quitter l'Ordre
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gold-dim/20" />
                  <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
        {/* Gold line accent */}
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(42 70% 50% / 0.3), transparent)' }} />
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-gold-dim/10" style={{
        background: 'linear-gradient(0deg, hsl(30 10% 3% / 0.95) 0%, hsl(30 10% 3% / 0.85) 100%)',
        backdropFilter: 'blur(16px)',
      }}>
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(42 70% 50% / 0.2), transparent)' }} />
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-center gap-4 text-xs text-gold-dim/40">
            <span className="font-heading-text tracking-[0.3em]">☽ L'ORDRE DES OMBRES ☽</span>
          </div>
        </div>
      </footer>
    </div>
    </CustomContextMenu>
  );
}
