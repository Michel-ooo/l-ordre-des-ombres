import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Plus, Link2, ArrowRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

type RelationshipType = 'alliance' | 'conflict' | 'influence' | 'observation' | 'unknown';

interface FileRelationship {
  id: string;
  source_file_id: string;
  target_file_id: string;
  relationship_type: RelationshipType;
  description: string | null;
  created_by: string;
  created_at: string;
}

interface KnowledgeFile {
  id: string;
  name: string;
  alias: string | null;
  narrative_status: string;
}

const relationshipColors: Record<RelationshipType, string> = {
  alliance: 'bg-green-500/20 text-green-300 border-green-500/50',
  conflict: 'bg-red-500/20 text-red-300 border-red-500/50',
  influence: 'bg-blue-500/20 text-blue-300 border-blue-500/50',
  observation: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
  unknown: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
};

const relationshipLabels: Record<RelationshipType, string> = {
  alliance: 'Alliance',
  conflict: 'Conflit',
  influence: 'Influence',
  observation: 'Observation',
  unknown: 'Inconnu',
};

export function InfluenceMapTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filterType, setFilterType] = useState<RelationshipType | 'all'>('all');
  
  const [formData, setFormData] = useState({
    source_file_id: '',
    target_file_id: '',
    relationship_type: 'unknown' as RelationshipType,
    description: '',
  });

  const { data: relationships, isLoading: loadingRelationships } = useQuery({
    queryKey: ['file-relationships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_relationships')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FileRelationship[];
    },
  });

  const { data: files, isLoading: loadingFiles } = useQuery({
    queryKey: ['knowledge-files-for-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('id, name, alias, narrative_status');
      
      if (error) throw error;
      return data as KnowledgeFile[];
    },
  });

  const createRelationshipMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('file_relationships').insert({
        source_file_id: formData.source_file_id,
        target_file_id: formData.target_file_id,
        relationship_type: formData.relationship_type,
        description: formData.description || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-relationships'] });
      toast.success('Lien créé');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error('Ce lien existe déjà');
      } else {
        toast.error('Erreur lors de la création du lien');
      }
    },
  });

  const deleteRelationshipMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('file_relationships').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-relationships'] });
      toast.success('Lien supprimé');
    },
  });

  const resetForm = () => {
    setFormData({
      source_file_id: '',
      target_file_id: '',
      relationship_type: 'unknown',
      description: '',
    });
  };

  const getFileName = (fileId: string) => {
    const file = files?.find(f => f.id === fileId);
    return file?.alias || file?.name || 'Inconnu';
  };

  const filteredRelationships = useMemo(() => {
    if (!relationships) return [];
    if (filterType === 'all') return relationships;
    return relationships.filter(r => r.relationship_type === filterType);
  }, [relationships, filterType]);

  // Group relationships by source file for visualization
  const groupedRelationships = useMemo(() => {
    const groups: Record<string, FileRelationship[]> = {};
    filteredRelationships.forEach(rel => {
      if (!groups[rel.source_file_id]) {
        groups[rel.source_file_id] = [];
      }
      groups[rel.source_file_id].push(rel);
    });
    return groups;
  }, [filteredRelationships]);

  const isLoading = loadingRelationships || loadingFiles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading">Cartographie d'Influence</h2>
          <p className="text-sm text-muted-foreground">Liens et relations entre les fiches</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={filterType}
            onValueChange={(value) => setFilterType(value as RelationshipType | 'all')}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les liens</SelectItem>
              {Object.entries(relationshipLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau lien
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Créer un lien</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Fiche source</Label>
                  <Select
                    value={formData.source_file_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, source_file_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une fiche" />
                    </SelectTrigger>
                    <SelectContent>
                      {files?.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name} {file.alias && `(${file.alias})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="w-6 h-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <Label>Fiche cible</Label>
                  <Select
                    value={formData.target_file_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, target_file_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une fiche" />
                    </SelectTrigger>
                    <SelectContent>
                      {files?.filter(f => f.id !== formData.source_file_id).map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.name} {file.alias && `(${file.alias})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Type de relation</Label>
                  <Select
                    value={formData.relationship_type}
                    onValueChange={(value: RelationshipType) => setFormData(prev => ({ ...prev, relationship_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(relationshipLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Nature du lien..."
                  />
                </div>

                <Button 
                  onClick={() => createRelationshipMutation.mutate()} 
                  className="w-full" 
                  disabled={!formData.source_file_id || !formData.target_file_id}
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Créer le lien
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Visualization */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : Object.keys(groupedRelationships).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun lien établi
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedRelationships).map(([sourceId, rels]) => (
            <motion.div
              key={sourceId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="bg-card/50 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    {getFileName(sourceId)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rels.map((rel) => (
                      <div
                        key={rel.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${relationshipColors[rel.relationship_type]}`}
                      >
                        <div className="flex items-center gap-3">
                          <ArrowRight className="w-4 h-4" />
                          <span className="font-medium">{getFileName(rel.target_file_id)}</span>
                          <Badge variant="outline" className="text-xs">
                            {relationshipLabels[rel.relationship_type]}
                          </Badge>
                          {rel.description && (
                            <span className="text-sm text-muted-foreground">
                              - {rel.description}
                            </span>
                          )}
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => deleteRelationshipMutation.mutate(rel.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Legend */}
      <Card className="bg-card/30">
        <CardContent className="pt-4">
          <Label className="text-xs text-muted-foreground mb-2 block">Légende</Label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(relationshipLabels).map(([type, label]) => (
              <Badge 
                key={type} 
                className={relationshipColors[type as RelationshipType]}
              >
                {label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
