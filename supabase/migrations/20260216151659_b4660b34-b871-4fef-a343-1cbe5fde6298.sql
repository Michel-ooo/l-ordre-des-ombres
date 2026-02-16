
-- ===========================================
-- 1. BADGES / MÉDAILLES
-- ===========================================
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏅',
  category TEXT NOT NULL DEFAULT 'general',
  rarity TEXT NOT NULL DEFAULT 'common',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Guardian can manage badges" ON public.badges FOR INSERT WITH CHECK (is_guardian_supreme());
CREATE POLICY "Guardian can update badges" ON public.badges FOR UPDATE USING (is_guardian_supreme());
CREATE POLICY "Guardian can delete badges" ON public.badges FOR DELETE USING (is_guardian_supreme());

CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_by UUID NOT NULL,
  reason TEXT,
  awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Guardian can award badges" ON public.user_badges FOR INSERT WITH CHECK (is_guardian_supreme());
CREATE POLICY "Guardian can revoke badges" ON public.user_badges FOR DELETE USING (is_guardian_supreme());

-- ===========================================
-- 2. FIL D'ACTUALITÉ
-- ===========================================
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  activity_type TEXT NOT NULL DEFAULT 'announcement',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view feed" ON public.activity_feed FOR SELECT USING (true);
CREATE POLICY "Guardian can post to feed" ON public.activity_feed FOR INSERT WITH CHECK (is_guardian_supreme());
CREATE POLICY "Guardian can update feed" ON public.activity_feed FOR UPDATE USING (is_guardian_supreme());
CREATE POLICY "Guardian can delete feed" ON public.activity_feed FOR DELETE USING (is_guardian_supreme());

-- ===========================================
-- 3. MESSAGES DE GROUPE (channels)
-- ===========================================
CREATE TABLE public.group_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT false,
  min_grade TEXT DEFAULT 'novice',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view public channels" ON public.group_channels FOR SELECT USING (NOT is_private OR is_guardian_supreme());
CREATE POLICY "Guardian can manage channels" ON public.group_channels FOR INSERT WITH CHECK (is_guardian_supreme());
CREATE POLICY "Guardian can update channels" ON public.group_channels FOR UPDATE USING (is_guardian_supreme());
CREATE POLICY "Guardian can delete channels" ON public.group_channels FOR DELETE USING (is_guardian_supreme());

CREATE TABLE public.group_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.group_channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view group messages" ON public.group_messages FOR SELECT USING (true);
CREATE POLICY "Authenticated can send group messages" ON public.group_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete own group messages" ON public.group_messages FOR DELETE USING (auth.uid() = sender_id OR is_guardian_supreme());

-- Enable realtime for group messages and activity feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- Insert default channels
INSERT INTO public.group_channels (name, description, created_by, is_private, min_grade)
VALUES 
  ('Vestibule', 'Canal général ouvert à tous les initiés', '00000000-0000-0000-0000-000000000000', false, 'novice'),
  ('Sanctuaire Intérieur', 'Discussions entre membres confirmés', '00000000-0000-0000-0000-000000000000', false, 'compagnon'),
  ('Chambre du Conseil', 'Réservé aux hauts gradés', '00000000-0000-0000-0000-000000000000', true, 'maitre');

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, rarity)
VALUES 
  ('Premier Pas', 'A rejoint l''Ordre des Ombres', '🌑', 'initiation', 'common'),
  ('Voix de l''Ombre', 'A envoyé 100 messages', '💬', 'communication', 'uncommon'),
  ('Gardien du Silence', 'A utilisé le chiffrement 50 fois', '🔐', 'cipher', 'rare'),
  ('Œil Vigilant', 'A signalé un comportement suspect', '👁️', 'vigilance', 'uncommon'),
  ('Sage Ancien', 'A atteint le grade de Sage', '📿', 'progression', 'epic'),
  ('Oracle', 'A atteint le grade suprême d''Oracle', '🔮', 'progression', 'legendary'),
  ('Pilier de l''Ordre', 'Membre actif depuis plus de 6 mois', '🏛️', 'loyalty', 'rare'),
  ('Juge Impartial', 'A participé à 10 sessions du tribunal', '⚖️', 'tribunal', 'rare');
