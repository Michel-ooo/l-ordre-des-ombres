import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Link2, Calendar, BookOpen, X, Check, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Suggestion {
  id: string;
  suggestion_type: string;
  source_id: string;
  source_type: string;
  target_id: string;
  target_type: string;
  reason: string;
  is_dismissed: boolean;
  created_at: string;
}

interface KnowledgeFile {
  id: string;
  name: string;
  file_type: string;
}

interface Event {
  id: string;
  title: string;
}

interface Rule {
  id: string;
  title: string;
}

const suggestionIcons: Record<string, React.ReactNode> = {
  link_files: <Link2 className="w-4 h-4 text-blue-400" />,
  similar_event: <Calendar className="w-4 h-4 text-pink-400" />,
  related_rule: <BookOpen className="w-4 h-4 text-amber-400" />,
};

const suggestionLabels: Record<string, string> = {
  link_files: 'Liaison suggérée',
  similar_event: 'Événement similaire',
  related_rule: 'Règle pertinente',
};

export function SuggestionsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ['knowledge-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_suggestions')
        .select('*')
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Suggestion[];
    },
  });

  const { data: files } = useQuery({
    queryKey: ['files-for-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('id, name, file_type');
      if (error) throw error;
      return data as KnowledgeFile[];
    },
  });

  const { data: events } = useQuery({
    queryKey: ['events-for-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_registry')
        .select('id, title');
      if (error) throw error;
      return data as Event[];
    },
  });

  const { data: rules } = useQuery({
    queryKey: ['rules-for-suggestions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('living_rules')
        .select('id, title');
      if (error) throw error;
      return data as Rule[];
    },
  });

  const getEntityName = (id: string, type: string): string => {
    if (type === 'file') {
      return files?.find(f => f.id === id)?.name || 'Fiche inconnue';
    }
    if (type === 'event') {
      return events?.find(e => e.id === id)?.title || 'Événement inconnu';
    }
    if (type === 'rule') {
      return rules?.find(r => r.id === id)?.title || 'Règle inconnue';
    }
    return 'Inconnu';
  };

  const dismissMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_suggestions')
        .update({ is_dismissed: true, dismissed_by: user?.id })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-suggestions'] });
      toast.success('Suggestion ignorée');
    },
  });

  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestion: Suggestion) => {
      if (suggestion.suggestion_type === 'link_files') {
        // Create a file relationship
        const { error } = await supabase.from('file_relationships').insert({
          source_file_id: suggestion.source_id,
          target_file_id: suggestion.target_id,
          relationship_type: 'unknown',
          description: suggestion.reason,
          created_by: user!.id,
        });
        if (error) throw error;
      }

      // Mark suggestion as dismissed after action
      const { error: dismissError } = await supabase
        .from('knowledge_suggestions')
        .update({ is_dismissed: true, dismissed_by: user?.id })
        .eq('id', suggestion.id);
      if (dismissError) throw dismissError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['file-relationships'] });
      toast.success('Suggestion appliquée');
    },
  });

  // Auto-generate suggestions based on similar names
  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      if (!files || files.length < 2) return;

      const newSuggestions: Array<{
        suggestion_type: string;
        source_id: string;
        source_type: string;
        target_id: string;
        target_type: string;
        reason: string;
      }> = [];

      // Simple similarity check based on common words
      for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
          const words1 = files[i].name.toLowerCase().split(/\s+/);
          const words2 = files[j].name.toLowerCase().split(/\s+/);
          const commonWords = words1.filter(w => w.length > 3 && words2.includes(w));
          
          if (commonWords.length > 0) {
            newSuggestions.push({
              suggestion_type: 'link_files',
              source_id: files[i].id,
              source_type: 'file',
              target_id: files[j].id,
              target_type: 'file',
              reason: `Mots communs détectés: "${commonWords.join('", "')}"`,
            });
          }
        }
      }

      // Check if suggestions already exist before inserting
      if (newSuggestions.length > 0) {
        // Get existing suggestions to avoid duplicates
        const { data: existing } = await supabase
          .from('knowledge_suggestions')
          .select('source_id, target_id, suggestion_type')
          .eq('is_dismissed', false);

        const existingSet = new Set(
          existing?.map(e => `${e.source_id}-${e.target_id}-${e.suggestion_type}`) || []
        );

        const uniqueSuggestions = newSuggestions.filter(
          s => !existingSet.has(`${s.source_id}-${s.target_id}-${s.suggestion_type}`)
        );

        if (uniqueSuggestions.length > 0) {
          const { error } = await supabase
            .from('knowledge_suggestions')
            .insert(uniqueSuggestions.slice(0, 10)); // Limit to 10 new suggestions

          if (error) throw error;
          return uniqueSuggestions.length;
        }
      }
      return 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-suggestions'] });
      if (count && count > 0) {
        toast.success(`${count} nouvelle(s) suggestion(s) générée(s)`);
      } else {
        toast.info('Aucune nouvelle suggestion à générer');
      }
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            Suggestions du Savoir
          </h2>
          <p className="text-sm text-muted-foreground">
            Le système suggère des liens potentiels entre les éléments
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => generateSuggestionsMutation.mutate()}
          disabled={generateSuggestionsMutation.isPending}
        >
          <RefreshCw className={`w-4 h-4 ${generateSuggestionsMutation.isPending ? 'animate-spin' : ''}`} />
          Analyser
        </Button>
      </div>

      {/* Suggestions list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : suggestions?.length === 0 ? (
        <Card className="bg-card/50">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune suggestion pour le moment
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Cliquez sur "Analyser" pour détecter des liens potentiels
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {suggestions?.map((suggestion) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <Card className="bg-card/50 border-primary/20 hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {suggestionIcons[suggestion.suggestion_type] || <Lightbulb className="w-4 h-4" />}
                        <Badge variant="outline">
                          {suggestionLabels[suggestion.suggestion_type] || suggestion.suggestion_type}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Source and target */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-muted">
                          {getEntityName(suggestion.source_id, suggestion.source_type)}
                        </Badge>
                        <Link2 className="w-4 h-4 text-muted-foreground" />
                        <Badge className="bg-muted">
                          {getEntityName(suggestion.target_id, suggestion.target_type)}
                        </Badge>
                      </div>

                      {/* Reason */}
                      <p className="text-sm text-muted-foreground">
                        {suggestion.reason}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {suggestion.suggestion_type === 'link_files' && (
                          <Button
                            size="sm"
                            onClick={() => acceptSuggestionMutation.mutate(suggestion)}
                            className="gap-1"
                            disabled={acceptSuggestionMutation.isPending}
                          >
                            <Check className="w-3 h-3" />
                            Créer le lien
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dismissMutation.mutate(suggestion.id)}
                          className="gap-1 text-muted-foreground hover:text-foreground"
                          disabled={dismissMutation.isPending}
                        >
                          <X className="w-3 h-3" />
                          Ignorer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
