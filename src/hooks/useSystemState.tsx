import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type AlertState = Database['public']['Enums']['alert_state'];

interface SystemState {
  id: string;
  alert_state: AlertState;
  alert_message: string | null;
  changed_by: string | null;
  changed_at: string;
}

export function useSystemState() {
  const { user, isGuardianSupreme } = useAuth();
  const queryClient = useQueryClient();

  const { data: systemState, isLoading } = useQuery({
    queryKey: ['system-state'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_state')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      return data as SystemState;
    },
  });

  const updateAlertState = useMutation({
    mutationFn: async ({ alertState, message }: { alertState: AlertState; message?: string }) => {
      if (!systemState) throw new Error('System state not loaded');
      
      const { error } = await supabase
        .from('system_state')
        .update({
          alert_state: alertState,
          alert_message: message || null,
          changed_by: user?.id,
          changed_at: new Date().toISOString(),
        })
        .eq('id', systemState.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-state'] });
    },
  });

  return {
    systemState,
    alertState: systemState?.alert_state || 'normal',
    alertMessage: systemState?.alert_message,
    isLoading,
    updateAlertState,
    canChangeAlert: isGuardianSupreme,
  };
}
