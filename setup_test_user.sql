-- Script para crear usuario de prueba temporal
-- Ejecuta esto en Supabase SQL Editor

-- Opción 1: Crear un perfil de prueba
INSERT INTO profiles (id, name, role)
VALUES ('00000000-0000-0000-0000-000000000001', 'Usuario de Prueba', 'Hacker')
ON CONFLICT (id) DO NOTHING;

-- Verificar que se creó
SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';

-- NOTA: Cuando termines de probar, puedes eliminar este usuario:
-- DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001';
