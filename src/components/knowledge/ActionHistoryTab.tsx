import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, 
  FileText, 
  Edit, 
  Trash2, 
  Gavel, 
  RefreshCw, 
  Vote, 
  FileQuestion, 
  CheckCircle, 
  MessageSquare, 
  Calendar, 
  BookOpen,
  AlertTriangle,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Database } from '@/integrations/supabase/types';

type ActionType = Database['public']['Enums']['action_type'];

interface ActionHistoryItem {
  id: string;
  action_type: ActionType;
  actor_id: string;
  target_id: string | null;
  target_type: string | null;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const actionIcons: Record<ActionType, React.ReactNode> = {
  file_created: <FileText className="w-4 h-4 text-green-400" />,
  file_updated: <Edit className="w-4 h-4 text-blue-400" />,
  file_deleted: <Trash2 className="w-4 h-4 text-red-400" />,
  judgment_issued: <Gavel className="w-4 h-4 text-purple-400" />,
  status_changed: <RefreshCw className="w-4 h-4 text-yellow-400" />,
  vote_cast: <Vote className="w-4 h-4 text-cyan-400" />,
  request_submitted: <FileQuestion className="w-4 h-4 text-orange-400" />,
  request_resolved: <CheckCircle className="w-4 h-4 text-green-400" />,
  opinion_created: <MessageSquare className="w-4 h-4 text-primary" />,
  event_created: <Calendar className="w-4 h-4 text-pink-400" />,
  rule_created: <BookOpen className="w-4 h-4 text-amber-400" />,
  alert_changed: <AlertTriangle className="w-4 h-4 text-red-400" />,
};

const actionLabels: Record<ActionType, string> = {
  file_created: 'Fiche créée',
  file_updated: 'Fiche modifiée',
  file_deleted: 'Fiche supprimée',
  judgment_issued: 'Jugement rendu',
  status_changed: 'Statut modifié',
  vote_cast: 'Vote enregistré',
  request_submitted: 'Demande soumise',
  request_resolved: 'Demande traitée',
  opinion_created: 'Avis créé',
  event_created: 'Événement créé',
  rule_created: 'Règle créée',
  alert_changed: 'Alerte modifiée',
};

export function ActionHistoryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const { data: history, isLoading } = useQuery({
    queryKey: ['action-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('action_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data as ActionHistoryItem[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-for-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, pseudonym');
      if (error) throw error;
      return data;
    },
  });

  const getActorName = (actorId: string) => {
    const profile = profiles?.find(p => p.id === actorId);
    return profile?.pseudonym || 'Système';
  };

  const filteredHistory = history?.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getActorName(item.actor_id).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || item.action_type === filterType;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Historique des Actions
        </h2>
        <p className="text-sm text-muted-foreground">
          Toutes les actions importantes sont archivées automatiquement
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(actionLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* History list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredHistory?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune action dans l'historique
        </div>
      ) : (
        <Card className="bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              {filteredHistory?.length} action{(filteredHistory?.length || 0) !== 1 ? 's' : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-1">
                <AnimatePresence>
                  {filteredHistory?.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
                    >
                      <div className="mt-0.5">
                        {actionIcons[item.action_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {actionLabels[item.action_type]}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            par <span className="text-primary">{getActorName(item.actor_id)}</span>
                          </span>
                        </div>
                        <p className="text-sm mt-1 truncate">{item.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(item.created_at), 'PPP à HH:mm', { locale: fr })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
