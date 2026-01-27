import { useState, useEffect } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, CheckCircle, Circle, Clock, AlertTriangle, 
  User, Calendar, FileText, Trash2, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface KnowledgeTask {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  created_by: string;
  file_id: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  pseudonym: string;
}

const priorities = [
  { value: 'low', label: 'Basse', color: 'bg-muted text-muted-foreground' },
  { value: 'normal', label: 'Normale', color: 'bg-blue-500/20 text-blue-300' },
  { value: 'high', label: 'Haute', color: 'bg-yellow-500/20 text-yellow-300' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500/20 text-red-300' },
];

const statuses = [
  { value: 'pending', label: 'En attente', icon: Circle },
  { value: 'in_progress', label: 'En cours', icon: Clock },
  { value: 'completed', label: 'Terminée', icon: CheckCircle },
];

export function KnowledgeTasksTab() {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<KnowledgeTask | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'normal',
    due_date: '',
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['knowledge-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeTask[];
    }
  });

  const { data: profiles } = useQuery({
    queryKey: ['archonte-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, pseudonym');
      
      if (error) throw error;
      return data as Profile[];
    }
  });

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('knowledge-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_tasks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['knowledge-tasks'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('knowledge_tasks').insert({
        title: formData.title,
        description: formData.description || null,
        assigned_to: formData.assigned_to || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tasks'] });
      toast.success('Tâche créée');
      setIsCreateOpen(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: { status: string; completed_at?: string | null } = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
      
      const { error } = await supabase.from('knowledge_tasks').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tasks'] });
      toast.success('Statut mis à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('knowledge_tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-tasks'] });
      toast.success('Tâche supprimée');
      setSelectedTask(null);
    },
  });

  const resetForm = () => {
    setFormData({ title: '', description: '', assigned_to: '', priority: 'normal', due_date: '' });
  };

  const filteredTasks = tasks?.filter(task => {
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesStatus && matchesPriority;
  });

  const getPriorityInfo = (priority: string) => priorities.find(p => p.value === priority);
  const getStatusInfo = (status: string) => statuses.find(s => s.value === status);
  const getAssigneeName = (id: string | null) => profiles?.find(p => p.id === id)?.pseudonym || 'Non assignée';

  const getDueDateBadge = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) {
      return <Badge className="bg-red-500/20 text-red-300">En retard</Badge>;
    }
    if (isToday(date)) {
      return <Badge className="bg-yellow-500/20 text-yellow-300">Aujourd'hui</Badge>;
    }
    if (isTomorrow(date)) {
      return <Badge className="bg-blue-500/20 text-blue-300">Demain</Badge>;
    }
    return null;
  };

  const TaskForm = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Titre</Label>
        <Input
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Titre de la tâche..."
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Description détaillée..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Assignée à</Label>
          <Select
            value={formData.assigned_to}
            onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Non assignée</SelectItem>
              {profiles?.map(profile => (
                <SelectItem key={profile.id} value={profile.id}>
                  {profile.pseudonym}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priorité</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorities.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date limite</Label>
        <Input
          type="datetime-local"
          value={formData.due_date}
          onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
        />
      </div>

      <Button onClick={() => createMutation.mutate()} className="w-full" disabled={!formData.title}>
        Créer la tâche
      </Button>
    </div>
  );

  // Group tasks by status
  const pendingTasks = filteredTasks?.filter(t => t.status === 'pending') || [];
  const inProgressTasks = filteredTasks?.filter(t => t.status === 'in_progress') || [];
  const completedTasks = filteredTasks?.filter(t => t.status === 'completed') || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-heading">Tâches du Conseil</h2>
          <p className="text-sm text-muted-foreground">Gestion et suivi des actions</p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {statuses.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {priorities.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouvelle tâche
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer une tâche</DialogTitle>
              </DialogHeader>
              <TaskForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban-style columns */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pending */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
              <Circle className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">En attente</span>
              <Badge variant="outline">{pendingTasks.length}</Badge>
            </div>
            <AnimatePresence>
              {pendingTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onStatusChange={(status) => updateStatusMutation.mutate({ id: task.id, status })}
                  onDelete={() => deleteMutation.mutate(task.id)}
                  onClick={() => setSelectedTask(task)}
                  getPriorityInfo={getPriorityInfo}
                  getAssigneeName={getAssigneeName}
                  getDueDateBadge={getDueDateBadge}
                  isGuardianSupreme={isGuardianSupreme}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* In Progress */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="font-medium">En cours</span>
              <Badge variant="outline">{inProgressTasks.length}</Badge>
            </div>
            <AnimatePresence>
              {inProgressTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onStatusChange={(status) => updateStatusMutation.mutate({ id: task.id, status })}
                  onDelete={() => deleteMutation.mutate(task.id)}
                  onClick={() => setSelectedTask(task)}
                  getPriorityInfo={getPriorityInfo}
                  getAssigneeName={getAssigneeName}
                  getDueDateBadge={getDueDateBadge}
                  isGuardianSupreme={isGuardianSupreme}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Completed */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="font-medium">Terminées</span>
              <Badge variant="outline">{completedTasks.length}</Badge>
            </div>
            <AnimatePresence>
              {completedTasks.slice(0, 10).map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task}
                  onStatusChange={(status) => updateStatusMutation.mutate({ id: task.id, status })}
                  onDelete={() => deleteMutation.mutate(task.id)}
                  onClick={() => setSelectedTask(task)}
                  getPriorityInfo={getPriorityInfo}
                  getAssigneeName={getAssigneeName}
                  getDueDateBadge={getDueDateBadge}
                  isGuardianSupreme={isGuardianSupreme}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

interface TaskCardProps {
  task: KnowledgeTask;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onClick: () => void;
  getPriorityInfo: (priority: string) => { value: string; label: string; color: string } | undefined;
  getAssigneeName: (id: string | null) => string;
  getDueDateBadge: (dueDate: string | null) => React.ReactNode;
  isGuardianSupreme: boolean;
}

function TaskCard({ 
  task, 
  onStatusChange, 
  onDelete, 
  onClick,
  getPriorityInfo, 
  getAssigneeName,
  getDueDateBadge,
  isGuardianSupreme
}: TaskCardProps) {
  const priorityInfo = getPriorityInfo(task.priority);
  
  const nextStatus = () => {
    if (task.status === 'pending') return 'in_progress';
    if (task.status === 'in_progress') return 'completed';
    return 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
    >
      <Card 
        className={`bg-card/50 border-border hover:border-primary/50 transition-colors cursor-pointer ${
          task.status === 'completed' ? 'opacity-60' : ''
        }`}
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <Checkbox
                checked={task.status === 'completed'}
                onCheckedChange={() => onStatusChange(task.status === 'completed' ? 'pending' : 'completed')}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </span>
            </div>
            {priorityInfo && (
              <Badge className={`text-xs ${priorityInfo.color}`}>
                {priorityInfo.label}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {task.assigned_to && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {getAssigneeName(task.assigned_to)}
              </span>
            )}
            {task.due_date && (
              <>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'dd/MM', { locale: fr })}
                </span>
                {getDueDateBadge(task.due_date)}
              </>
            )}
          </div>

          <div className="flex gap-1 pt-1">
            {task.status !== 'completed' && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs"
                onClick={(e) => { e.stopPropagation(); onStatusChange(nextStatus()); }}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                {task.status === 'pending' ? 'Démarrer' : 'Terminer'}
              </Button>
            )}
            {isGuardianSupreme && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
