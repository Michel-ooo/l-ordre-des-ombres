import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Database } from '@/integrations/supabase/types';

type ActionType = Database['public']['Enums']['action_type'];

interface LogActionParams {
  actionType: ActionType;
  targetId?: string;
  targetType?: string;
  description: string;
  metadata?: Record<string, unknown>;
}

export function useActionHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const logAction = useMutation({
    mutationFn: async ({ actionType, targetId, targetType, description, metadata }: LogActionParams) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase.from('action_history').insert([{
        action_type: actionType,
        actor_id: user.id,
        target_id: targetId || null,
        target_type: targetType || null,
        description,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : {},
      }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action-history'] });
    },
  });

  return { logAction };
}
