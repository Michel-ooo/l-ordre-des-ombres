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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, User, Users, Eye, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

type FileType = 'internal' | 'external';
type NarrativeStatus = 'neutral' | 'observed' | 'ally' | 'at_risk' | 'protected' | 'unknown';

interface KnowledgeFile {
  id: string;
  name: string;
  alias: string | null;
  file_type: FileType;
  narrative_status: NarrativeStatus;
  description: string | null;
  council_notes: string | null;
  profile_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FileFormData {
  name: string;
  alias: string;
  file_type: FileType;
  narrative_status: NarrativeStatus;
  description: string;
  council_notes: string;
}

const statusColors: Record<NarrativeStatus, string> = {
  neutral: 'bg-muted text-muted-foreground',
  observed: 'bg-yellow-500/20 text-yellow-300',
  ally: 'bg-green-500/20 text-green-300',
  at_risk: 'bg-red-500/20 text-red-300',
  protected: 'bg-blue-500/20 text-blue-300',
  unknown: 'bg-purple-500/20 text-purple-300',
};

const statusLabels: Record<NarrativeStatus, string> = {
  neutral: 'Neutre',
  observed: 'Observé',
  ally: 'Allié',
  at_risk: 'À risque',
  protected: 'Protégé',
  unknown: 'Inconnu',
};

// Extracted as a separate component to prevent re-creation on every render
const FileForm = ({ 
  formData, 
  setFormData, 
  onSubmit, 
  submitLabel 
}: { 
  formData: FileFormData;
  setFormData: React.Dispatch<React.SetStateAction<FileFormData>>;
  onSubmit: () => void; 
  submitLabel: string;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Nom</Label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nom de la fiche"
        />
      </div>
      <div className="space-y-2">
        <Label>Alias symbolique</Label>
        <Input
          value={formData.alias}
          onChange={(e) => setFormData(prev => ({ ...prev, alias: e.target.value }))}
          placeholder="Alias (optionnel)"
        />
      </div>
    </div>
    
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select
          value={formData.file_type}
          onValueChange={(value: FileType) => setFormData(prev => ({ ...prev, file_type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="internal">Interne (membre)</SelectItem>
            <SelectItem value="external">Externe</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Statut narratif</Label>
        <Select
          value={formData.narrative_status}
          onValueChange={(value: NarrativeStatus) => setFormData(prev => ({ ...prev, narrative_status: value }))}
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
    </div>

    <div className="space-y-2">
      <Label>Description</Label>
      <Textarea
        value={formData.description}
        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
        placeholder="Description détaillée..."
        rows={4}
      />
    </div>

    <div className="space-y-2">
      <Label>Notes du Conseil (privées)</Label>
      <Textarea
        value={formData.council_notes}
        onChange={(e) => setFormData(prev => ({ ...prev, council_notes: e.target.value }))}
        placeholder="Notes confidentielles..."
        rows={3}
      />
    </div>

    <Button onClick={onSubmit} className="w-full" disabled={!formData.name}>
      {submitLabel}
    </Button>
  </div>
);

export function KnowledgeFilesTab() {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<FileFormData>({
    name: '',
    alias: '',
    file_type: 'external',
    narrative_status: 'neutral',
    description: '',
    council_notes: '',
  });

  const { data: files, isLoading } = useQuery({
    queryKey: ['knowledge-files'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_files')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeFile[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from('knowledge_files').insert({
        ...data,
        alias: data.alias || null,
        description: data.description || null,
        council_notes: data.council_notes || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      toast.success('Fiche créée avec succès');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('knowledge_files').update({
        ...data,
        alias: data.alias || null,
        description: data.description || null,
        council_notes: data.council_notes || null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      toast.success('Fiche mise à jour');
      setSelectedFile(null);
      setIsEditMode(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_files').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-files'] });
      toast.success('Fiche supprimée');
      setSelectedFile(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      alias: '',
      file_type: 'external',
      narrative_status: 'neutral',
      description: '',
      council_notes: '',
    });
  };

  const handleEditFile = (file: KnowledgeFile) => {
    setFormData({
      name: file.name,
      alias: file.alias || '',
      file_type: file.file_type,
      narrative_status: file.narrative_status,
      description: file.description || '',
      council_notes: file.council_notes || '',
    });
    setSelectedFile(file);
    setIsEditMode(true);
  };

  const filteredFiles = files?.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.alias?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une fiche..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle fiche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Créer une fiche de Savoir</DialogTitle>
            </DialogHeader>
            <FileForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => createMutation.mutate(formData)}
              submitLabel="Créer la fiche"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Files grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : filteredFiles?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucune fiche trouvée
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredFiles?.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {file.file_type === 'internal' ? (
                          <User className="w-4 h-4 text-primary" />
                        ) : (
                          <Users className="w-4 h-4 text-muted-foreground" />
                        )}
                        <CardTitle className="text-base">{file.name}</CardTitle>
                      </div>
                      <Badge className={statusColors[file.narrative_status]}>
                        {statusLabels[file.narrative_status]}
                      </Badge>
                    </div>
                    {file.alias && (
                      <p className="text-sm text-muted-foreground italic">"{file.alias}"</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {file.description || 'Aucune description'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 gap-1"
                        onClick={() => {
                          setSelectedFile(file);
                          setIsEditMode(false);
                        }}
                      >
                        <Eye className="w-3 h-3" />
                        Voir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => handleEditFile(file)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      {isGuardianSupreme && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => deleteMutation.mutate(file.id)}
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* View/Edit Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Modifier la fiche' : selectedFile?.name}
            </DialogTitle>
          </DialogHeader>
          {isEditMode ? (
            <FileForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={() => updateMutation.mutate({ id: selectedFile!.id, data: formData })}
              submitLabel="Enregistrer les modifications"
            />
          ) : selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={statusColors[selectedFile.narrative_status]}>
                  {statusLabels[selectedFile.narrative_status]}
                </Badge>
                <Badge variant="outline">
                  {selectedFile.file_type === 'internal' ? 'Membre' : 'Externe'}
                </Badge>
              </div>
              {selectedFile.alias && (
                <p className="text-muted-foreground italic">Alias: "{selectedFile.alias}"</p>
              )}
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1">{selectedFile.description || 'Aucune description'}</p>
              </div>
              {selectedFile.council_notes && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <Label className="text-xs text-muted-foreground">Notes du Conseil</Label>
                  <p className="text-sm mt-1">{selectedFile.council_notes}</p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleEditFile(selectedFile)} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
