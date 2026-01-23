import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useKnowledgeAccess } from '@/hooks/useKnowledgeAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Key, Plus, Clock, User, Trash2, Shield, FileText, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TemporaryAccess {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string | null;
  granted_by: string;
  expires_at: string;
  reason: string | null;
  created_at: string;
}

const resourceTypes = [
  { value: 'tool_knowledge', label: 'Module Le Savoir' },
  { value: 'file', label: 'Fiche spécifique' },
  { value: 'tool_council', label: 'Salle du Conseil' },
  { value: 'tool_judgments', label: 'Jugements' },
];

const resourceIcons: Record<string, React.ReactNode> = {
  tool_knowledge: <Shield className="w-4 h-4 text-primary" />,
  file: <FileText className="w-4 h-4 text-blue-400" />,
  tool_council: <User className="w-4 h-4 text-purple-400" />,
  tool_judgments: <Wrench className="w-4 h-4 text-amber-400" />,
};

export function TemporaryAccessTab() {
  const { user } = useAuth();
  const { isGuardianSupreme } = useKnowledgeAccess();
  const queryClient = useQueryClient();
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    resource_type: 'tool_knowledge',
    resource_id: '',
    expires_in_hours: '24',
    reason: '',
  });

  const { data: accesses, isLoading } = useQuery({
    queryKey: ['temporary-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('temporary_access')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TemporaryAccess[];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['all-profiles-for-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, pseudonym, grade');
      if (error) throw error;
      return data;
    },
  });

  const { data: knowledgeFiles } = useQuery({
    queryKey: ['knowledge-files-for-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const getUserName = (userId: string) => {
    const profile = profiles?.find(p => p.id === userId);
    return profile?.pseudonym || 'Inconnu';
  };

  const getResourceLabel = (type: string, resourceId: string | null) => {
    if (type === 'file' && resourceId) {
      const file = knowledgeFiles?.find(f => f.id === resourceId);
      return file?.name || 'Fiche inconnue';
    }
    return resourceTypes.find(r => r.value === type)?.label || type;
  };

  const createAccessMutation = useMutation({
    mutationFn: async () => {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(formData.expires_in_hours));

      const { error } = await supabase.from('temporary_access').insert({
        user_id: formData.user_id,
        resource_type: formData.resource_type,
        resource_id: formData.resource_type === 'file' ? formData.resource_id : null,
        granted_by: user!.id,
        expires_at: expiresAt.toISOString(),
        reason: formData.reason || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-access'] });
      toast.success('Accès temporaire accordé');
      setIsCreateOpen(false);
      setFormData({
        user_id: '',
        resource_type: 'tool_knowledge',
        resource_id: '',
        expires_in_hours: '24',
        reason: '',
      });
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'accès');
    },
  });

  const revokeAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('temporary_access')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['temporary-access'] });
      toast.success('Accès révoqué');
    },
  });

  const activeAccesses = accesses?.filter(a => !isPast(new Date(a.expires_at)));
  const expiredAccesses = accesses?.filter(a => isPast(new Date(a.expires_at)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-heading flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Accès Temporaires
          </h2>
          <p className="text-sm text-muted-foreground">
            Gérez les accès limités dans le temps
          </p>
        </div>
        {isGuardianSupreme && (
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Accorder un accès
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Accorder un accès temporaire</DialogTitle>
                <DialogDescription>
                  Donnez un accès limité dans le temps à un membre.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Membre</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, user_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un membre" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles?.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.pseudonym} ({profile.grade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type de ressource</Label>
                  <Select
                    value={formData.resource_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, resource_type: value, resource_id: '' }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {resourceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.resource_type === 'file' && (
                  <div className="space-y-2">
                    <Label>Fiche</Label>
                    <Select
                      value={formData.resource_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, resource_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une fiche" />
                      </SelectTrigger>
                      <SelectContent>
                        {knowledgeFiles?.map((file) => (
                          <SelectItem key={file.id} value={file.id}>{file.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Durée</Label>
                  <Select
                    value={formData.expires_in_hours}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, expires_in_hours: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 heure</SelectItem>
                      <SelectItem value="6">6 heures</SelectItem>
                      <SelectItem value="24">24 heures</SelectItem>
                      <SelectItem value="72">3 jours</SelectItem>
                      <SelectItem value="168">1 semaine</SelectItem>
                      <SelectItem value="720">30 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Raison (optionnel)</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Motif de l'accès..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={() => createAccessMutation.mutate()}
                  className="w-full"
                  disabled={!formData.user_id || (formData.resource_type === 'file' && !formData.resource_id)}
                >
                  Accorder l'accès
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active accesses */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <>
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Accès actifs ({activeAccesses?.length || 0})
            </h3>
            {activeAccesses?.length === 0 ? (
              <Card className="bg-card/50">
                <CardContent className="py-6 text-center text-muted-foreground">
                  Aucun accès temporaire actif
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {activeAccesses?.map((access) => (
                    <motion.div
                      key={access.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <Card className="bg-card/50 border-green-500/30">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              {resourceIcons[access.resource_type] || <Key className="w-4 h-4" />}
                              <div>
                                <CardTitle className="text-base">
                                  {getUserName(access.user_id)}
                                </CardTitle>
                                <CardDescription>
                                  {getResourceLabel(access.resource_type, access.resource_id)}
                                </CardDescription>
                              </div>
                            </div>
                            <Badge className="bg-green-500/20 text-green-300">
                              Expire {formatDistanceToNow(new Date(access.expires_at), { addSuffix: true, locale: fr })}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {access.reason && (
                            <p className="text-sm text-muted-foreground mb-2">{access.reason}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              Accordé par {getUserName(access.granted_by)} le {format(new Date(access.created_at), 'PPP', { locale: fr })}
                            </p>
                            {isGuardianSupreme && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeAccessMutation.mutate(access.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Expired accesses */}
          {expiredAccesses && expiredAccesses.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Accès expirés ({expiredAccesses.length})
              </h3>
              <div className="space-y-2 opacity-60">
                {expiredAccesses.slice(0, 5).map((access) => (
                  <Card key={access.id} className="bg-card/30">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3" />
                          <span className="text-sm">{getUserName(access.user_id)}</span>
                          <span className="text-xs text-muted-foreground">
                            — {getResourceLabel(access.resource_type, access.resource_id)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Expiré le {format(new Date(access.expires_at), 'dd/MM/yyyy')}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
