-- 1. Enum pour les états d'alerte
CREATE TYPE public.alert_state AS ENUM ('normal', 'vigilance', 'crise');

-- 2. Enum pour les types de demandes officielles
CREATE TYPE public.request_type AS ENUM ('entry', 'exit', 'pardon', 'access', 'promotion', 'other');

-- 3. Enum pour le statut des demandes
CREATE TYPE public.request_status AS ENUM ('pending', 'approved', 'rejected', 'adjourned');

-- 4. Table des demandes officielles au Conseil
CREATE TABLE public.council_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  request_type request_type NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status request_status NOT NULL DEFAULT 'pending',
  council_response TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Table des votes du Conseil sur les avis
CREATE TYPE public.vote_choice AS ENUM ('pour', 'contre', 'abstention');

CREATE TABLE public.council_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opinion_id UUID NOT NULL REFERENCES public.council_opinions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL,
  vote vote_choice NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(opinion_id, voter_id)
);

-- 6. Table de l'historique automatique des actions
CREATE TYPE public.action_type AS ENUM ('file_created', 'file_updated', 'file_deleted', 'judgment_issued', 'status_changed', 'vote_cast', 'request_submitted', 'request_resolved', 'opinion_created', 'event_created', 'rule_created', 'alert_changed');

CREATE TABLE public.action_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_type action_type NOT NULL,
  actor_id UUID NOT NULL,
  target_id UUID,
  target_type TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Table des accès temporaires
CREATE TABLE public.temporary_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  resource_type TEXT NOT NULL, -- 'file', 'tool', etc.
  resource_id UUID,
  granted_by UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Table pour l'état d'alerte global (singleton)
CREATE TABLE public.system_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_state alert_state NOT NULL DEFAULT 'normal',
  alert_message TEXT,
  changed_by UUID,
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Table pour les suggestions du Savoir
CREATE TABLE public.knowledge_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_type TEXT NOT NULL, -- 'link_files', 'similar_event', 'related_rule'
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.council_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.temporary_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for council_requests
CREATE POLICY "Users can create own requests" ON public.council_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can view own requests" ON public.council_requests
  FOR SELECT USING (auth.uid() = requester_id);

CREATE POLICY "Knowledge access can view all requests" ON public.council_requests
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Knowledge access can update requests" ON public.council_requests
  FOR UPDATE USING (has_knowledge_access());

-- RLS Policies for council_votes
CREATE POLICY "Knowledge access can view votes" ON public.council_votes
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Knowledge access can insert votes" ON public.council_votes
  FOR INSERT WITH CHECK (has_knowledge_access() AND auth.uid() = voter_id);

CREATE POLICY "Voters can update own votes" ON public.council_votes
  FOR UPDATE USING (has_knowledge_access() AND auth.uid() = voter_id);

CREATE POLICY "Guardian can delete votes" ON public.council_votes
  FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for action_history
CREATE POLICY "Knowledge access can view history" ON public.action_history
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Knowledge access can insert history" ON public.action_history
  FOR INSERT WITH CHECK (has_knowledge_access());

-- RLS Policies for temporary_access
CREATE POLICY "Users can view own temporary access" ON public.temporary_access
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Knowledge access can view all temp access" ON public.temporary_access
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Knowledge access can manage temp access" ON public.temporary_access
  FOR INSERT WITH CHECK (has_knowledge_access());

CREATE POLICY "Knowledge access can update temp access" ON public.temporary_access
  FOR UPDATE USING (has_knowledge_access());

CREATE POLICY "Knowledge access can delete temp access" ON public.temporary_access
  FOR DELETE USING (has_knowledge_access());

-- RLS Policies for system_state
CREATE POLICY "Everyone can view system state" ON public.system_state
  FOR SELECT USING (true);

CREATE POLICY "Guardian can update system state" ON public.system_state
  FOR UPDATE USING (is_guardian_supreme());

CREATE POLICY "Guardian can insert system state" ON public.system_state
  FOR INSERT WITH CHECK (is_guardian_supreme());

-- RLS Policies for knowledge_suggestions
CREATE POLICY "Knowledge access can view suggestions" ON public.knowledge_suggestions
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Knowledge access can insert suggestions" ON public.knowledge_suggestions
  FOR INSERT WITH CHECK (has_knowledge_access());

CREATE POLICY "Knowledge access can update suggestions" ON public.knowledge_suggestions
  FOR UPDATE USING (has_knowledge_access());

-- Triggers for updated_at
CREATE TRIGGER update_council_requests_updated_at
  BEFORE UPDATE ON public.council_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial system state
INSERT INTO public.system_state (alert_state, alert_message) VALUES ('normal', NULL);