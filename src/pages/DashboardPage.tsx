import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, Award, Calendar, TrendingUp, Shield, 
  ChevronRight, Star, Clock, Users 
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  author_id: string;
  activity_type: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  rarity: string;
}

interface UserBadge {
  id: string;
  badge_id: string;
  awarded_at: string;
  badges: Badge;
}

const gradeOrder = ['novice', 'apprenti', 'compagnon', 'maitre', 'sage', 'oracle'];

const rarityColors: Record<string, string> = {
  common: 'border-muted-foreground/30',
  uncommon: 'border-emerald-500/50',
  rare: 'border-blue-500/50',
  epic: 'border-purple-500/50',
  legendary: 'border-gold/50 lunar-glow',
};

const DashboardPage = () => {
  const { user, profile, isGuardianSupreme } = useAuth();
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [messageCount, setMessageCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchAll = async () => {
      const [feedRes, badgesRes, msgRes, membersRes] = await Promise.all([
        supabase.from('activity_feed').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }).limit(10),
        supabase.from('user_badges').select('*, badges(*)').eq('user_id', user.id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      if (feedRes.data) setFeed(feedRes.data as unknown as ActivityItem[]);
      if (badgesRes.data) setBadges(badgesRes.data as unknown as UserBadge[]);
      if (msgRes.count !== null) setMessageCount(msgRes.count);
      if (membersRes.count !== null) setMemberCount(membersRes.count);
    };

    fetchAll();
  }, [user]);

  const gradeIndex = gradeOrder.indexOf(profile?.grade || 'novice');
  const gradeProgress = ((gradeIndex + 1) / gradeOrder.length) * 100;

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 3600000);
    if (diff < 1) return 'À l\'instant';
    if (diff < 24) return `Il y a ${diff}h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const activityIcon = (type: string) => {
    switch (type) {
      case 'announcement': return '📜';
      case 'event': return '⚔️';
      case 'promotion': return '⬆️';
      case 'judgment': return '⚖️';
      default: return '◆';
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="font-heading text-2xl md:text-3xl tracking-[0.15em] text-gold mb-2">
            TABLEAU DE BORD
          </h1>
          <p className="text-muted-foreground text-sm">
            Bienvenue, <span className="text-gold font-heading-text">{profile?.pseudonym}</span>
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { icon: Star, label: 'Grade', value: profile?.grade || 'Novice', color: 'text-gold' },
            { icon: Award, label: 'Médailles', value: badges.length.toString(), color: 'text-ritual-amber' },
            { icon: MessageCircle, label: 'Messages', value: messageCount.toString(), color: 'text-ethereal-blue' },
            { icon: Users, label: 'Membres', value: memberCount.toString(), color: 'text-mystic-purple' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="ritual-card p-4 text-center stat-card-glow"
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-lg font-heading text-foreground capitalize">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Progression */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="ritual-card p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm tracking-[0.1em] text-gold-dim flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> PROGRESSION
            </h2>
            <span className="text-xs text-muted-foreground capitalize">
              {profile?.grade} → {gradeOrder[Math.min(gradeIndex + 1, gradeOrder.length - 1)]}
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, hsl(var(--gold-dim)), hsl(var(--gold)))' }}
              initial={{ width: 0 }}
              animate={{ width: `${gradeProgress}%` }}
              transition={{ duration: 1, delay: 0.7 }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {gradeOrder.map((g, i) => (
              <span key={g} className={`text-[9px] capitalize ${i <= gradeIndex ? 'text-gold' : 'text-muted-foreground/40'}`}>
                {g}
              </span>
            ))}
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Médailles */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="ritual-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm tracking-[0.1em] text-gold-dim flex items-center gap-2">
                <Award className="w-4 h-4" /> MES MÉDAILLES
              </h2>
              <Link to="/leaderboard" className="text-xs text-gold-dim hover:text-gold flex items-center gap-1">
                Classement <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {badges.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-4">
                Aucune médaille obtenue. Vos actions déterminent vos récompenses.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {badges.map((ub) => (
                  <div
                    key={ub.id}
                    className={`text-center p-2 rounded-lg border ${rarityColors[ub.badges.rarity] || 'border-muted'} bg-secondary/30`}
                    title={ub.badges.name}
                  >
                    <span className="text-2xl block">{ub.badges.icon}</span>
                    <span className="text-[9px] text-muted-foreground mt-1 block truncate">{ub.badges.name}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Fil d'actualité */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="ritual-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-sm tracking-[0.1em] text-gold-dim flex items-center gap-2">
                <Calendar className="w-4 h-4" /> FIL D'ACTUALITÉ
              </h2>
              <Link to="/feed" className="text-xs text-gold-dim hover:text-gold flex items-center gap-1">
                Tout voir <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <ScrollArea className="h-[200px]">
              {feed.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  Aucune activité récente.
                </p>
              ) : (
                <div className="space-y-3">
                  {feed.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border border-gold-dim/10 bg-secondary/20 ${item.is_pinned ? 'border-gold/30' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm mt-0.5">{activityIcon(item.activity_type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-heading-text text-foreground">
                            {item.is_pinned && <span className="text-gold mr-1">📌</span>}
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.content}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatDate(item.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {[
            { to: '/messages', icon: MessageCircle, label: 'Messages', ornament: '💬' },
            { to: '/channels', icon: Users, label: 'Canaux', ornament: '📡' },
            { to: '/cipher', icon: Shield, label: 'Chiffrement', ornament: '🔐' },
            { to: '/leaderboard', icon: TrendingUp, label: 'Classement', ornament: '🏆' },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="ritual-card p-4 text-center group hover:lunar-glow transition-all"
            >
              <span className="text-lg block mb-1">{link.ornament}</span>
              <span className="text-xs font-heading-text tracking-wider text-muted-foreground group-hover:text-gold transition-colors">
                {link.label}
              </span>
            </Link>
          ))}
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default DashboardPage;
