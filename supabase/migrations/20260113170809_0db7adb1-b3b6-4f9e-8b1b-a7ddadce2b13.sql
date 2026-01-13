-- Create enum for app roles (Guardian Supreme vs Initiate)
CREATE TYPE public.app_role AS ENUM ('guardian_supreme', 'initiate');

-- Create enum for member status
CREATE TYPE public.member_status AS ENUM ('active', 'under_surveillance', 'pending', 'exclusion_requested');

-- Create enum for initiation request status
CREATE TYPE public.initiation_status AS ENUM ('pending', 'approved', 'rejected');

-- Create enum for grades (ranks)
CREATE TYPE public.initiate_grade AS ENUM ('novice', 'apprenti', 'compagnon', 'maitre', 'sage', 'oracle');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudonym TEXT NOT NULL,
  grade public.initiate_grade NOT NULL DEFAULT 'novice',
  status public.member_status NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Create initiation requests table (for people wanting to join)
CREATE TABLE public.initiation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  desired_pseudonym TEXT NOT NULL,
  motivation TEXT NOT NULL,
  email TEXT NOT NULL,
  status public.initiation_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exit requests table (for members wanting to leave)
CREATE TABLE public.exit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status public.initiation_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table (for member-to-member reports)
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reported_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  is_reviewed BOOLEAN NOT NULL DEFAULT false,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.initiation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is Guardian Supreme
CREATE OR REPLACE FUNCTION public.is_guardian_supreme()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'guardian_supreme')
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Guardian Supreme can view all profiles
CREATE POLICY "Guardian can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_guardian_supreme());

-- Guardian Supreme can insert profiles (when approving initiation)
CREATE POLICY "Guardian can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_guardian_supreme());

-- Guardian Supreme can update all profiles
CREATE POLICY "Guardian can update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_guardian_supreme());

-- Guardian Supreme can delete profiles
CREATE POLICY "Guardian can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_guardian_supreme());

-- RLS Policies for user_roles
-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Guardian Supreme can manage all roles
CREATE POLICY "Guardian can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.is_guardian_supreme());

CREATE POLICY "Guardian can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_guardian_supreme());

CREATE POLICY "Guardian can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.is_guardian_supreme());

-- RLS Policies for initiation_requests
-- Anyone can insert (unauthenticated users can request to join)
CREATE POLICY "Anyone can create initiation request"
  ON public.initiation_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only Guardian Supreme can view/manage requests
CREATE POLICY "Guardian can view initiation requests"
  ON public.initiation_requests FOR SELECT
  TO authenticated
  USING (public.is_guardian_supreme());

CREATE POLICY "Guardian can update initiation requests"
  ON public.initiation_requests FOR UPDATE
  TO authenticated
  USING (public.is_guardian_supreme());

CREATE POLICY "Guardian can delete initiation requests"
  ON public.initiation_requests FOR DELETE
  TO authenticated
  USING (public.is_guardian_supreme());

-- RLS Policies for exit_requests
-- Users can create their own exit request
CREATE POLICY "Users can create own exit request"
  ON public.exit_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own exit request
CREATE POLICY "Users can view own exit request"
  ON public.exit_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Guardian Supreme can view all exit requests
CREATE POLICY "Guardian can view all exit requests"
  ON public.exit_requests FOR SELECT
  TO authenticated
  USING (public.is_guardian_supreme());

-- Guardian Supreme can update exit requests
CREATE POLICY "Guardian can update exit requests"
  ON public.exit_requests FOR UPDATE
  TO authenticated
  USING (public.is_guardian_supreme());

-- RLS Policies for reports
-- Users can create reports (but not report themselves)
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id AND auth.uid() != reported_id);

-- Users can view their own submitted reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Guardian Supreme can view all reports
CREATE POLICY "Guardian can view all reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.is_guardian_supreme());

-- Guardian Supreme can update reports
CREATE POLICY "Guardian can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.is_guardian_supreme());