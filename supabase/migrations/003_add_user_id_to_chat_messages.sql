-- Add user_id to chat_messages table
-- This allows tracking which user sent each message

-- Add the user_id column (nullable initially for existing data)
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill existing messages with user_id from their parent chat
UPDATE public.chat_messages 
SET user_id = chats.user_id 
FROM public.chats 
WHERE chat_messages.chat_id = chats.id 
AND chat_messages.user_id IS NULL;

-- Now make the column NOT NULL after backfilling
ALTER TABLE public.chat_messages 
ALTER COLUMN user_id SET NOT NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);

-- Update RLS policies to also check user_id directly on messages
DROP POLICY IF EXISTS "Users can view messages from their chats" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to their chats" ON public.chat_messages;

CREATE POLICY "Users can view their own messages" ON public.chat_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages" ON public.chat_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);
