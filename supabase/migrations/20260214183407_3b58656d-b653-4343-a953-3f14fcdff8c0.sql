
-- =============================================
-- TRIBUNAL SYSTEM
-- =============================================

-- Tribunal sessions
CREATE TABLE public.tribunal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  session_type TEXT NOT NULL DEFAULT 'trial' CHECK (session_type IN ('trial', 'hearing', 'deliberation')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'waiting_room', 'in_progress', 'deliberation', 'concluded')),
  verdict TEXT,
  verdict_details TEXT,
  accused_id UUID,
  presided_by UUID NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  daily_room_name TEXT,
  daily_room_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tribunal participants (witnesses, accused, judges, observers)
CREATE TABLE public.tribunal_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tribunal_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'observer' CHECK (role IN ('judge', 'accused', 'witness', 'defense', 'observer')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'in_waiting_room', 'admitted', 'dismissed')),
  invited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  admitted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  UNIQUE(session_id, user_id)
);

-- Tribunal chat messages (separate from main messages)
CREATE TABLE public.tribunal_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.tribunal_sessions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'public' CHECK (message_type IN ('public', 'judges_only', 'system')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on tribunal tables
ALTER TABLE public.tribunal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribunal_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribunal_messages ENABLE ROW LEVEL SECURITY;

-- Tribunal sessions policies
CREATE POLICY "Knowledge access can view sessions" ON public.tribunal_sessions
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Guardian can create sessions" ON public.tribunal_sessions
  FOR INSERT WITH CHECK (is_guardian_supreme());

CREATE POLICY "Guardian can update sessions" ON public.tribunal_sessions
  FOR UPDATE USING (is_guardian_supreme());

CREATE POLICY "Guardian can delete sessions" ON public.tribunal_sessions
  FOR DELETE USING (is_guardian_supreme());

-- Participants can view sessions they are invited to
CREATE POLICY "Participants can view own sessions" ON public.tribunal_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tribunal_participants
      WHERE session_id = tribunal_sessions.id AND user_id = auth.uid()
    )
  );

-- Tribunal participants policies
CREATE POLICY "Knowledge access can view participants" ON public.tribunal_participants
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Participants can view own participation" ON public.tribunal_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Guardian can manage participants" ON public.tribunal_participants
  FOR INSERT WITH CHECK (is_guardian_supreme());

CREATE POLICY "Guardian can update participants" ON public.tribunal_participants
  FOR UPDATE USING (is_guardian_supreme() OR user_id = auth.uid());

CREATE POLICY "Guardian can delete participants" ON public.tribunal_participants
  FOR DELETE USING (is_guardian_supreme());

-- Tribunal messages policies
CREATE POLICY "Session participants can view public messages" ON public.tribunal_messages
  FOR SELECT USING (
    message_type = 'public' AND EXISTS (
      SELECT 1 FROM public.tribunal_participants
      WHERE session_id = tribunal_messages.session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Judges can view judges_only messages" ON public.tribunal_messages
  FOR SELECT USING (
    message_type = 'judges_only' AND EXISTS (
      SELECT 1 FROM public.tribunal_participants
      WHERE session_id = tribunal_messages.session_id AND user_id = auth.uid() AND role = 'judge'
    )
  );

CREATE POLICY "Knowledge access can view all messages" ON public.tribunal_messages
  FOR SELECT USING (has_knowledge_access());

CREATE POLICY "Admitted participants can send messages" ON public.tribunal_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.tribunal_participants
      WHERE session_id = tribunal_messages.session_id AND user_id = auth.uid() AND status = 'admitted'
    )
  );

-- =============================================
-- ENHANCED MESSAGES (conversations)
-- =============================================

-- Add conversation threading to messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS parent_message_id UUID REFERENCES public.messages(id);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for tribunal and messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.tribunal_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tribunal_participants;

-- Trigger for updated_at on tribunal_sessions
CREATE TRIGGER update_tribunal_sessions_updated_at
  BEFORE UPDATE ON public.tribunal_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
