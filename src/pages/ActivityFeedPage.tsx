import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Calendar, Plus, Pin, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface FeedItem {
  id: string;
  author_id: string;
  activity_type: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

const typeLabels: Record<string, { label: string; icon: string }> = {
  announcement: { label: 'Annonce', icon: '📜' },
  event: { label: 'Événement', icon: '⚔️' },
  promotion: { label: 'Promotion', icon: '⬆️' },
  judgment: { label: 'Jugement', icon: '⚖️' },
  warning: { label: 'Avertissement', icon: '⚠️' },
};

const ActivityFeedPage = () => {
  const { user, isGuardianSupreme } = useAuth();
  const { toast } = useToast();
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('announcement');

  const fetchFeed = async () => {
    const { data } = await supabase
      .from('activity_feed')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) setFeed(data as FeedItem[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchFeed();

    const channel = supabase
      .channel('feed-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_feed' }, () => fetchFeed())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handlePost = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const { error } = await supabase.from('activity_feed').insert({
      author_id: user?.id,
      activity_type: newType,
      title: newTitle.trim(),
      content: newContent.trim(),
    });
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      setNewTitle('');
      setNewContent('');
      setDialogOpen(false);
      toast({ title: 'Publication ajoutée' });
    }
  };

  const togglePin = async (item: FeedItem) => {
    await supabase.from('activity_feed').update({ is_pinned: !item.is_pinned }).eq('id', item.id);
    fetchFeed();
  };

  const deleteItem = async (id: string) => {
    await supabase.from('activity_feed').delete().eq('id', id);
    fetchFeed();
    toast({ title: 'Publication supprimée' });
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <MainLayout>
      <div className="min-h-[calc(100vh-12rem)] space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl tracking-[0.15em] text-gold flex items-center gap-2">
              <Calendar className="w-6 h-6" /> FIL D'ACTUALITÉ
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Chroniques de l'Ordre</p>
          </div>
          {isGuardianSupreme && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="w-4 h-4" /> Publier</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-gold-dim/30">
                <DialogHeader>
                  <DialogTitle className="font-heading text-gold">Nouvelle publication</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => (
                        <SelectItem key={k} value={k}>{v.icon} {v.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Titre" className="bg-secondary/50" />
                  <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Contenu..." className="bg-secondary/50 min-h-[100px]" />
                  <Button onClick={handlePost} className="w-full" disabled={!newTitle.trim() || !newContent.trim()}>
                    Publier
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </motion.div>

        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-4">
            {feed.map((item, i) => {
              const typeInfo = typeLabels[item.activity_type] || typeLabels.announcement;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`ritual-card p-5 ${item.is_pinned ? 'border-gold/30' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">{typeInfo.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {item.is_pinned && <Pin className="w-3 h-3 text-gold" />}
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded">
                          {typeInfo.label}
                        </span>
                      </div>
                      <h3 className="font-heading text-foreground text-base mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(item.created_at)}
                      </p>
                    </div>
                    {isGuardianSupreme && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => togglePin(item)} className="h-8 w-8">
                          <Pin className={`w-3.5 h-3.5 ${item.is_pinned ? 'text-gold' : 'text-muted-foreground'}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)} className="h-8 w-8 text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {feed.length === 0 && !isLoading && (
              <div className="text-center py-12 text-muted-foreground italic">
                Aucune publication pour l'instant.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </MainLayout>
  );
};

export default ActivityFeedPage;
