import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuLabel,
} from '@/components/ui/context-menu';
import {
  BarChart3,
  Newspaper,
  Hash,
  Mail,
  Lock,
  Trophy,
  Gavel,
  Shield,
  Brain,
  Settings,
  AlertTriangle,
  DoorOpen,
  LogOut,
  Home,
  Copy,
  ExternalLink,
  BookOpen,
  Scroll,
  Archive,
  Medal,
  Eye,
  UserPlus,
  Moon,
  Sun,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CustomContextMenuProps {
  children: ReactNode;
}

export function CustomContextMenu({ children }: CustomContextMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, isGuardianSupreme, signOut } = useAuth();
  const { toast } = useToast();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Lien copié', description: 'Le lien a été copié dans le presse-papiers.' });
  };

  const handleCopyText = () => {
    const selection = window.getSelection()?.toString();
    if (selection) {
      navigator.clipboard.writeText(selection);
      toast({ title: 'Texte copié' });
    } else {
      toast({ title: 'Aucun texte sélectionné', variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full min-h-screen" asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-card border-gold-dim/30 backdrop-blur-xl">
        {/* Header */}
        <ContextMenuLabel className="flex items-center gap-2 text-gold-dim font-heading tracking-wider text-xs">
          <span>☽</span> L'ORDRE DES OMBRES <span>☽</span>
        </ContextMenuLabel>
        <ContextMenuSeparator className="bg-gold-dim/20" />

        {/* Navigation rapide */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2 text-muted-foreground hover:text-gold">
            <Home className="w-4 h-4 text-gold-dim" />
            Navigation rapide
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-card border-gold-dim/30">
            <ContextMenuItem onClick={() => navigate('/')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <BarChart3 className="w-4 h-4 text-gold-dim" /> Tableau de bord
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/feed')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Newspaper className="w-4 h-4 text-gold-dim" /> Fil d'actualité
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/channels')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Hash className="w-4 h-4 text-gold-dim" /> Canaux de groupe
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/messages')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Mail className="w-4 h-4 text-gold-dim" /> Messages privés
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/cipher')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Lock className="w-4 h-4 text-gold-dim" /> Chiffrement
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/leaderboard')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Trophy className="w-4 h-4 text-gold-dim" /> Classement
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/tribunal')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Gavel className="w-4 h-4 text-gold-dim" /> Tribunal
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-gold-dim/20" />
            <ContextMenuItem onClick={() => navigate('/doctrine')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Scroll className="w-4 h-4 text-gold-dim" /> Doctrine
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/archives')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Archive className="w-4 h-4 text-gold-dim" /> Archives
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/sanctuaire')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Eye className="w-4 h-4 text-gold-dim" /> Sanctuaire
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Outils de l'Ordre */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2 text-muted-foreground hover:text-gold">
            <BookOpen className="w-4 h-4 text-gold-dim" />
            Outils de l'Ordre
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-card border-gold-dim/30">
            <ContextMenuItem onClick={() => navigate('/cipher')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Lock className="w-4 h-4 text-gold-dim" /> Chiffrer un message
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Copy className="w-4 h-4 text-gold-dim" /> Copier le lien
            </ContextMenuItem>
            <ContextMenuItem onClick={handleCopyText} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <ExternalLink className="w-4 h-4 text-gold-dim" /> Copier la sélection
            </ContextMenuItem>
            <ContextMenuSeparator className="bg-gold-dim/20" />
            <ContextMenuItem onClick={() => navigate('/settings')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Settings className="w-4 h-4 text-gold-dim" /> Paramètres du profil
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        {/* Actions sur les membres */}
        <ContextMenuSub>
          <ContextMenuSubTrigger className="gap-2 text-muted-foreground hover:text-gold">
            <UserPlus className="w-4 h-4 text-gold-dim" />
            Actions membres
          </ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-52 bg-card border-gold-dim/30">
            <ContextMenuItem onClick={() => navigate('/messages')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Mail className="w-4 h-4 text-gold-dim" /> Envoyer un message
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/report')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <AlertTriangle className="w-4 h-4 text-gold-dim" /> Signaler un membre
            </ContextMenuItem>
            <ContextMenuItem onClick={() => navigate('/leaderboard')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
              <Trophy className="w-4 h-4 text-gold-dim" /> Voir le classement
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>

        <ContextMenuSeparator className="bg-gold-dim/20" />

        {/* Guardian actions */}
        {isGuardianSupreme && (
          <>
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 text-crimson-bright">
                <Shield className="w-4 h-4" />
                Actions du Gardien
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-56 bg-card border-gold-dim/30">
                <ContextMenuItem onClick={() => navigate('/guardian')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                  <Shield className="w-4 h-4 text-gold-dim" /> Panneau du Gardien
                </ContextMenuItem>
                <ContextMenuItem onClick={() => navigate('/knowledge')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                  <Brain className="w-4 h-4 text-mystic-purple" /> Le Savoir
                </ContextMenuItem>
                <ContextMenuSeparator className="bg-gold-dim/20" />
                <ContextMenuItem onClick={() => navigate('/guardian?tab=directory')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                  <UserPlus className="w-4 h-4 text-gold-dim" /> Annuaire des membres
                </ContextMenuItem>
                <ContextMenuItem onClick={() => navigate('/guardian?tab=badges')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                  <Medal className="w-4 h-4 text-gold-dim" /> Attribuer une médaille
                </ContextMenuItem>
                <ContextMenuItem onClick={() => navigate('/guardian?tab=reports')} className="gap-2 cursor-pointer text-muted-foreground hover:text-gold">
                  <AlertTriangle className="w-4 h-4 text-gold-dim" /> Signalements
                </ContextMenuItem>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator className="bg-gold-dim/20" />
          </>
        )}

        {/* Profil & Déconnexion */}
        <ContextMenuItem className="gap-2 text-xs text-gold-dim/60 pointer-events-none">
          <span>◆</span> {profile?.pseudonym} — {profile?.grade}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => navigate('/exit-request')} className="gap-2 cursor-pointer text-crimson-bright hover:text-crimson-bright">
          <DoorOpen className="w-4 h-4" /> Quitter l'Ordre
        </ContextMenuItem>
        <ContextMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer text-muted-foreground hover:text-foreground">
          <LogOut className="w-4 h-4" /> Déconnexion
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}