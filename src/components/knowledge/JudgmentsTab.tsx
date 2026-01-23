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
import { Plus, Gavel, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Judgment {
  id: string;
  opinion_id: string;
  file_id: string | null;
  title: string;
  decision: string;
  effects: { type: string; description: string }[];
  executed_at: string | null;
  created_by: string;
  created_at: string;
}

interface CouncilOpinion {
  id: string;
  title: string;
  status: string;
}

const effectTypes = [
  { value: 'rank_change', label: 'Changement de rang' },
  { value: 'access_grant', label: 'Accès accordé' },
  { value: 'access_revoke', label: 'Accès révoqué' },
  { value: 'symbolic_status', label: 'Statut symbolique' },
  { value: 'other', label: 'Autre' },
];

interface JudgmentsTabProps {
  isGuardianSupreme: boolean;
}

export function JudgmentsTab({ isGuardianSupreme }: JudgmentsTabProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJudgment, setSelectedJudgment] = useState<Judgment | null>(null);
  
  const [formData, setFormData] = useState({
    opinion_id: '',
    title: '',
    decision: '',
    effects: [{ type: 'rank_change', description: '' }],
  });

  const { data: judgments, isLoading } = useQuery({
    queryKey: ['judgments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('judgments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Judgment[];
    },
  });

  const { data: opinions } = useQuery({
    queryKey: ['concluded-opinions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('council_opinions')
        .select('id, title, status')
        .eq('status', 'concluded');
      
      if (error) throw error;
      return data as CouncilOpinion[];
    },
  });

  const createJudgmentMutation = useMutation({
    mutationFn: async () => {
      const effectsFiltered = formData.effects.filter(e => e.description.trim());
      const { error } = await supabase.from('judgments').insert({
        opinion_id: formData.opinion_id,
        title: formData.title,
        decision: formData.decision,
        effects: effectsFiltered,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judgments'] });
      toast.success('Jugement prononcé');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création du jugement');
    },
  });

  const executeJudgmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('judgments')
        .update({ executed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['judgments'] });
      toast.success('Jugement exécuté');
      setSelectedJudgment(null);
    },
  });

  const resetForm = () => {
    setFormData({
      opinion_id: '',
      title: '',
      decision: '',
      effects: [{ type: 'rank_change', description: '' }],
    });
  };

  const addEffect = () => {
    setFormData(prev => ({
      ...prev,
      effects: [...prev.effects, { type: 'rank_change', description: '' }],
    }));
  };

  const updateEffect = (index: number, field: 'type' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      effects: prev.effects.map((e, i) => i === index ? { ...e, [field]: value } : e),
    }));
  };

  const getOpinionTitle = (opinionId: string) => {
    return opinions?.find(o => o.id === opinionId)?.title || 'Avis inconnu';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading">Jugements</h2>
          <p className="text-sm text-muted-foreground">Décisions et sentences de l'Ordre</p>
        </div>
        {isGuardianSupreme && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Prononcer un jugement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Prononcer un Jugement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Avis du Conseil (conclu)</Label>
                  <Select
                    value={formData.opinion_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, opinion_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un avis conclu" />
                    </SelectTrigger>
                    <SelectContent>
                      {opinions?.map((opinion) => (
                        <SelectItem key={opinion.id} value={opinion.id}>
                          {opinion.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Titre du jugement</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre du jugement"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Décision</Label>
                  <Textarea
                    value={formData.decision}
                    onChange={(e) => setFormData(prev => ({ ...prev, decision: e.target.value }))}
                    placeholder="Formulation de la décision..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Effets</Label>
                  {formData.effects.map((effect, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2">
                      <Select
                        value={effect.type}
                        onValueChange={(value) => updateEffect(index, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {effectTypes.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        className="col-span-2"
                        value={effect.description}
                        onChange={(e) => updateEffect(index, 'description', e.target.value)}
                        placeholder="Description de l'effet"
                      />
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addEffect}>
                    + Ajouter un effet
                  </Button>
                </div>

                <Button 
                  onClick={() => createJudgmentMutation.mutate()} 
                  className="w-full" 
                  disabled={!formData.opinion_id || !formData.title || !formData.decision}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Prononcer le jugement
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Judgments list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : judgments?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun jugement prononcé
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {judgments?.map((judgment) => (
              <motion.div
                key={judgment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <Card 
                  className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedJudgment(judgment)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Gavel className="w-4 h-4 text-primary" />
                        <CardTitle className="text-base">{judgment.title}</CardTitle>
                      </div>
                      <Badge className={judgment.executed_at ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}>
                        {judgment.executed_at ? (
                          <><CheckCircle className="w-3 h-3 mr-1" />Exécuté</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" />En attente</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {judgment.decision}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(judgment.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Judgment Detail Dialog */}
      <Dialog open={!!selectedJudgment} onOpenChange={(open) => !open && setSelectedJudgment(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="w-5 h-5" />
              {selectedJudgment?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedJudgment && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={selectedJudgment.executed_at ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}>
                  {selectedJudgment.executed_at ? 'Exécuté' : 'En attente d\'exécution'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedJudgment.created_at), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Décision</Label>
                <p className="text-sm mt-1 bg-muted/50 p-3 rounded-lg">{selectedJudgment.decision}</p>
              </div>

              {selectedJudgment.effects.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">Effets prononcés</Label>
                  <div className="space-y-2 mt-1">
                    {selectedJudgment.effects.map((effect, i) => (
                      <div key={i} className="flex items-center gap-2 bg-primary/10 p-2 rounded">
                        <Badge variant="outline" className="text-xs">
                          {effectTypes.find(t => t.value === effect.type)?.label}
                        </Badge>
                        <span className="text-sm">{effect.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedJudgment.executed_at && (
                <p className="text-sm text-muted-foreground">
                  Exécuté le {format(new Date(selectedJudgment.executed_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </p>
              )}

              {isGuardianSupreme && !selectedJudgment.executed_at && (
                <Button 
                  onClick={() => executeJudgmentMutation.mutate(selectedJudgment.id)}
                  className="w-full"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme exécuté
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
