import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, Plus, Trash2, Lock, Unlock, 
  AlertCircle, Lightbulb, HelpCircle, Pin
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FileAnnotation {
  id: string;
  file_id: string;
  author_id: string;
  content: string;
  annotation_type: string;
  is_private: boolean;
  created_at: string;
  author?: { pseudonym: string };
}

const annotationTypes = [
  { value: 'note', label: 'Note', icon: MessageSquare, color: 'text-muted-foreground' },
  { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-400' },
  { value: 'warning', label: 'Alerte', icon: AlertCircle, color: 'text-yellow-400' },
  { value: 'idea', label: 'Idée', icon: Lightbulb, color: 'text-green-400' },
  { value: 'important', label: 'Important', icon: Pin, color: 'text-red-400' },
];

interface FileAnnotationsProps {
  fileId: string;
}

export function FileAnnotations({ fileId }: FileAnnotationsProps) {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('note');
  const [isPrivate, setIsPrivate] = useState(false);

  const { data: annotations, isLoading } = useQuery({
    queryKey: ['file-annotations', fileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_annotations')
        .select('*')
        .eq('file_id', fileId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get author info
      const authorIds = [...new Set(data.map(a => a.author_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, pseudonym')
        .in('id', authorIds);
      
      return data.map(annotation => ({
        ...annotation,
        author: profiles?.find(p => p.id === annotation.author_id)
      })) as FileAnnotation[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('file_annotations').insert({
        file_id: fileId,
        author_id: user!.id,
        content: newContent,
        annotation_type: newType,
        is_private: isPrivate,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-annotations', fileId] });
      toast.success('Annotation ajoutée');
      setNewContent('');
      setIsAdding(false);
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('file_annotations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-annotations', fileId] });
      toast.success('Annotation supprimée');
    },
  });

  const getTypeInfo = (type: string) => annotationTypes.find(t => t.value === type) || annotationTypes[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Annotations</span>
          {annotations && annotations.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {annotations.length}
            </Badge>
          )}
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="w-3 h-3 mr-1" />
            Annoter
          </Button>
        )}
      </div>

      {/* Add Annotation Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-secondary/30 p-4 rounded-lg space-y-3">
              <Textarea
                placeholder="Votre annotation..."
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={3}
              />
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Type:</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {annotationTypes.map(({ value, label, icon: Icon, color }) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-3 h-3 ${color}`} />
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="private"
                    checked={isPrivate}
                    onCheckedChange={setIsPrivate}
                  />
                  <Label htmlFor="private" className="text-xs flex items-center gap-1">
                    {isPrivate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    Privée
                  </Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => createMutation.mutate()}
                  disabled={!newContent.trim()}
                >
                  Ajouter
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => {
                    setIsAdding(false);
                    setNewContent('');
                  }}
                >
                  Annuler
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Annotations List */}
      {isLoading ? (
        <div className="text-center py-4 text-sm text-muted-foreground">Chargement...</div>
      ) : !annotations || annotations.length === 0 ? (
        <div className="text-center py-4 text-sm text-muted-foreground">
          Aucune annotation sur cette fiche
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {annotations.map((annotation) => {
              const typeInfo = getTypeInfo(annotation.annotation_type);
              const Icon = typeInfo.icon;
              const canDelete = annotation.author_id === user?.id || isGuardianSupreme;

              return (
                <motion.div
                  key={annotation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-secondary/20 p-3 rounded-lg border-l-2 ${
                    annotation.is_private ? 'border-purple-500/50' : 'border-border'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-secondary">
                        {annotation.author?.pseudonym?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {annotation.author?.pseudonym || 'Anonyme'}
                        </span>
                        <Icon className={`w-3 h-3 ${typeInfo.color}`} />
                        {annotation.is_private && (
                          <Badge variant="outline" className="text-xs gap-1">
                            <Lock className="w-2 h-2" />
                            Privée
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(annotation.created_at), 'dd MMM à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{annotation.content}</p>
                    </div>

                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(annotation.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
