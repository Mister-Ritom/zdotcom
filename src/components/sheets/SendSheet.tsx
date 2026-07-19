import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Image,
  Linking,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebModal, ModalBackdrop, ModalView, ModalFlatList } from '../WebModal';
import { Avatar } from '../common/Avatar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { messageService } from '@/services/messageService';
import { userService } from '@/services/userService';
import { zapService } from '@/services/zapService';
import { type ConversationModel, type UserModel, type ZapModel } from '@/types/models';
import { isWeb } from '@/utils/platform';
import { APP_BASE_URL, getZapShareUrl } from '@/constants/APP_URL';
import BottomSheet from '@gorhom/bottom-sheet';
import {
  Check,
  CirclePlus,
  Copy,
  ExternalLink,
  Play,
  Send,
} from 'lucide-react-native';

const ACCENT = '#208AEF';

// ─── Magic prefix used to detect zap-share messages in chat ─────────────────
export const ZAP_SHARE_PREFIX = '__ZAP_SHARE__:';

export interface ZapSharePayload {
  zapId: string;
  url: string;
  caption: string;
  thumbnailUrl?: string;
  creatorUsername?: string;
  creatorName?: string;
  creatorAvatarUrl?: string;
  isShort?: boolean;
}

/** Encode a zap share payload into a chat message string. */
export function encodeZapShare(payload: ZapSharePayload, personalMessage: string): string {
  const json = JSON.stringify(payload);
  return personalMessage.trim()
    ? `${ZAP_SHARE_PREFIX}${json}\n${personalMessage.trim()}`
    : `${ZAP_SHARE_PREFIX}${json}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SendSheetProps {
  zapId?: string | null;
  zapText?: string;
  onClose?: () => void;
}

interface RecipientRow {
  conversation: ConversationModel;
  otherUser?: UserModel;
}

// ─── Zap Preview Card (top of sheet) ─────────────────────────────────────────

function ZapPreviewCard({
  zap,
  creator,
  isDark,
}: {
  zap: ZapModel | null;
  creator: UserModel | null;
  isDark: boolean;
}) {
  if (!zap) return null;
  const thumbnailUrl = zap.mediaUrls?.[0];
  const cardBg = isDark ? '#18181B' : '#F4F4F5';
  const textColor = isDark ? '#FFF' : '#000';
  const subColor = isDark ? '#A1A1AA' : '#71717A';

  return (
    <View style={[previewStyles.card, { backgroundColor: cardBg }]}>
      {/* Thumbnail */}
      <View style={previewStyles.thumbWrap}>
        {thumbnailUrl ? (
          <Image source={{ uri: thumbnailUrl }} style={previewStyles.thumb} resizeMode="cover" />
        ) : (
          <View style={[previewStyles.thumb, previewStyles.thumbPlaceholder]}>
            <Play size={24} color="#fff" fill="#fff" />
          </View>
        )}
        {/* Play icon overlay */}
        <View style={previewStyles.playOverlay}>
          <Play size={18} color="#fff" fill="#fff" />
        </View>
      </View>

      {/* Meta */}
      <View style={previewStyles.meta}>
        {creator && (
          <View style={previewStyles.creatorRow}>
            <Avatar
              uri={creator.profilePictureUrl}
              name={creator.displayName}
              size={20}
            />
            <Text style={[previewStyles.creatorName, { color: textColor }]} numberOfLines={1}>
              @{creator.username}
            </Text>
            {creator.isVerified && (
              <View style={previewStyles.badge}>
                <Text style={previewStyles.badgeText}>✓</Text>
              </View>
            )}
          </View>
        )}
        {zap.text.trim().length > 0 && (
          <Text style={[previewStyles.caption, { color: subColor }]} numberOfLines={2}>
            {zap.text}
          </Text>
        )}
        <Text style={previewStyles.url} numberOfLines={1}>
          {APP_BASE_URL}/shorts/{zap.id}
        </Text>
      </View>
    </View>
  );
}

const previewStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
    gap: 0,
  },
  thumbWrap: {
    width: 76,
    height: 100,
    position: 'relative',
  },
  thumb: {
    width: 76,
    height: 100,
    backgroundColor: '#1C1C1E',
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playOverlay: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    padding: 10,
    gap: 4,
    justifyContent: 'center',
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  creatorName: { fontSize: 13, fontWeight: '700', flex: 1 },
  badge: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '900' },
  caption: { fontSize: 12, lineHeight: 16 },
  url: { fontSize: 11, color: ACCENT, marginTop: 2 },
});

// ─── Main SendSheet ───────────────────────────────────────────────────────────

export const SendSheet = forwardRef<BottomSheet, SendSheetProps>(
  ({ zapId, zapText, onClose }, ref) => {
    const isDark = useColorScheme() === 'dark';
    const { user: authUser } = useAuthStore();

    const snapPoints = useMemo(() => ['70%', '92%'], []);

    const [rows, setRows] = useState<RecipientRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [sending, setSending] = useState<Record<string, boolean>>({});
    const [sent, setSent] = useState<Record<string, boolean>>({});

    const [messageText, setMessageText] = useState('');
    const loadedRef = useRef(false);

    // Zap + creator data for the preview card
    const [zapData, setZapData] = useState<ZapModel | null>(null);
    const [creator, setCreator] = useState<UserModel | null>(null);
    const zapLoadedRef = useRef<string | null>(null);

    const isShortItem = zapData?.isShort ?? false;
    const zapLink = zapId
      ? (isShortItem ? getZapShareUrl(zapId) : `${APP_BASE_URL}/zap/${zapId}`)
      : '';

    // ── Load zap data for preview ────────────────────────────────────────────
    useEffect(() => {
      if (!zapId || zapLoadedRef.current === zapId) return;
      zapLoadedRef.current = zapId;
      zapService.getZapById(zapId).then(async (z) => {
        setZapData(z);
        if (z?.userId) {
          const u = await userService.getById(z.userId);
          setCreator(u);
        }
      });
    }, [zapId]);

    // ── Load conversations once per open ─────────────────────────────────────
    const load = useCallback(async () => {
      if (!authUser?.id || loadedRef.current) return;
      loadedRef.current = true;
      setLoading(true);
      try {
        const convos = await messageService.getConversations(authUser.id);
        const enriched = await Promise.all(
          convos.map(async (c) => {
            const otherId = c.recipients.find((r) => r !== authUser.id);
            const otherUser = otherId ? await userService.getById(otherId) : undefined;
            return { conversation: c, otherUser: otherUser ?? undefined };
          })
        );
        setRows(enriched);
      } finally {
        setLoading(false);
      }
    }, [authUser?.id]);

    // On web, DesktopWebModal never fires onAnimate, so we eagerly load
    // conversations whenever zapId becomes set (i.e. the sheet is opened).
    useEffect(() => {
      if (zapId) load();
    }, [zapId, load]);

    const handleAnimate = useCallback(
      (fromIndex: number, toIndex: number) => {
        if (toIndex === -1) {
          loadedRef.current = false;
          setQuery('');
          setMessageText('');
          setSent({});
          onClose?.();
        } else if (fromIndex === -1 && toIndex >= 0) {
          load();
        }
      },
      [load, onClose]
    );

    const renderBackdrop = useCallback(
      (bp: any) => (
        <ModalBackdrop {...bp} disappearsOnIndex={-1} appearsOnIndex={0} />
      ),
      []
    );

    const close = useCallback(() => {
      if (ref && 'current' in ref && ref.current) ref.current.close();
    }, [ref]);

    const handleWebClose = useCallback(() => {
      loadedRef.current = false;
      setQuery('');
      setMessageText('');
      setSent({});
      onClose?.();
    }, [onClose]);

    // ── Build share payload ──────────────────────────────────────────────────
    const buildPayload = useCallback((): ZapSharePayload => ({
      zapId: zapId ?? '',
      url: zapLink,
      caption: zapData?.text ?? zapText ?? '',
      thumbnailUrl: zapData?.mediaUrls?.[0],
      creatorUsername: creator?.username,
      creatorName: creator?.displayName,
      creatorAvatarUrl: creator?.profilePictureUrl,
      isShort: isShortItem,
    }), [zapId, zapLink, zapData, zapText, creator, isShortItem]);

    // ── Send zap to a conversation ───────────────────────────────────────────
    const handleSend = useCallback(
      async (row: RecipientRow) => {
        if (!authUser?.id || !zapId) return;
        const convId = row.conversation.id;
        setSending((p) => ({ ...p, [convId]: true }));
        try {
          const allIds = row.conversation.recipients;
          const msg = encodeZapShare(buildPayload(), messageText);
          await messageService.sendMessage({
            senderId: authUser.id,
            recipients: allIds,
            text: msg,
          });
          setSent((p) => ({ ...p, [convId]: true }));
        } finally {
          setSending((p) => ({ ...p, [convId]: false }));
        }
      },
      [authUser?.id, zapId, buildPayload, messageText]
    );

    // ── Extra actions ────────────────────────────────────────────────────────
    const handleAddToStatus = useCallback(() => {
      Alert.alert('Coming soon', 'Adding to status will be available soon.');
      close();
    }, [close]);

    const handleCopyLink = useCallback(() => {
      if (Platform.OS === 'web') {
        // @ts-ignore
        navigator?.clipboard?.writeText(zapLink).catch(() => {});
      } else {
        Clipboard.setString(zapLink);
      }
      Alert.alert('Copied', 'Link copied to clipboard.');
      close();
    }, [zapLink, close]);

    const handleShareExternal = useCallback(async () => {
      const shareText = zapData?.text ?? zapText;
      const defaultMsg = isShortItem
        ? `Watch this short on Z ⚡\n${zapLink}`
        : `Check out this zap on Z ⚡\n${zapLink}`;
      try {
        await Share.share({
          message: shareText ? `${shareText}\n\n${zapLink}` : defaultMsg,
          url: zapLink,
        });
      } catch {}
      close();
    }, [zapData?.text, zapText, zapLink, close, isShortItem]);

    // ── Filtered rows ────────────────────────────────────────────────────────
    const filtered = useMemo(() => {
      if (!query.trim()) return rows;
      const q = query.toLowerCase();
      return rows.filter(
        (r) =>
          r.otherUser?.displayName.toLowerCase().includes(q) ||
          r.otherUser?.username.toLowerCase().includes(q)
      );
    }, [rows, query]);

    // ── Colours ──────────────────────────────────────────────────────────────
    const bg = isDark ? '#18181B' : '#FFFFFF';
    const textColor = isDark ? '#F4F4F5' : '#18181B';
    const subColor = isDark ? '#A1A1AA' : '#71717A';
    const borderColor = isDark ? '#27272A' : '#E4E4E7';
    const inputBg = isDark ? '#27272A' : '#F4F4F5';

    return (
      <WebModal
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        onAnimate={handleAnimate}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: bg }}
        handleIndicatorStyle={{ backgroundColor: isDark ? '#52525B' : '#A1A1AA' }}
        enablePanDownToClose
        enableDynamicSizing={false}
        webTitle="Send Short"
        onWebClose={handleWebClose}
      >
        <ModalView style={styles.container}>
          {/* Title — hidden on web */}
          {!isWeb && <Text style={[styles.title, { color: textColor }]}>Send Short</Text>}

          {/* Zap preview card */}
          <ZapPreviewCard zap={zapData} creator={creator} isDark={isDark} />

          {/* Search */}
          <View style={[styles.searchRow, { backgroundColor: inputBg }]}>
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search people…"
              placeholderTextColor={subColor}
              value={query}
              onChangeText={setQuery}
            />
          </View>

          {/* Optional message caption */}
          <View style={[styles.captionRow, { borderColor }]}>
            <TextInput
              style={[styles.captionInput, { color: textColor }]}
              placeholder="Add a message… (optional)"
              placeholderTextColor={subColor}
              value={messageText}
              onChangeText={setMessageText}
              multiline
            />
          </View>

          {/* Conversation list */}
          {loading ? (
            <ActivityIndicator color={ACCENT} style={{ marginTop: 24 }} />
          ) : (
            <ModalFlatList
              data={filtered}
              keyExtractor={(item: RecipientRow) => item.conversation.id}
              style={styles.list}
              contentContainerStyle={{ paddingBottom: 8 }}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: subColor }]}>
                  {rows.length === 0
                    ? 'No conversations yet. Start a DM to send!'
                    : 'No results'}
                </Text>
              }
              renderItem={({ item }: { item: RecipientRow }) => {
                const convId = item.conversation.id;
                const isSending = sending[convId];
                const isSent = sent[convId];
                return (
                  <View style={[styles.row, { borderBottomColor: borderColor }]}>
                    <Avatar
                      uri={item.otherUser?.profilePictureUrl}
                      name={item.otherUser?.displayName ?? '?'}
                      size={44}
                    />
                    <View style={styles.rowMeta}>
                      <Text style={[styles.rowName, { color: textColor }]} numberOfLines={1}>
                        {item.otherUser?.displayName ?? 'Unknown'}
                      </Text>
                      <Text style={[styles.rowSub, { color: subColor }]} numberOfLines={1}>
                        @{item.otherUser?.username ?? '…'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.sendBtn,
                        { backgroundColor: isSent ? '#22C55E' : ACCENT },
                      ]}
                      onPress={() => handleSend(item)}
                      disabled={isSending || isSent}
                      activeOpacity={0.8}
                    >
                      {isSending ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : isSent ? (
                        <Check size={16} color="#fff" strokeWidth={2.5} />
                      ) : (
                        <Send size={16} color="#fff" strokeWidth={2.5} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: borderColor }]} />

          {/* Extra actions */}
          <View style={styles.actions}>
            <ActionButton
              icon={<CirclePlus size={22} color={textColor} />}
              label="Add to Status"
              textColor={textColor}
              inputBg={inputBg}
              onPress={handleAddToStatus}
            />
            <ActionButton
              icon={<Copy size={22} color={textColor} />}
              label="Copy Link"
              textColor={textColor}
              inputBg={inputBg}
              onPress={handleCopyLink}
            />
            <ActionButton
              icon={<ExternalLink size={22} color={textColor} />}
              label="Share to Apps"
              textColor={textColor}
              inputBg={inputBg}
              onPress={handleShareExternal}
            />
          </View>
        </ModalView>
      </WebModal>
    );
  }
);

SendSheet.displayName = 'SendSheet';

function ActionButton({
  icon,
  label,
  textColor,
  inputBg,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  textColor: string;
  inputBg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIcon, { backgroundColor: inputBg }]}>{icon}</View>
      <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  title: { fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 14 },
  searchRow: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: { fontSize: 15 },
  captionRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    minHeight: 44,
  },
  captionInput: { fontSize: 14 },
  list: { flex: 1 },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowMeta: { flex: 1 },
  rowName: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 1 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 16,
  },
  actionBtn: { alignItems: 'center', gap: 6 },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },
});
