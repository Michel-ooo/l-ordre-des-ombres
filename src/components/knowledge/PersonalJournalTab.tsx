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
import { Plus, BookOpen, Edit, Trash2, Search, Lock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

const moods = [
  { value: 'serene', label: '🌙 Serein', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'vigilant', label: '👁️ Vigilant', color: 'bg-yellow-500/20 text-yellow-300' },
  { value: 'troubled', label: '🌊 Troublé', color: 'bg-purple-500/20 text-purple-300' },
  { value: 'inspired', label: '✨ Inspiré', color: 'bg-green-500/20 text-green-300' },
  { value: 'reflective', label: '🔮 Méditatif', color: 'bg-indigo-500/20 text-indigo-300' },
  { value: 'determined', label: '⚔️ Déterminé', color: 'bg-red-500/20 text-red-300' },
];

export function PersonalJournalTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    tags: '',
  });

  const { data: entries, isLoading } = useQuery({
    queryKey: ['personal-journal', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('personal_journal')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('personal_journal').insert({
        user_id: user!.id,
        title: formData.title,
        content: formData.content,
        mood: formData.mood || null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-journal'] });
      toast.success('Entrée ajoutée au journal');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('personal_journal').update({
        title: data.title,
        content: data.content,
        mood: data.mood || null,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-journal'] });
      toast.success('Entrée mise à jour');
      setSelectedEntry(null);
      setIsEditMode(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('personal_journal').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal-journal'] });
      toast.success('Entrée supprimée');
      setSelectedEntry(null);
    },
  });

  const resetForm = () => {
    setFormData({ title: '', content: '', mood: '', tags: '' });
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || '',
      tags: entry.tags?.join(', ') || '',
    });
    setSelectedEntry(entry);
    setIsEditMode(true);
  };

  const filteredEntries = entries?.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = filterMood === 'all' || entry.mood === filterMood;
    return matchesSearch && matchesMood;
  });

  const getMoodInfo = (mood: string | null) => {
    return moods.find(m => m.value === mood) || null;
  };

  const EntryForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Titre de l'entrée..."
        />
      </div>

      <div className="space-y-2">
        <Label>État d'esprit</Label>
        <Select
          value={formData.mood}
          onValueChange={(value) => setFormData(prev => ({ ...prev, mood: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choisir un état..." />
          </SelectTrigger>
          <SelectContent>
            {moods.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Contenu</Label>
        <Textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Vos réflexions, observations, méditations..."
          rows={8}
          className="font-body"
        />
      </div>

      <div className="space-y-2">
        <Label>Tags (séparés par des virgules)</Label>
        <Input
          value={formData.tags}
          onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
          placeholder="rituel, méditation, vision..."
        />
      </div>

      <Button onClick={onSubmit} className="w-full" disabled={!formData.title || !formData.content}>
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-heading flex items-center gap-2">
              Journal de Bord
              <Lock className="w-4 h-4 text-muted-foreground" />
            </h2>
            <p className="text-sm text-muted-foreground">Vos réflexions personnelles (privées)</p>
          </div>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle entrée
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvelle entrée du journal</DialogTitle>
            </DialogHeader>
            <EntryForm
              onSubmit={() => createMutation.mutate()}
              submitLabel="Enregistrer"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans le journal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterMood} onValueChange={setFilterMood}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="État d'esprit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les états</SelectItem>
            {moods.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Entries List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : !filteredEntries || filteredEntries.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {entries?.length === 0 
              ? "Votre journal est vide. Commencez à écrire vos réflexions..."
              : "Aucune entrée ne correspond à votre recherche"
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredEntries.map((entry, index) => {
              const moodInfo = getMoodInfo(entry.mood);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setIsEditMode(false);
                    }}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{entry.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(entry.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                            </span>
                          </div>
                        </div>
                        {moodInfo && (
                          <Badge className={moodInfo.color}>{moodInfo.label}</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                        {entry.content}
                      </p>
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {entry.tags.map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Entry Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={(open) => !open && setSelectedEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Modifier l\'entrée' : selectedEntry?.title}
            </DialogTitle>
          </DialogHeader>
          {isEditMode ? (
            <EntryForm
              onSubmit={() => updateMutation.mutate({ id: selectedEntry!.id, data: formData })}
              submitLabel="Enregistrer les modifications"
            />
          ) : selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                {getMoodInfo(selectedEntry.mood) && (
                  <Badge className={getMoodInfo(selectedEntry.mood)!.color}>
                    {getMoodInfo(selectedEntry.mood)!.label}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedEntry.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                </span>
              </div>
              
              <div className="bg-secondary/30 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{selectedEntry.content}</p>
              </div>

              {selectedEntry.tags && selectedEntry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedEntry.tags.map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleEditEntry(selectedEntry)} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteMutation.mutate(selectedEntry.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
