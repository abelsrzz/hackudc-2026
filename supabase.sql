-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

-- Enums
CREATE TYPE public.role_enum AS ENUM ('Admin', 'Hacker', 'Sponsor', 'Mentor');
CREATE TYPE public.assitance_status_enum AS ENUM ('pending', 'assigned', 'cancel', 'done');
CREATE TYPE public.task_status_enum AS ENUM ('pending', 'in_progress', 'done', 'cancel');
CREATE TYPE public.project_status_enum AS ENUM ('in_progress', 'submitted');

CREATE TABLE public.assistance_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status USER-DEFINED DEFAULT 'pending'::assitance_status_enum,
  project_id bigint,
  assigned_mentor uuid,
  request text,
  mentor_response text,
  CONSTRAINT assistance_requests_pkey PRIMARY KEY (id),
  CONSTRAINT assistance_requests_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT assistance_requests_assigned_mentor_fkey FOREIGN KEY (assigned_mentor) REFERENCES public.profiles(id)
);
CREATE TABLE public.challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sponsor_id uuid NOT NULL,
  title text NOT NULL,
  short_description text NOT NULL,
  content_markdown text NOT NULL,
  reward text,
  created_by uuid NOT NULL,
  CONSTRAINT challenges_pkey PRIMARY KEY (id),
  CONSTRAINT fk_sponsor FOREIGN KEY (sponsor_id) REFERENCES public.sponsors(id),
  CONSTRAINT challenges_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  channel text NOT NULL DEFAULT 'general'::text,
  content text NOT NULL,
  reply_to uuid,
  created_at timestamp without time zone DEFAULT now(),
  edited_at timestamp without time zone,
  attachment_path text,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES public.messages(id)
);
CREATE TABLE public.photos (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  caption text,
  CONSTRAINT photos_pkey PRIMARY KEY (id),
  CONSTRAINT photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  name text,
  role USER-DEFINED NOT NULL DEFAULT 'Hacker'::role_enum,
  created_at timestamp with time zone DEFAULT now(),
  sponsor_id uuid,
  linkedin text,
  github text,
  twitter text,
  website text,
  institution text,
  degree text,
  year_of_study text,
  instagram text,
  avatar_url text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES public.sponsors(id)
);
CREATE TABLE public.project_member (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  member_id uuid,
  project_id bigint,
  CONSTRAINT project_member_pkey PRIMARY KEY (id),
  CONSTRAINT project_member_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.profiles(id),
  CONSTRAINT project_member_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_ratings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  project_id bigint NOT NULL,
  admin_id uuid NOT NULL,
  score numeric NOT NULL CHECK (score >= 0::numeric AND score <= 10::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT project_ratings_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_ratings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.projects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name character varying,
  challenge_id uuid,
  sede text,
  github_repo_url text,
  description_markdown text,
  status USER-DEFINED NOT NULL DEFAULT 'in_progress'::project_status_enum,
  submitted_at timestamp with time zone,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.sponsors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_path text,
  website_url text,
  description text,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT sponsors_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subtasks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  task_id bigint NOT NULL,
  title text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  assigned_to uuid,
  CONSTRAINT subtasks_pkey PRIMARY KEY (id),
  CONSTRAINT subtasks_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT subtasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.profiles(id)
);
CREATE TABLE public.tasks (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  description text,
  status USER-DEFINED NOT NULL DEFAULT 'pending'::task_status_enum,
  created_by uuid NOT NULL,
  project_id bigint,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.upvotes (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  CONSTRAINT upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT upvotes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT upvotes_unique UNIQUE (user_id, entity_type, entity_id)
);

-- Unique constraints
ALTER TABLE public.project_ratings
  ADD CONSTRAINT project_ratings_unique UNIQUE (project_id, admin_id);

-- Indexes
CREATE INDEX idx_messages_attachment ON public.messages (attachment_path);
CREATE INDEX idx_profiles_role ON public.profiles (role);
CREATE INDEX idx_project_ratings_admin_id ON public.project_ratings (admin_id);
CREATE INDEX idx_project_ratings_project_id ON public.project_ratings (project_id);
CREATE INDEX idx_projects_status ON public.projects (status);
CREATE INDEX idx_subtasks_assigned_to ON public.subtasks (assigned_to);
CREATE INDEX subtasks_assigned_idx ON public.subtasks (assigned_to);
CREATE INDEX tasks_project_id_idx ON public.tasks (project_id);