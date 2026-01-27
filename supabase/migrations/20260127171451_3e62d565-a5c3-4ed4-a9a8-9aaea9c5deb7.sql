-- Create file_tags table for the tag system
CREATE TABLE public.file_tags (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    color text NOT NULL DEFAULT '#8B5CF6',
    icon text,
    created_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create file_tag_assignments junction table
CREATE TABLE public.file_tag_assignments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
    tag_id uuid NOT NULL REFERENCES public.file_tags(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (file_id, tag_id)
);

-- Create file_annotations table for shared annotations
CREATE TABLE public.file_annotations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id uuid NOT NULL REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
    author_id uuid NOT NULL,
    content text NOT NULL,
    annotation_type text NOT NULL DEFAULT 'note',
    is_private boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create knowledge_tasks table for task system
CREATE TABLE public.knowledge_tasks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    assigned_to uuid,
    created_by uuid NOT NULL,
    file_id uuid REFERENCES public.knowledge_files(id) ON DELETE SET NULL,
    priority text NOT NULL DEFAULT 'normal',
    status text NOT NULL DEFAULT 'pending',
    due_date timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create personal_journal table for personal logbook
CREATE TABLE public.personal_journal (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    mood text,
    tags text[],
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add is_sealed column to knowledge_files for sealed files feature
ALTER TABLE public.knowledge_files ADD COLUMN IF NOT EXISTS is_sealed boolean NOT NULL DEFAULT false;
ALTER TABLE public.knowledge_files ADD COLUMN IF NOT EXISTS sealed_by uuid;
ALTER TABLE public.knowledge_files ADD COLUMN IF NOT EXISTS sealed_reason text;
ALTER TABLE public.knowledge_files ADD COLUMN IF NOT EXISTS unseal_condition text;

-- Enable RLS on all new tables
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_tag_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_journal ENABLE ROW LEVEL SECURITY;

-- RLS Policies for file_tags
CREATE POLICY "Knowledge access can view tags" ON public.file_tags FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert tags" ON public.file_tags FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Guardian can delete tags" ON public.file_tags FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for file_tag_assignments
CREATE POLICY "Knowledge access can view tag assignments" ON public.file_tag_assignments FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can manage tag assignments" ON public.file_tag_assignments FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can delete tag assignments" ON public.file_tag_assignments FOR DELETE USING (has_knowledge_access());

-- RLS Policies for file_annotations
CREATE POLICY "Knowledge access can view annotations" ON public.file_annotations FOR SELECT USING (has_knowledge_access() AND (NOT is_private OR author_id = auth.uid()));
CREATE POLICY "Knowledge access can insert annotations" ON public.file_annotations FOR INSERT WITH CHECK (has_knowledge_access() AND author_id = auth.uid());
CREATE POLICY "Authors can update own annotations" ON public.file_annotations FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Authors can delete own annotations" ON public.file_annotations FOR DELETE USING (author_id = auth.uid() OR is_guardian_supreme());

-- RLS Policies for knowledge_tasks
CREATE POLICY "Knowledge access can view tasks" ON public.knowledge_tasks FOR SELECT USING (has_knowledge_access());
CREATE POLICY "Knowledge access can insert tasks" ON public.knowledge_tasks FOR INSERT WITH CHECK (has_knowledge_access());
CREATE POLICY "Knowledge access can update tasks" ON public.knowledge_tasks FOR UPDATE USING (has_knowledge_access());
CREATE POLICY "Guardian can delete tasks" ON public.knowledge_tasks FOR DELETE USING (is_guardian_supreme());

-- RLS Policies for personal_journal (strictly private)
CREATE POLICY "Users can view own journal" ON public.personal_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal" ON public.personal_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal" ON public.personal_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON public.personal_journal FOR DELETE USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_file_annotations_updated_at BEFORE UPDATE ON public.file_annotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_tasks_updated_at BEFORE UPDATE ON public.knowledge_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_personal_journal_updated_at BEFORE UPDATE ON public.personal_journal FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for tasks and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.knowledge_tasks;