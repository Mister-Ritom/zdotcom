import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Coins, TrendingUp, TrendingDown } from 'lucide-react-native';
import { useAuthStore } from '@/stores/useAuthStore';
import { walletService } from '@/services/walletService';
import { type WalletModel, type TransactionModel } from '@/types/models';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = '#208AEF';

export default function WalletScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [wallet, setWallet] = useState<WalletModel | null>(null);
  const [transactions, setTransactions] = useState<TransactionModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      walletService.getWallet(user.id),
      walletService.getTransactions(user.id),
    ]).then(([w, txs]) => {
      setWallet(w);
      setTransactions(txs);
      setLoading(false);
    });
  }, [user?.id]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Earnings & Wallet</Text>
        <View style={{ width: 28 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={styles.cardContainer}>
              <View style={[styles.walletCard, { backgroundColor: isDark ? '#1C1917' : '#F5F5F4' }]}>
                <View style={styles.cardHeader}>
                  <Coins size={28} color="gold" />
                  <Text style={[styles.cardTitle, { color: isDark ? '#FFF' : '#000' }]}>Z Coins Balance</Text>
                </View>

                <Text style={[styles.balance, { color: isDark ? '#FFF' : '#000' }]}>
                  {wallet?.availableBalance.toFixed(2) ?? '0.00'}
                </Text>

                <View style={styles.row}>
                  <View>
                    <Text style={styles.subLabel}>Pending Balance</Text>
                    <Text style={[styles.subValue, { color: isDark ? '#FFF' : '#000' }]}>
                      {wallet?.pendingBalance.toFixed(2) ?? '0.00'}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.claimBtn}>
                    <Text style={styles.claimBtnText}>Claim</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={[styles.historyTitle, { color: isDark ? '#FFF' : '#000' }]}>Transaction History</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isNegative = item.amount < 0;
            return (
              <View style={[styles.txRow, { borderBottomColor: isDark ? '#1C1917' : '#F5F5F4' }]}>
                <View style={styles.txIcon}>
                  {isNegative ? (
                    <TrendingDown size={20} color="#EF4444" />
                  ) : (
                    <TrendingUp size={20} color="#10B981" />
                  )}
                </View>
                <View style={styles.txDetails}>
                  <Text style={[styles.txType, { color: isDark ? '#FFF' : '#000' }]}>{item.type.toUpperCase()}</Text>
                  <Text style={styles.txDate}>{item.createdAt.toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.txAmount, { color: isNegative ? '#EF4444' : '#10B981' }]}>
                  {isNegative ? '' : '+'}{item.amount.toFixed(0)}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: '#888' }}>No transactions yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  cardContainer: { padding: 16 },
  walletCard: { borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  balance: { fontSize: 32, fontWeight: '800', marginVertical: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 8 },
  subLabel: { fontSize: 12, color: '#888' },
  subValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  claimBtn: { backgroundColor: ACCENT, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 18 },
  claimBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  historyTitle: { fontSize: 16, fontWeight: '700', marginTop: 24 },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, marginHorizontal: 16 },
  txIcon: { marginRight: 12 },
  txDetails: { flex: 1 },
  txType: { fontSize: 14, fontWeight: '700' },
  txDate: { fontSize: 12, color: '#888', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  empty: { padding: 40, alignItems: 'center' },
});
