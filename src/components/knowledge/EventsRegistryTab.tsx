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
import { Plus, Calendar, Edit, Trash2, Link } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RegistryEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_type: string;
  created_by: string;
  created_at: string;
}

const eventTypes = [
  { value: 'general', label: 'Général' },
  { value: 'assembly', label: 'Assemblée' },
  { value: 'ritual', label: 'Rituel' },
  { value: 'decision', label: 'Décision' },
  { value: 'rupture', label: 'Rupture' },
  { value: 'initiation', label: 'Initiation' },
  { value: 'elevation', label: 'Élévation' },
];

const eventTypeColors: Record<string, string> = {
  general: 'bg-muted text-muted-foreground',
  assembly: 'bg-blue-500/20 text-blue-300',
  ritual: 'bg-purple-500/20 text-purple-300',
  decision: 'bg-green-500/20 text-green-300',
  rupture: 'bg-red-500/20 text-red-300',
  initiation: 'bg-yellow-500/20 text-yellow-300',
  elevation: 'bg-primary/20 text-primary',
};

export function EventsRegistryTab() {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<RegistryEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'general',
  });

  const { data: events, isLoading } = useQuery({
    queryKey: ['events-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events_registry')
        .select('*')
        .order('event_date', { ascending: false });
      
      if (error) throw error;
      return data as RegistryEvent[];
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('events_registry').insert({
        ...formData,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-registry'] });
      toast.success('Événement enregistré');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement');
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase.from('events_registry').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-registry'] });
      toast.success('Événement mis à jour');
      setSelectedEvent(null);
      setIsEditMode(false);
      resetForm();
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events_registry').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events-registry'] });
      toast.success('Événement supprimé');
      setSelectedEvent(null);
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: new Date().toISOString().split('T')[0],
      event_type: 'general',
    });
  };

  const handleEditEvent = (event: RegistryEvent) => {
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_type: event.event_type,
    });
    setSelectedEvent(event);
    setIsEditMode(true);
  };

  const filteredEvents = events?.filter(event => 
    filterType === 'all' || event.event_type === filterType
  );

  // Group events by year
  const groupedEvents = filteredEvents?.reduce((acc, event) => {
    const year = new Date(event.event_date).getFullYear().toString();
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<string, RegistryEvent[]>);

  const EventForm = ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel: string }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Titre de l'événement"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select
            value={formData.event_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {eventTypes.map(({ value, label }) => (
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
          placeholder="Description détaillée de l'événement..."
          rows={5}
        />
      </div>

      <Button onClick={onSubmit} className="w-full" disabled={!formData.title || !formData.description}>
        {submitLabel}
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading">Registre des Événements</h2>
          <p className="text-sm text-muted-foreground">Chronique de l'Ordre</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={filterType}
            onValueChange={setFilterType}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {eventTypes.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enregistrer un événement</DialogTitle>
              </DialogHeader>
              <EventForm
                onSubmit={() => createEventMutation.mutate()}
                submitLabel="Enregistrer"
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : !groupedEvents || Object.keys(groupedEvents).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Aucun événement enregistré
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([year, yearEvents]) => (
              <div key={year}>
                <h3 className="text-lg font-heading text-primary mb-4 border-b border-border pb-2">
                  {year}
                </h3>
                <div className="relative pl-6 border-l-2 border-border space-y-4">
                  <AnimatePresence>
                    {yearEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="relative"
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-[25px] w-3 h-3 rounded-full bg-primary" />
                        
                        <Card 
                          className="bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedEvent(event);
                            setIsEditMode(false);
                          }}
                        >
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base flex items-center gap-2">
                                  <Calendar className="w-4 h-4 text-muted-foreground" />
                                  {event.title}
                                </CardTitle>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(event.event_date), 'dd MMMM yyyy', { locale: fr })}
                                </p>
                              </div>
                              <Badge className={eventTypeColors[event.event_type]}>
                                {eventTypes.find(t => t.value === event.event_type)?.label}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Modifier l\'événement' : selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {isEditMode ? (
            <EventForm
              onSubmit={() => updateEventMutation.mutate({ id: selectedEvent!.id, data: formData })}
              submitLabel="Enregistrer les modifications"
            />
          ) : selectedEvent && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={eventTypeColors[selectedEvent.event_type]}>
                  {eventTypes.find(t => t.value === selectedEvent.event_type)?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(selectedEvent.event_date), 'dd MMMM yyyy', { locale: fr })}
                </span>
              </div>
              
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedEvent.description}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button onClick={() => handleEditEvent(selectedEvent)} className="flex-1">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                {isGuardianSupreme && (
                  <Button 
                    variant="destructive" 
                    onClick={() => deleteEventMutation.mutate(selectedEvent.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
