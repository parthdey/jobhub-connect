-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'employer', 'job_seeker');

-- Create enum for application status
CREATE TYPE public.application_status AS ENUM ('pending', 'reviewed', 'accepted', 'rejected');

-- Create enum for job status
CREATE TYPE public.job_status AS ENUM ('draft', 'active', 'closed');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  company_logo TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  resume_url TEXT,
  is_employer_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create function to check user role
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
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  salary_min NUMERIC,
  salary_max NUMERIC,
  location TEXT NOT NULL,
  job_type TEXT NOT NULL, -- full-time, part-time, contract, etc.
  category TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT, -- entry, mid, senior
  status public.job_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create applications table
CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  job_seeker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cover_letter TEXT,
  status public.application_status NOT NULL DEFAULT 'pending',
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, job_seeker_id) -- Can only apply once per job
);

-- Create bookmarks table
CREATE TABLE public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, user_id) -- Can only bookmark once per job
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "User roles are viewable by everyone"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for jobs
CREATE POLICY "Jobs are viewable by everyone"
  ON public.jobs FOR SELECT
  USING (true);

CREATE POLICY "Approved employers can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'employer') AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_employer_approved = true)
  );

CREATE POLICY "Employers can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (employer_id = auth.uid());

CREATE POLICY "Employers and admins can delete jobs"
  ON public.jobs FOR DELETE
  USING (employer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- RLS Policies for applications
CREATE POLICY "Applications viewable by job seeker, employer, and admin"
  ON public.applications FOR SELECT
  USING (
    job_seeker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid()) OR
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Job seekers can create applications"
  ON public.applications FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'job_seeker') AND
    job_seeker_id = auth.uid()
  );

CREATE POLICY "Employers can update application status"
  ON public.applications FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND employer_id = auth.uid())
  );

CREATE POLICY "Job seekers can delete their applications"
  ON public.applications FOR DELETE
  USING (job_seeker_id = auth.uid());

-- RLS Policies for bookmarks
CREATE POLICY "Bookmarks viewable by owner"
  ON public.bookmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own bookmarks"
  ON public.bookmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (user_id = auth.uid());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role public.app_role;
BEGIN
  -- Get role from metadata, default to job_seeker
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::public.app_role,
    'job_seeker'::public.app_role
  );

  -- Insert into profiles
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User')
  );

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, user_role);

  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_jobs_employer_id ON public.jobs(employer_id);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_jobs_category ON public.jobs(category);
CREATE INDEX idx_applications_job_id ON public.applications(job_id);
CREATE INDEX idx_applications_job_seeker_id ON public.applications(job_seeker_id);
CREATE INDEX idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX idx_bookmarks_job_id ON public.bookmarks(job_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);