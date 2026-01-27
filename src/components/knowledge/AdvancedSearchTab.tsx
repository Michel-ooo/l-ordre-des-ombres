import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, FileText, Users, Calendar, BookOpen, Gavel, 
  Filter, X, Clock, User, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TagFilter } from './FileTagsManager';

interface SearchResult {
  id: string;
  type: 'file' | 'event' | 'rule' | 'opinion' | 'judgment';
  title: string;
  description: string;
  date: string;
  metadata?: Record<string, unknown>;
}

export function AdvancedSearchTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Fetch all searchable data
  const { data: files } = useQuery({
    queryKey: ['search-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('*, file_tag_assignments(tag_id)');
      if (error) throw error;
      return data;
    }
  });

  const { data: events } = useQuery({
    queryKey: ['search-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_registry')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: rules } = useQuery({
    queryKey: ['search-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('living_rules')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: opinions } = useQuery({
    queryKey: ['search-opinions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('council_opinions')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: judgments } = useQuery({
    queryKey: ['search-judgments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('judgments')
        .select('*');
      if (error) throw error;
      return data;
    }
  });

  // Combine all results
  const allResults = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    files?.forEach(file => {
      results.push({
        id: file.id,
        type: 'file',
        title: file.name,
        description: file.description || file.alias || 'Fiche de savoir',
        date: file.created_at,
        metadata: { 
          narrative_status: file.narrative_status, 
          file_type: file.file_type,
          is_sealed: file.is_sealed,
          tagIds: file.file_tag_assignments?.map((a: { tag_id: string }) => a.tag_id) || []
        }
      });
    });

    events?.forEach(event => {
      results.push({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        date: event.event_date,
        metadata: { event_type: event.event_type }
      });
    });

    rules?.forEach(rule => {
      results.push({
        id: rule.id,
        type: 'rule',
        title: rule.title,
        description: rule.rule_text,
        date: rule.created_at,
        metadata: { is_active: rule.is_active }
      });
    });

    opinions?.forEach(opinion => {
      results.push({
        id: opinion.id,
        type: 'opinion',
        title: opinion.title,
        description: opinion.summary,
        date: opinion.created_at,
        metadata: { status: opinion.status }
      });
    });

    judgments?.forEach(judgment => {
      results.push({
        id: judgment.id,
        type: 'judgment',
        title: judgment.title,
        description: judgment.decision,
        date: judgment.created_at,
        metadata: { executed_at: judgment.executed_at }
      });
    });

    return results;
  }, [files, events, rules, opinions, judgments]);

  // Filter results
  const filteredResults = useMemo(() => {
    let results = allResults;

    // Text search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = results.filter(r => 
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (searchType !== 'all') {
      results = results.filter(r => r.type === searchType);
    }

    // Date filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff: Date;
      
      switch (dateRange) {
        case 'week':
          cutoff = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          cutoff = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          cutoff = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          cutoff = new Date(0);
      }

      results = results.filter(r => new Date(r.date) >= cutoff);
    }

    // Tag filter (for files)
    if (selectedTags.length > 0) {
      results = results.filter(r => {
        if (r.type !== 'file') return false;
        const tagIds = (r.metadata?.tagIds as string[]) || [];
        return selectedTags.some(tagId => tagIds.includes(tagId));
      });
    }

    // Sort by date
    return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allResults, searchTerm, searchType, dateRange, selectedTags]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return <FileText className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      case 'rule': return <BookOpen className="w-4 h-4" />;
      case 'opinion': return <Users className="w-4 h-4" />;
      case 'judgment': return <Gavel className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'file': return 'Fiche';
      case 'event': return 'Événement';
      case 'rule': return 'Règle';
      case 'opinion': return 'Avis';
      case 'judgment': return 'Jugement';
      default: return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'file': return 'bg-primary/20 text-primary';
      case 'event': return 'bg-green-500/20 text-green-300';
      case 'rule': return 'bg-orange-500/20 text-orange-300';
      case 'opinion': return 'bg-blue-500/20 text-blue-300';
      case 'judgment': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const hasActiveFilters = searchType !== 'all' || dateRange !== 'all' || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans tout le Savoir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setSearchTerm('')}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <Button
            variant={isFiltersOpen ? 'secondary' : 'outline'}
            className="gap-2"
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <Filter className="w-4 h-4" />
            Filtres
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1">
                {(searchType !== 'all' ? 1 : 0) + (dateRange !== 'all' ? 1 : 0) + selectedTags.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {isFiltersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="bg-card/50">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Type de contenu</label>
                      <Select value={searchType} onValueChange={setSearchType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les types</SelectItem>
                          <SelectItem value="file">Fiches</SelectItem>
                          <SelectItem value="event">Événements</SelectItem>
                          <SelectItem value="rule">Règles</SelectItem>
                          <SelectItem value="opinion">Avis du Conseil</SelectItem>
                          <SelectItem value="judgment">Jugements</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Période</label>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes les dates</SelectItem>
                          <SelectItem value="week">Cette semaine</SelectItem>
                          <SelectItem value="month">Ce mois</SelectItem>
                          <SelectItem value="year">Cette année</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tags (fiches uniquement)</label>
                    <TagFilter selectedTags={selectedTags} onTagsChange={setSelectedTags} />
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchType('all');
                        setDateRange('all');
                        setSelectedTags([]);
                      }}
                    >
                      Réinitialiser les filtres
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredResults.length} résultat{filteredResults.length !== 1 ? 's' : ''}
            {searchTerm && ` pour "${searchTerm}"`}
          </p>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredResults.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {searchTerm ? 'Aucun résultat trouvé' : 'Commencez à taper pour rechercher'}
                </p>
              </motion.div>
            ) : (
              filteredResults.map((result, index) => (
                <motion.div
                  key={`${result.type}-${result.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card className="bg-card/50 hover:bg-card/80 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeBadgeClass(result.type)}`}>
                          {getTypeIcon(result.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium truncate">{result.title}</h3>
                            {result.metadata?.is_sealed && (
                              <Shield className="w-4 h-4 text-purple-400" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <Badge className={getTypeBadgeClass(result.type)}>
                              {getTypeLabel(result.type)}
                            </Badge>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(result.date), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
