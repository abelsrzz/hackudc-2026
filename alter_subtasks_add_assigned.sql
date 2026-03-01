-- Añadir campo assigned_to a la tabla subtasks
ALTER TABLE public.subtasks 
ADD COLUMN assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Añadir índice para mejorar el rendimiento de consultas
CREATE INDEX idx_subtasks_assigned_to ON public.subtasks(assigned_to);
