import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Tag, X, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface FileTag {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}

interface FileTagAssignment {
  id: string;
  file_id: string;
  tag_id: string;
  tag?: FileTag;
}

const predefinedColors = [
  '#8B5CF6', // Purple
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#84CC16', // Lime
];

interface FileTagsManagerProps {
  fileId: string;
  compact?: boolean;
}

export function FileTagsManager({ fileId, compact = false }: FileTagsManagerProps) {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(predefinedColors[0]);

  const { data: allTags } = useQuery({
    queryKey: ['file-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as FileTag[];
    }
  });

  const { data: fileTagAssignments } = useQuery({
    queryKey: ['file-tag-assignments', fileId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_tag_assignments')
        .select('*, file_tags(*)')
        .eq('file_id', fileId);
      
      if (error) throw error;
      return data.map(assignment => ({
        ...assignment,
        tag: assignment.file_tags as FileTag
      })) as (FileTagAssignment & { tag: FileTag })[];
    }
  });

  const createTagMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from('file_tags').insert({
        name: newTagName.trim(),
        color: newTagColor,
        created_by: user!.id,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['file-tags'] });
      toast.success('Tag créé');
      setNewTagName('');
      setIsCreateOpen(false);
      // Auto-assign to current file
      assignTagMutation.mutate(newTag.id);
    },
    onError: () => {
      toast.error('Erreur lors de la création du tag');
    },
  });

  const assignTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const { error } = await supabase.from('file_tag_assignments').insert({
        file_id: fileId,
        tag_id: tagId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-tag-assignments', fileId] });
      toast.success('Tag ajouté');
    },
    onError: () => {
      toast.error('Ce tag est déjà assigné');
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase.from('file_tag_assignments').delete().eq('id', assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file-tag-assignments', fileId] });
      toast.success('Tag retiré');
    },
  });

  const assignedTagIds = fileTagAssignments?.map(a => a.tag_id) || [];
  const availableTags = allTags?.filter(tag => !assignedTagIds.includes(tag.id)) || [];

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1 items-center">
        {fileTagAssignments?.map(assignment => (
          <Badge 
            key={assignment.id}
            style={{ backgroundColor: `${assignment.tag.color}20`, color: assignment.tag.color }}
            className="text-xs group cursor-pointer"
            onClick={() => removeTagMutation.mutate(assignment.id)}
          >
            {assignment.tag.name}
            <X className="w-2 h-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Badge>
        ))}
        <Popover open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
              <Plus className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Ajouter un tag</p>
              {availableTags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => {
                        assignTagMutation.mutate(tag.id);
                        setIsAssignOpen(false);
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Tous les tags sont assignés</p>
              )}
              <div className="border-t pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 h-7"
                  onClick={() => {
                    setIsAssignOpen(false);
                    setIsCreateOpen(true);
                  }}
                >
                  <Plus className="w-3 h-3" />
                  Créer un nouveau tag
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Créer un tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom du tag</Label>
                <Input
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="#secret, #rituel, #urgent..."
                />
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex flex-wrap gap-2">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      className={`w-6 h-6 rounded-full transition-transform ${newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewTagColor(color)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Aperçu:</span>
                <Badge style={{ backgroundColor: `${newTagColor}20`, color: newTagColor }}>
                  {newTagName || 'Tag'}
                </Badge>
              </div>
              <Button 
                onClick={() => createTagMutation.mutate()} 
                className="w-full"
                disabled={!newTagName.trim()}
              >
                Créer et assigner
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Tags</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {fileTagAssignments?.map(assignment => (
          <Badge 
            key={assignment.id}
            style={{ backgroundColor: `${assignment.tag.color}20`, color: assignment.tag.color }}
            className="group cursor-pointer"
            onClick={() => removeTagMutation.mutate(assignment.id)}
          >
            {assignment.tag.name}
            <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Badge>
        ))}
        
        <Popover open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1">
              <Plus className="w-3 h-3" />
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Ajouter un tag</p>
              {availableTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <Badge
                      key={tag.id}
                      style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                      className="cursor-pointer hover:opacity-80"
                      onClick={() => {
                        assignTagMutation.mutate(tag.id);
                        setIsAssignOpen(false);
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
              <div className="border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    setIsAssignOpen(false);
                    setIsCreateOpen(true);
                  }}
                >
                  <Palette className="w-3 h-3" />
                  Créer un nouveau tag
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Créer un tag</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nom du tag</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="#secret, #rituel, #urgent..."
              />
            </div>
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {predefinedColors.map(color => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full transition-transform ${newTagColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewTagColor(color)}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Aperçu:</span>
              <Badge style={{ backgroundColor: `${newTagColor}20`, color: newTagColor }}>
                {newTagName || 'Nouveau tag'}
              </Badge>
            </div>
            <Button 
              onClick={() => createTagMutation.mutate()} 
              className="w-full"
              disabled={!newTagName.trim()}
            >
              Créer et assigner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for filtering by tags
export function TagFilter({ 
  selectedTags, 
  onTagsChange 
}: { 
  selectedTags: string[]; 
  onTagsChange: (tags: string[]) => void;
}) {
  const { data: tags } = useQuery({
    queryKey: ['file-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('file_tags')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as FileTag[];
    }
  });

  if (!tags || tags.length === 0) return null;

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => (
        <Badge
          key={tag.id}
          style={{ 
            backgroundColor: selectedTags.includes(tag.id) ? tag.color : `${tag.color}20`, 
            color: selectedTags.includes(tag.id) ? '#fff' : tag.color 
          }}
          className="cursor-pointer transition-colors"
          onClick={() => toggleTag(tag.id)}
        >
          {tag.name}
        </Badge>
      ))}
      {selectedTags.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-5 px-2 text-xs"
          onClick={() => onTagsChange([])}
        >
          Effacer
        </Button>
      )}
    </div>
  );
}
