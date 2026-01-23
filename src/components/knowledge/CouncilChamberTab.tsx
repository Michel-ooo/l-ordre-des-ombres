import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, MessageSquare, Send, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { CouncilVotingSection } from './CouncilVotingSection';

interface CouncilOpinion {
  id: string;
  title: string;
  summary: string;
  invoked_rules: string[] | null;
  options: Array<{ label: string; description: string }>;
  recommendation: string | null;
  dissenting_notes: string | null;
  status: string;
  file_id: string | null;
  created_by: string;
  created_at: string;
}

interface OpinionComment {
  id: string;
  opinion_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  deliberation: 'bg-yellow-500/20 text-yellow-300',
  concluded: 'bg-green-500/20 text-green-300',
  archived: 'bg-blue-500/20 text-blue-300',
};

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  deliberation: 'En délibération',
  concluded: 'Conclu',
  archived: 'Archivé',
};

export function CouncilChamberTab() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOpinion, setSelectedOpinion] = useState<CouncilOpinion | null>(null);
  const [newComment, setNewComment] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    invoked_rules: '',
    options: [{ label: '', description: '' }],
    recommendation: '',
    dissenting_notes: '',
    status: 'draft',
  });

  const { data: opinions, isLoading } = useQuery({
    queryKey: ['council-opinions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('council_opinions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Cast options from Json to expected type
      return (data || []).map(item => ({
        ...item,
        options: (item.options as Array<{ label: string; description: string }>) || [],
      })) as CouncilOpinion[];
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['opinion-comments', selectedOpinion?.id],
    queryFn: async () => {
      if (!selectedOpinion) return [];
      const { data, error } = await supabase
        .from('opinion_comments')
        .select('*')
        .eq('opinion_id', selectedOpinion.id)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as OpinionComment[];
    },
    enabled: !!selectedOpinion,
  });

  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-comments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, pseudonym');
      
      if (error) throw error;
      return data;
    },
  });

  const getAuthorName = (authorId: string) => {
    const authorProfile = profiles?.find(p => p.id === authorId);
    return authorProfile?.pseudonym || 'Inconnu';
  };

  const createOpinionMutation = useMutation({
    mutationFn: async () => {
      const optionsFiltered = formData.options.filter(o => o.label.trim());
      const { error } = await supabase.from('council_opinions').insert({
        title: formData.title,
        summary: formData.summary,
        invoked_rules: formData.invoked_rules ? formData.invoked_rules.split(',').map(r => r.trim()) : null,
        options: optionsFiltered,
        recommendation: formData.recommendation || null,
        dissenting_notes: formData.dissenting_notes || null,
        status: formData.status,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['council-opinions'] });
      toast.success('Avis créé avec succès');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('opinion_comments').insert({
        opinion_id: selectedOpinion!.id,
        author_id: user!.id,
        content: newComment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opinion-comments', selectedOpinion?.id] });
      toast.success('Commentaire ajouté');
      setNewComment('');
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout du commentaire');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('council_opinions')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['council-opinions'] });
      toast.success('Statut mis à jour');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      invoked_rules: '',
      options: [{ label: '', description: '' }],
      recommendation: '',
      dissenting_notes: '',
      status: 'draft',
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { label: '', description: '' }],
    }));
  };

  const updateOption = (index: number, field: 'label' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((o, i) => i === index ? { ...o, [field]: value } : o),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading">Salle du Conseil</h2>
          <p className="text-sm text-muted-foreground">Délibérations et avis du Conseil</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvel avis
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rédiger un Avis du Conseil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de l'avis"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Résumé des faits</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="Résumé des faits et contexte..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Règles invoquées (séparées par des virgules)</Label>
                <Input
                  value={formData.invoked_rules}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoked_rules: e.target.value }))}
                  placeholder="Règle I, Règle III, ..."
                />
              </div>

              <div className="space-y-2">
                <Label>Options envisagées</Label>
                {formData.options.map((option, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    <Input
                      className="col-span-2"
                      value={option.description}
                      onChange={(e) => updateOption(index, 'description', e.target.value)}
                      placeholder="Description de l'option"
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  + Ajouter une option
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Recommandation collective</Label>
                <Textarea
                  value={formData.recommendation}
                  onChange={(e) => setFormData(prev => ({ ...prev, recommendation: e.target.value }))}
                  placeholder="Recommandation du Conseil..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Notes dissidentes (facultatif)</Label>
                <Textarea
                  value={formData.dissenting_notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, dissenting_notes: e.target.value }))}
                  placeholder="Opinions minoritaires..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={() => createOpinionMutation.mutate()} 
                className="w-full" 
                disabled={!formData.title || !formData.summary}
              >
                Créer l'avis
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Opinions list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : opinions?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun avis du Conseil
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {opinions?.map((opinion) => (
              <motion.div
                key={opinion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card 
                  className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedOpinion(opinion)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base">{opinion.title}</CardTitle>
                      </div>
                      <Badge className={statusColors[opinion.status]}>
                        {statusLabels[opinion.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {opinion.summary}
                    </p>
                    {opinion.invoked_rules && opinion.invoked_rules.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {opinion.invoked_rules.map((rule, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {rule}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Opinion Detail Dialog */}
      <Dialog open={!!selectedOpinion} onOpenChange={(open) => !open && setSelectedOpinion(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOpinion?.title}</DialogTitle>
          </DialogHeader>
          {selectedOpinion && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedOpinion.status]}>
                  {statusLabels[selectedOpinion.status]}
                </Badge>
                <Select
                  value={selectedOpinion.status}
                  onValueChange={(value) => {
                    updateStatusMutation.mutate({ id: selectedOpinion.id, status: value });
                    setSelectedOpinion(prev => prev ? { ...prev, status: value } : null);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Résumé des faits</Label>
                <p className="text-sm mt-1">{selectedOpinion.summary}</p>
              </div>

              {selectedOpinion.invoked_rules && selectedOpinion.invoked_rules.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Règles invoquées</Label>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {selectedOpinion.invoked_rules.map((rule, i) => (
                      <Badge key={i} variant="outline">{rule}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedOpinion.options.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Options envisagées</Label>
                  <div className="space-y-2 mt-1">
                    {selectedOpinion.options.map((option, i) => (
                      <div key={i} className="bg-muted/50 p-2 rounded">
                        <span className="font-medium">{option.label}:</span> {option.description}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedOpinion.recommendation && (
                <div className="bg-primary/10 p-3 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Recommandation</Label>
                  <p className="text-sm mt-1">{selectedOpinion.recommendation}</p>
                </div>
              )}

              {selectedOpinion.dissenting_notes && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Notes dissidentes</Label>
                  <p className="text-sm mt-1 italic">{selectedOpinion.dissenting_notes}</p>
                </div>
              )}

              {/* Voting Section */}
              <CouncilVotingSection 
                opinionId={selectedOpinion.id} 
                opinionStatus={selectedOpinion.status} 
              />
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Commentaires des Archontes
                </Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {comments?.map((comment) => (
                    <div key={comment.id} className="bg-muted/30 p-2 rounded text-sm">
                      <span className="font-medium text-primary">{getAuthorName(comment.author_id)}:</span>{' '}
                      {comment.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Ajouter un commentaire..."
                    onKeyDown={(e) => e.key === 'Enter' && newComment && addCommentMutation.mutate()}
                  />
                  <Button
                    size="icon"
                    onClick={() => addCommentMutation.mutate()}
                    disabled={!newComment}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
