import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useKnowledgeAccess() {
  const { user, isGuardianSupreme } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isArchonte, setIsArchonte] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setIsArchonte(false);
        setIsLoading(false);
        return;
      }

      // Guardian Supreme always has access
      if (isGuardianSupreme) {
        setHasAccess(true);
        setIsArchonte(false);
        setIsLoading(false);
        return;
      }

      // Check if user is an archonte
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'archonte')
        .maybeSingle();

      if (data) {
        setHasAccess(true);
        setIsArchonte(true);
      } else {
        setHasAccess(false);
        setIsArchonte(false);
      }
      
      setIsLoading(false);
    };

    checkAccess();
  }, [user, isGuardianSupreme]);

  return { hasAccess, isArchonte, isGuardianSupreme, isLoading };
}
