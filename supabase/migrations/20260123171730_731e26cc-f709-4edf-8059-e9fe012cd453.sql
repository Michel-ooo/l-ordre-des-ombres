
-- Create enums for the knowledge module
CREATE TYPE public.file_type AS ENUM ('internal', 'external');
CREATE TYPE public.narrative_status AS ENUM ('neutral', 'observed', 'ally', 'at_risk', 'protected', 'unknown');
CREATE TYPE public.relationship_type AS ENUM ('alliance', 'conflict', 'influence', 'observation', 'unknown');
CREATE TYPE public.judgment_effect AS ENUM ('rank_change', 'access_grant', 'access_revoke', 'symbolic_status', 'other');

-- Tool 1: Knowledge Files (Fiches de Savoir)
CREATE TABLE public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  alias TEXT,
  file_type public.file_type NOT NULL DEFAULT 'external',
  narrative_status public.narrative_status NOT NULL DEFAULT 'neutral',
  description TEXT,
  council_notes TEXT,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tool 5: Events Registry (Registre des événements)
CREATE TABLE public.events_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  event_type TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link table: Files to Events
CREATE TABLE public.file_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events_registry(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(file_id, event_id)
);

-- Tool 2: Council Opinions (Avis du Conseil)
CREATE TABLE public.council_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  invoked_rules TEXT[],
  options JSONB NOT NULL DEFAULT '[]',
  recommendation TEXT,
  dissenting_notes TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  file_id UUID REFERENCES public.knowledge_files(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Comments on opinions by Archontes
CREATE TABLE public.opinion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opinion_id UUID NOT NULL REFERENCES public.council_opinions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tool 3: Judgments (Jugements)
CREATE TABLE public.judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opinion_id UUID NOT NULL REFERENCES public.council_opinions(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.knowledge_files(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  decision TEXT NOT NULL,
  effects JSONB NOT NULL DEFAULT '[]',
  executed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tool 4: File Relationships (Cartographie d'influence)
CREATE TABLE public.file_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file_id UUID NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  target_file_id UUID NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  relationship_type public.relationship_type NOT NULL DEFAULT 'unknown',
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_file_id, target_file_id)
);

-- Tool 6: Living Rules (Règles vivantes)
CREATE TABLE public.living_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  rule_text TEXT NOT NULL,
  interpretations TEXT[],
  council_comments TEXT,
  precedents TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Link table: Rules to Opinions
CREATE TABLE public.rule_opinions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES public.living_rules(id) ON DELETE CASCADE,
  opinion_id UUID NOT NULL REFERENCES public.council_opinions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rule_id, opinion_id)
);

-- Enable RLS on all tables
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.council_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opinion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.living_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_opinions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is archonte or guardian
CREATE OR REPLACE FUNCTION public.has_knowledge_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('guardian_supreme', 'archonte')
  )
$$;

-- RLS Policies for knowledge_files
CREATE POLICY "Knowledge access can view files" ON public.knowledge_files
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert files" ON public.knowledge_files
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update files" ON public.knowledge_files
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Guardian can delete files" ON public.knowledge_files
  FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for events_registry
CREATE POLICY "Knowledge access can view events" ON public.events_registry
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert events" ON public.events_registry
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update events" ON public.events_registry
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Guardian can delete events" ON public.events_registry
  FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for file_events
CREATE POLICY "Knowledge access can view file_events" ON public.file_events
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert file_events" ON public.file_events
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update file_events" ON public.file_events
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Knowledge access can delete file_events" ON public.file_events
  FOR DELETE USING (has_knowledge_access());

-- RLS Policies for council_opinions
CREATE POLICY "Knowledge access can view opinions" ON public.council_opinions
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert opinions" ON public.council_opinions
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update opinions" ON public.council_opinions
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Guardian can delete opinions" ON public.council_opinions
  FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for opinion_comments
CREATE POLICY "Knowledge access can view comments" ON public.opinion_comments
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert comments" ON public.opinion_comments
  FOR INSERT WITH CHECK (has_knowledge_access() AND auth.uid() = author_id);
CREATE POLICY "Authors can delete own comments" ON public.opinion_comments
  FOR DELETE USING (auth.uid() = author_id OR is_guardian_supreme());

-- RLS Policies for judgments
CREATE POLICY "Knowledge access can view judgments" ON public.judgments
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Guardian can insert judgments" ON public.judgments
  FOR INSERT WITH CHECK (is_guardian_supreme());
CREATE POLICY "Guardian can update judgments" ON public.judgments
  FOR UPDATE USING (is_guardian_supreme());
CREATE POLICY "Guardian can delete judgments" ON public.judgments
  FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for file_relationships
CREATE POLICY "Knowledge access can view relationships" ON public.file_relationships
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert relationships" ON public.file_relationships
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update relationships" ON public.file_relationships
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Knowledge access can delete relationships" ON public.file_relationships
  FOR DELETE USING (has_knowledge_access());

-- RLS Policies for living_rules
CREATE POLICY "Knowledge access can view rules" ON public.living_rules
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert rules" ON public.living_rules
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update rules" ON public.living_rules
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Guardian can delete rules" ON public.living_rules
  FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for rule_opinions
CREATE POLICY "Knowledge access can view rule_opinions" ON public.rule_opinions
  FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert rule_opinions" ON public.rule_opinions
  FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update rule_opinions" ON public.rule_opinions
  FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Knowledge access can delete rule_opinions" ON public.rule_opinions
  FOR DELETE USING (has_knowledge_access());

-- Create triggers for updated_at
CREATE TRIGGER update_knowledge_files_updated_at
  BEFORE UPDATE ON public.knowledge_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_registry_updated_at
  BEFORE UPDATE ON public.events_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_council_opinions_updated_at
  BEFORE UPDATE ON public.council_opinions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_living_rules_updated_at
  BEFORE UPDATE ON public.living_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
