-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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
CREATE TABLE public.projects (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name character varying,
  challenge_id uuid,
  sede text,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES public.challenges(id)
);
CREATE TABLE public.sponsors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  website_url text,
  description text,
  active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT sponsors_pkey PRIMARY KEY (id)
);