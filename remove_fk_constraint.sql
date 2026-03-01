-- ALTERNATIVA: Eliminar temporalmente la foreign key constraint
-- Ejecuta esto solo si NO quieres crear el usuario de prueba

-- Eliminar la constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- Verificar que se eliminó
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE conname = 'messages_user_id_fkey';
-- No debería devolver nada

-- NOTA: Para volver a agregar la constraint después:
-- ALTER TABLE messages 
-- ADD CONSTRAINT messages_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
