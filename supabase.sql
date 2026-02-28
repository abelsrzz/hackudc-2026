-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

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