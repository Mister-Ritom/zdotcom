import { supabase } from '@/services/supabase';
import { AppLogger } from '@/utils/logger';
import { type MessageModel, messageFromRow, type ConversationModel, conversationFromRow } from '@/types/models';

export const messageService = {
  getConversationId(userIds: string[]): string {
    return [...userIds].sort().join('_');
  },

  async getConversations(userId: string): Promise<ConversationModel[]> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('last_message_at', { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .filter((d) => {
          const recs = Array.isArray(d.recipients) ? (d.recipients as string[]) : [];
          return recs.includes(userId);
        })
        .map(conversationFromRow);
    } catch (e) {
      AppLogger.error('MessageService', 'getConversations failed', e);
      return [];
    }
  },

  async sendMessage(params: {
    senderId: string;
    recipients: string[];
    text: string;
    mediaUrls?: string[];
  }): Promise<MessageModel | null> {
    try {
      const conversationId = this.getConversationId(params.recipients);
      const messageData = {
        conversation_id: conversationId,
        sender_id: params.senderId,
        recipient_ids: params.recipients,
        text: params.text,
        media_urls: params.mediaUrls ?? [],
        is_pending: false,
        is_deleted: false,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single();
      if (error) throw error;

      // Update or create conversation
      const { error: convErr } = await supabase
        .from('conversations')
        .upsert({
          id: conversationId,
          recipients: params.recipients,
          last_message: params.text || (params.mediaUrls?.length ? '📎 Media' : ''),
          last_message_at: new Date().toISOString(),
          last_message_sender: params.senderId,
          unread_count: 1,
          is_deleted: false,
          is_read: false,
          created_at: new Date().toISOString(),
        });
      if (convErr) throw convErr;

      return messageFromRow(data as Record<string, unknown>);
    } catch (e) {
      AppLogger.error('MessageService', 'sendMessage failed', e);
      return null;
    }
  },

  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      await supabase
        .from('conversations')
        .update({ is_read: true, unread_count: 0 })
        .eq('id', conversationId);
    } catch (e) {
      AppLogger.error('MessageService', 'markAsRead failed', e);
    }
  },

  async getMessages(conversationId: string): Promise<MessageModel[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((m) => messageFromRow(m as Record<string, unknown>));
    } catch (e) {
      AppLogger.error('MessageService', 'getMessages failed', e);
      return [];
    }
  },
};
