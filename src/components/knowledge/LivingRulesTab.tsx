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
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, BookOpen, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LivingRule {
  id: string;
  title: string;
  rule_text: string;
  interpretations: string[] | null;
  council_comments: string | null;
  precedents: string[] | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function LivingRulesTab() {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<LivingRule | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    rule_text: '',
    interpretations: '',
    council_comments: '',
    precedents: '',
    is_active: true,
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['living-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('living_rules')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as LivingRule[];
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('living_rules').insert({
        title: formData.title,
        rule_text: formData.rule_text,
        interpretations: formData.interpretations ? formData.interpretations.split('\n').filter(i => i.trim()) : null,
        council_comments: formData.council_comments || null,
        precedents: formData.precedents ? formData.precedents.split('\n').filter(p => p.trim()) : null,
        is_active: formData.is_active,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['living-rules'] });
      toast.success('Règle créée');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('living_rules').update({
        title: data.title,
        rule_text: data.rule_text,
        interpretations: data.interpretations ? data.interpretations.split('\n').filter(i => i.trim()) : null,
        council_comments: data.council_comments || null,
        precedents: data.precedents ? data.precedents.split('\n').filter(p => p.trim()) : null,
        is_active: data.is_active,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['living-rules'] });
      toast.success('Règle mise à jour');
      setSelectedRule(null);
      setIsEditMode(false);
      resetForm();
    },
  });

  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('living_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['living-rules'] });
      toast.success('Règle supprimée');
      setSelectedRule(null);
    },
  });

  const toggleActiveStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('living_rules').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['living-rules'] });
      toast.success('Statut mis à jour');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      rule_text: '',
      interpretations: '',
      council_comments: '',
      precedents: '',
      is_active: true,
    });
  };

  const handleEditRule = (rule: LivingRule) => {
    setFormData({
      title: rule.title,
      rule_text: rule.rule_text,
      interpretations: rule.interpretations?.join('\n') || '',
      council_comments: rule.council_comments || '',
      precedents: rule.precedents?.join('\n') || '',
      is_active: rule.is_active,
    });
    setSelectedRule(rule);
    setIsEditMode(true);
  };

  const filteredRules = rules?.filter(rule => showInactive || rule.is_active);

  const RuleForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre de la règle</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ex: Règle I - Du Silence"
        />
      </div>

      <div className="space-y-2">
        <Label>Texte de la règle</Label>
        <Textarea
          value={formData.rule_text}
          onChange={(e) => setFormData(prev => ({ ...prev, rule_text: e.target.value }))}
          placeholder="Formulation officielle de la règle..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Interprétations possibles (une par ligne)</Label>
        <Textarea
          value={formData.interpretations}
          onChange={(e) => setFormData(prev => ({ ...prev, interpretations: e.target.value }))}
          placeholder="Chaque interprétation sur une ligne..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Commentaires du Conseil</Label>
        <Textarea
          value={formData.council_comments}
          onChange={(e) => setFormData(prev => ({ ...prev, council_comments: e.target.value }))}
          placeholder="Observations et clarifications du Conseil..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Précédents liés (un par ligne)</Label>
        <Textarea
          value={formData.precedents}
          onChange={(e) => setFormData(prev => ({ ...prev, precedents: e.target.value }))}
          placeholder="Références à des cas précédents..."
          rows={2}
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
        />
        <Label>Règle active</Label>
      </div>

      <Button onClick={onSubmit} className="w-full" disabled={!formData.title || !formData.rule_text}>
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading">Règles Vivantes</h2>
          <p className="text-sm text-muted-foreground">Code et jurisprudence de l'Ordre</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={showInactive}
              onCheckedChange={setShowInactive}
            />
            <Label className="text-sm">Afficher inactives</Label>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle règle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une règle</DialogTitle>
              </DialogHeader>
              <RuleForm
                onSubmit={() => createRuleMutation.mutate()}
                submitLabel="Créer la règle"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Rules list */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredRules?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune règle enregistrée
        </div>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          <AnimatePresence>
            {filteredRules?.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem value={rule.id} className="border border-border rounded-lg bg-card/50">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-heading text-left flex-1">{rule.title}</span>
                      <Badge className={rule.is_active ? 'bg-green-500/20 text-green-300' : 'bg-muted text-muted-foreground'}>
                        {rule.is_active ? (
                          <><CheckCircle className="w-3 h-3 mr-1" />Active</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" />Inactive</>
                        )}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-2">
                      {/* Rule text */}
                      <div className="bg-primary/10 p-4 rounded-lg border-l-4 border-primary">
                        <p className="text-sm italic">{rule.rule_text}</p>
                      </div>

                      {/* Interpretations */}
                      {rule.interpretations && rule.interpretations.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Interprétations</Label>
                          <ul className="mt-1 space-y-1">
                            {rule.interpretations.map((interp, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-primary">•</span>
                                {interp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Council comments */}
                      {rule.council_comments && (
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <Label className="text-xs text-muted-foreground">Commentaires du Conseil</Label>
                          <p className="text-sm mt-1">{rule.council_comments}</p>
                        </div>
                      )}

                      {/* Precedents */}
                      {rule.precedents && rule.precedents.length > 0 && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Précédents</Label>
                          <ul className="mt-1 space-y-1">
                            {rule.precedents.map((prec, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-muted-foreground">→</span>
                                {prec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2 border-t border-border">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditRule(rule)}
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActiveStatus.mutate({ id: rule.id, is_active: !rule.is_active })}
                        >
                          {rule.is_active ? 'Désactiver' : 'Activer'}
                        </Button>
                        {isGuardianSupreme && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteRuleMutation.mutate(rule.id)}
                            className="gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </AnimatePresence>
        </Accordion>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditMode && !!selectedRule} onOpenChange={(open) => !open && (setSelectedRule(null), setIsEditMode(false))}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier la règle</DialogTitle>
          </DialogHeader>
          <RuleForm
            onSubmit={() => updateRuleMutation.mutate({ id: selectedRule!.id, data: formData })}
            submitLabel="Enregistrer les modifications"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
