-- Añadir columna para adjuntos en mensajes del chat
ALTER TABLE messages 
ADD COLUMN attachment_path text;

-- Índice para búsquedas de mensajes con adjuntos
CREATE INDEX idx_messages_attachment ON messages(attachment_path) 
WHERE attachment_path IS NOT NULL;
