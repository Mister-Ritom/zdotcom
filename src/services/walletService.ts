import { supabase } from '@/services/supabase';
import { AppLogger } from '@/utils/logger';
import { type WalletModel, walletFromRow, type TransactionModel, transactionFromRow } from '@/types/models';

export const walletService = {
  async getWallet(userId: string): Promise<WalletModel | null> {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return walletFromRow(data as Record<string, unknown>);
    } catch (e) {
      AppLogger.error('WalletService', 'getWallet failed', e);
      return null;
    }
  },

  async getTransactions(userId: string): Promise<TransactionModel[]> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((t) => transactionFromRow(t as Record<string, unknown>));
    } catch (e) {
      AppLogger.error('WalletService', 'getTransactions failed', e);
      return [];
    }
  },
};
