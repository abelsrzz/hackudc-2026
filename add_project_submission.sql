-- Crear enum para el estado del proyecto
CREATE TYPE project_status_enum AS ENUM ('in_progress', 'submitted');

-- Agregar campos a la tabla projects
ALTER TABLE public.projects
ADD COLUMN github_repo_url text,
ADD COLUMN description_markdown text,
ADD COLUMN status project_status_enum NOT NULL DEFAULT 'in_progress',
ADD COLUMN submitted_at timestamp with time zone;

-- Crear índice para búsquedas por estado
CREATE INDEX idx_projects_status ON public.projects(status);
