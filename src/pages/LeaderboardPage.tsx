import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Trophy, Award, Crown, Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MemberRank {
  id: string;
  pseudonym: string;
  grade: string;
  joined_at: string;
  badgeCount: number;
}

const gradeOrder = ['novice', 'apprenti', 'compagnon', 'maitre', 'sage', 'oracle'];
const gradePoints: Record<string, number> = {
  novice: 10, apprenti: 25, compagnon: 50, maitre: 100, sage: 200, oracle: 500,
};

const podiumColors = [
  'from-yellow-500/20 to-yellow-700/5 border-yellow-500/40',
  'from-gray-400/20 to-gray-600/5 border-gray-400/40',
  'from-amber-700/20 to-amber-900/5 border-amber-700/40',
];
const podiumIcons = ['🥇', '🥈', '🥉'];

const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<MemberRank[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const [profilesRes, badgesRes] = await Promise.all([
        supabase.from('profiles').select('id, pseudonym, grade, joined_at').eq('status', 'active'),
        supabase.from('user_badges').select('user_id'),
      ]);

      if (profilesRes.data) {
        const badgeCounts = new Map<string, number>();
        badgesRes.data?.forEach(b => {
          badgeCounts.set(b.user_id, (badgeCounts.get(b.user_id) || 0) + 1);
        });

        const ranked = profilesRes.data.map(p => ({
          ...p,
          badgeCount: badgeCounts.get(p.id) || 0,
        })).sort((a, b) => {
          const scoreA = (gradePoints[a.grade] || 0) + a.badgeCount * 5;
          const scoreB = (gradePoints[b.grade] || 0) + b.badgeCount * 5;
          return scoreB - scoreA;
        });

        setMembers(ranked);
      }
      setIsLoading(false);
    };

    fetchLeaderboard();
  }, []);

  const getScore = (m: MemberRank) => (gradePoints[m.grade] || 0) + m.badgeCount * 5;

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="font-heading text-2xl md:text-3xl tracking-[0.15em] text-gold mb-2">
            <Trophy className="w-6 h-6 inline-block mr-2 mb-1" />
            CLASSEMENT
          </h1>
          <p className="text-muted-foreground text-sm">Les plus influents de l'Ordre</p>
        </motion.div>

        {/* Podium */}
        {members.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-end justify-center gap-4 mb-8"
          >
            {[1, 0, 2].map((rank) => {
              const m = members[rank];
              const height = rank === 0 ? 'h-32' : rank === 1 ? 'h-24' : 'h-20';
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + rank * 0.15 }}
                  className="text-center"
                >
                  <div className={`mb-2 ${m.id === user?.id ? 'ring-2 ring-gold rounded-full' : ''}`}>
                    <Avatar className={`w-12 h-12 mx-auto border-2 ${rank === 0 ? 'border-yellow-500 w-16 h-16' : rank === 1 ? 'border-gray-400' : 'border-amber-700'}`}>
                      <AvatarFallback className="bg-secondary text-foreground font-heading text-sm">
                        {getInitials(m.pseudonym)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <p className="text-xs font-heading-text text-foreground truncate max-w-[80px]">{m.pseudonym}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{m.grade}</p>
                  <div className={`${height} w-20 mt-2 rounded-t-lg border bg-gradient-to-b ${podiumColors[rank]} flex items-center justify-center`}>
                    <span className="text-2xl">{podiumIcons[rank]}</span>
                  </div>
                  <p className="text-xs text-gold mt-1 font-heading">{getScore(m)} pts</p>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Full List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="ritual-card"
        >
          <ScrollArea className="h-[400px]">
            <div className="divide-y divide-gold-dim/10">
              {members.map((m, i) => (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 px-4 py-3 ${m.id === user?.id ? 'bg-gold/5' : ''}`}
                >
                  <span className={`w-8 text-center font-heading text-sm ${i < 3 ? 'text-gold' : 'text-muted-foreground'}`}>
                    {i < 3 ? podiumIcons[i] : `#${i + 1}`}
                  </span>
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-foreground text-xs">
                      {getInitials(m.pseudonym)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading-text text-foreground truncate flex items-center gap-1">
                      {m.pseudonym}
                      {m.id === user?.id && <span className="text-[10px] text-gold">(vous)</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground capitalize">{m.grade}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {m.badgeCount > 0 && (
                      <span className="flex items-center gap-0.5 text-ritual-amber">
                        <Award className="w-3 h-3" /> {m.badgeCount}
                      </span>
                    )}
                    <span className="text-gold font-heading">{getScore(m)}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default LeaderboardPage;
