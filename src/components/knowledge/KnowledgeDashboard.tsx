import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Users, Gavel, Calendar, BookOpen, 
  AlertTriangle, CheckCircle, Clock, TrendingUp,
  Eye, Shield, Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  totalFiles: number;
  internalFiles: number;
  externalFiles: number;
  sealedFiles: number;
  totalOpinions: number;
  pendingOpinions: number;
  totalJudgments: number;
  recentJudgments: number;
  totalEvents: number;
  recentEvents: number;
  totalRules: number;
  activeRules: number;
  pendingTasks: number;
  pendingRequests: number;
  alertState: string;
}

export function KnowledgeDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['knowledge-dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();

      const [
        filesResult,
        opinionsResult,
        judgmentsResult,
        eventsResult,
        rulesResult,
        tasksResult,
        requestsResult,
        alertResult
      ] = await Promise.all([
        supabase.from('knowledge_files').select('file_type, is_sealed'),
        supabase.from('council_opinions').select('status'),
        supabase.from('judgments').select('created_at'),
        supabase.from('events_registry').select('created_at'),
        supabase.from('living_rules').select('is_active'),
        supabase.from('knowledge_tasks').select('status'),
        supabase.from('council_requests').select('status'),
        supabase.from('system_state').select('alert_state').order('changed_at', { ascending: false }).limit(1)
      ]);

      const files = filesResult.data || [];
      const opinions = opinionsResult.data || [];
      const judgments = judgmentsResult.data || [];
      const events = eventsResult.data || [];
      const rules = rulesResult.data || [];
      const tasks = tasksResult.data || [];
      const requests = requestsResult.data || [];

      return {
        totalFiles: files.length,
        internalFiles: files.filter(f => f.file_type === 'internal').length,
        externalFiles: files.filter(f => f.file_type === 'external').length,
        sealedFiles: files.filter(f => f.is_sealed).length,
        totalOpinions: opinions.length,
        pendingOpinions: opinions.filter(o => o.status === 'draft' || o.status === 'voting').length,
        totalJudgments: judgments.length,
        recentJudgments: judgments.filter(j => isAfter(new Date(j.created_at), new Date(sevenDaysAgo))).length,
        totalEvents: events.length,
        recentEvents: events.filter(e => isAfter(new Date(e.created_at), new Date(sevenDaysAgo))).length,
        totalRules: rules.length,
        activeRules: rules.filter(r => r.is_active).length,
        pendingTasks: tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
        pendingRequests: requests.filter(r => r.status === 'pending').length,
        alertState: alertResult.data?.[0]?.alert_state || 'normal'
      };
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['knowledge-recent-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="bg-card/50 animate-pulse">
            <CardContent className="p-4 h-24" />
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Fiches',
      value: stats?.totalFiles || 0,
      subtitle: `${stats?.internalFiles || 0} internes · ${stats?.externalFiles || 0} externes`,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Fiches Scellées',
      value: stats?.sealedFiles || 0,
      subtitle: 'Contenu verrouillé',
      icon: Shield,
      color: 'text-purple-400'
    },
    {
      title: 'Avis du Conseil',
      value: stats?.totalOpinions || 0,
      subtitle: `${stats?.pendingOpinions || 0} en cours`,
      icon: Users,
      color: 'text-blue-400'
    },
    {
      title: 'Jugements',
      value: stats?.totalJudgments || 0,
      subtitle: `${stats?.recentJudgments || 0} cette semaine`,
      icon: Gavel,
      color: 'text-yellow-400'
    },
    {
      title: 'Événements',
      value: stats?.totalEvents || 0,
      subtitle: `${stats?.recentEvents || 0} récents`,
      icon: Calendar,
      color: 'text-green-400'
    },
    {
      title: 'Règles Vivantes',
      value: stats?.totalRules || 0,
      subtitle: `${stats?.activeRules || 0} actives`,
      icon: BookOpen,
      color: 'text-orange-400'
    },
    {
      title: 'Tâches',
      value: stats?.pendingTasks || 0,
      subtitle: 'En attente',
      icon: Clock,
      color: 'text-cyan-400'
    },
    {
      title: 'Demandes',
      value: stats?.pendingRequests || 0,
      subtitle: 'À traiter',
      icon: AlertTriangle,
      color: 'text-red-400'
    }
  ];

  const getAlertBadge = () => {
    switch (stats?.alertState) {
      case 'crise':
        return <Badge className="bg-red-500/20 text-red-300 animate-pulse">🔴 CRISE</Badge>;
      case 'vigilance':
        return <Badge className="bg-yellow-500/20 text-yellow-300">🟡 VIGILANCE</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-300">🟢 NORMAL</Badge>;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'file_created':
      case 'file_updated':
        return <FileText className="w-3 h-3" />;
      case 'judgment_issued':
        return <Gavel className="w-3 h-3" />;
      case 'vote_cast':
        return <CheckCircle className="w-3 h-3" />;
      case 'event_created':
        return <Calendar className="w-3 h-3" />;
      default:
        return <Zap className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert State Banner */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-card/50 border border-border">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">État de l'Ordre:</span>
          {getAlertBadge()}
        </div>
        <div className="text-sm text-muted-foreground">
          Dernière mise à jour: {format(new Date(), 'HH:mm', { locale: fr })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="bg-card/50 border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-heading font-bold">{stat.value}</p>
                    <p className="text-sm font-medium text-foreground">{stat.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                  </div>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Activité Récente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id}
                  className="flex items-center gap-3 p-2 rounded bg-secondary/30"
                >
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                    {getActionIcon(activity.action_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(activity.created_at), 'dd MMM à HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune activité récente
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
