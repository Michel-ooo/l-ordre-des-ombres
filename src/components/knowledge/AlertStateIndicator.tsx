import { useState } from 'react';
import { useSystemState } from '@/hooks/useSystemState';
import { useActionHistory } from '@/hooks/useActionHistory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Shield, Flame, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type AlertState = Database['public']['Enums']['alert_state'];

const alertConfig: Record<AlertState, {
  icon: React.ReactNode;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  normal: {
    icon: <Shield className="w-4 h-4" />,
    label: 'Normal',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
  },
  vigilance: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: 'Vigilance',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
  },
  crise: {
    icon: <Flame className="w-4 h-4" />,
    label: 'Crise',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
};

export function AlertStateIndicator() {
  const { alertState, alertMessage, updateAlertState, canChangeAlert, isLoading } = useSystemState();
  const { logAction } = useActionHistory();
  const [isOpen, setIsOpen] = useState(false);
  const [newState, setNewState] = useState<AlertState>(alertState);
  const [newMessage, setNewMessage] = useState(alertMessage || '');

  const config = alertConfig[alertState];

  const handleSave = async () => {
    try {
      await updateAlertState.mutateAsync({ alertState: newState, message: newMessage });
      logAction.mutate({
        actionType: 'alert_changed',
        description: `État d'alerte changé: ${alertConfig[alertState].label} → ${alertConfig[newState].label}`,
        metadata: { from: alertState, to: newState },
      });
      toast.success('État d\'alerte mis à jour');
      setIsOpen(false);
    } catch {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <span className={config.color}>{config.icon}</span>
      <div className="flex-1">
        <Badge className={`${config.bgColor} ${config.color} border-0`}>
          {config.label}
        </Badge>
        {alertMessage && (
          <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
            {alertMessage}
          </p>
        )}
      </div>
      
      {canChangeAlert && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'état d'alerte</DialogTitle>
              <DialogDescription>
                L'état d'alerte affecte l'ensemble de l'Ordre.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>État</Label>
                <Select value={newState} onValueChange={(v: AlertState) => setNewState(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(alertConfig).map(([value, cfg]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <span className={cfg.color}>{cfg.icon}</span>
                          {cfg.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Message (optionnel)</Label>
                <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Message explicatif..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} className="w-full" disabled={updateAlertState.isPending}>
                Appliquer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
