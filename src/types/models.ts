// Supabase table column names (snake_case) → TypeScript camelCase models

export type Privacy = 'public' | 'followers' | 'private';
export type AccountType = 'public' | 'private' | 'verified' | 'business';
export type StoryVisibility = 'public' | 'followers' | 'close_friends';
export type MessagePreference = 'mutual' | 'none' | 'everyone' | 'following' | 'follower';


export interface UserModel {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  profilePictureUrl?: string;
  coverPhotoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  followersCount: number;
  followingCount: number;
  zapsCount: number;
  accountType: AccountType;
  isVerified: boolean;
  messagePreference?: MessagePreference;
}

export function userFromRow(row: Record<string, unknown>): UserModel {
  const accountType = (row['account_type'] as AccountType) ?? 'public';
  return {
    id: (row['id'] as string) ?? '',
    username: (row['username'] as string) ?? '',
    displayName: (row['display_name'] as string) ?? '',
    bio: row['bio'] as string | undefined,
    profilePictureUrl: row['profile_picture_url'] as string | undefined,
    coverPhotoUrl: row['cover_photo_url'] as string | undefined,
    createdAt: row['created_at'] ? new Date(row['created_at'] as string) : new Date(),
    updatedAt: row['updated_at'] ? new Date(row['updated_at'] as string) : new Date(),
    followersCount: (row['followers_count'] as number) ?? 0,
    followingCount: (row['following_count'] as number) ?? 0,
    zapsCount: (row['zaps_count'] as number) ?? 0,
    accountType,
    isVerified: accountType === 'verified' || accountType === 'business',
    messagePreference: row['message_preference'] as MessagePreference | undefined,
  };
}

export interface ZapModel {
  id: string;
  userId: string;
  originalUserId?: string;
  parentZapId?: string;
  quotedZapId?: string;
  text: string;
  mediaUrls: string[];
  createdAt: Date;
  likesCount: number;
  rezapsCount: number;
  repliesCount: number;
  viewsCount: number;
  sharesCount: number;
  commentsCount: number;
  isThread: boolean;
  isShort: boolean;
  threadParentId?: string;
  hashtags: string[];
  mentions: string[];
  isDeleted: boolean;
  songId?: string;
  privacy: Privacy;
  updatedAt?: Date;
}

export function zapFromRow(row: Record<string, unknown>): ZapModel {
  return {
    id: (row['id'] as string) ?? '',
    userId: (row['user_id'] as string) ?? '',
    originalUserId: row['original_user_id'] as string | undefined,
    parentZapId: row['parent_zap_id'] as string | undefined,
    quotedZapId: row['quoted_zap_id'] as string | undefined,
    text: (row['text'] as string) ?? '',
    mediaUrls: Array.isArray(row['media_urls']) ? (row['media_urls'] as string[]) : [],
    createdAt: row['created_at'] ? new Date(row['created_at'] as string) : new Date(),
    likesCount: (row['likes_count'] as number) ?? 0,
    rezapsCount: (row['rezaps_count'] as number) ?? 0,
    repliesCount: (row['replies_count'] as number) ?? 0,
    viewsCount: (row['views_count'] as number) ?? 0,
    sharesCount: (row['shares_count'] as number) ?? 0,
    commentsCount: (row['comments_count'] as number) ?? 0,
    isThread: (row['is_thread'] as boolean) ?? false,
    isShort: (row['is_short'] as boolean) ?? false,
    threadParentId: row['thread_parent_id'] as string | undefined,
    hashtags: Array.isArray(row['hashtags']) ? (row['hashtags'] as string[]) : [],
    mentions: Array.isArray(row['mentions']) ? (row['mentions'] as string[]) : [],
    isDeleted: (row['is_deleted'] as boolean) ?? false,
    songId: row['song_id'] as string | undefined,
    privacy: (row['privacy'] as Privacy) ?? 'public',
    updatedAt: row['updated_at'] ? new Date(row['updated_at'] as string) : undefined,
  };
}

export interface StoryModel {
  id: string;
  userId: string;
  caption: string;
  mediaUrl: string;
  durationSeconds: number;
  visibility: StoryVisibility;
  createdAt: Date;
  visibleTo: string[];
  isDeleted: boolean;
  likesCount: number;
  viewsCount: number;
  sharesCount: number;
}

export function storyFromRow(row: Record<string, unknown>): StoryModel {
  return {
    id: (row['id'] as string) ?? '',
    userId: (row['user_id'] as string) ?? '',
    caption: (row['caption'] as string) ?? '',
    mediaUrl: (row['media_url'] as string) ?? '',
    durationSeconds: 15,
    visibility: (row['visibility'] as StoryVisibility) ?? 'public',
    createdAt: row['created_at'] ? new Date(row['created_at'] as string) : new Date(),
    visibleTo: Array.isArray(row['visible_to']) ? (row['visible_to'] as string[]) : [],
    isDeleted: (row['is_deleted'] as boolean) ?? false,
    likesCount: (row['likes_count'] as number) ?? 0,
    viewsCount: (row['views_count'] as number) ?? 0,
    sharesCount: (row['shares_count'] as number) ?? 0,
  };
}

// Grouped stories: one entry per user showing their stories
export interface GroupedStories {
  userId: string;
  user?: UserModel;
  stories: StoryModel[];
  hasUnviewed: boolean;
}

export interface MessageModel {
  id: string;
  conversationId: string;
  senderId: string;
  recipientIds: string[];
  text: string;
  mediaUrls?: string[];
  createdAt: Date;
  isRead: boolean;
  isDeleted: boolean;
  isPending: boolean;
}

export function messageFromRow(row: Record<string, unknown>): MessageModel {
  return {
    id: (row['id'] as string) ?? '',
    conversationId: (row['conversation_id'] as string) ?? '',
    senderId: (row['sender_id'] as string) ?? '',
    recipientIds: Array.isArray(row['recipient_ids']) ? (row['recipient_ids'] as string[]) : [],
    text: (row['text'] as string) ?? '',
    mediaUrls: Array.isArray(row['media_urls']) ? (row['media_urls'] as string[]) : undefined,
    createdAt: row['created_at'] ? new Date(row['created_at'] as string) : new Date(),
    isRead: (row['is_read'] as boolean) ?? false,
    isDeleted: (row['is_deleted'] as boolean) ?? false,
    isPending: (row['is_pending'] as boolean) ?? false,
  };
}

export interface ConversationModel {
  id: string;
  recipients: string[];
  lastMessageAt: Date;
  lastMessage?: string;
  lastMessageSender?: string;
  unreadCount: number;
}

export function conversationFromRow(row: Record<string, unknown>): ConversationModel {
  return {
    id: (row['id'] as string) ?? '',
    recipients: Array.isArray(row['recipients']) ? (row['recipients'] as string[]) : [],
    lastMessageAt: row['last_message_at'] ? new Date(row['last_message_at'] as string) : new Date(),
    lastMessage: row['last_message'] as string | undefined,
    lastMessageSender: row['last_message_sender'] as string | undefined,
    unreadCount: (row['unread_count'] as number) ?? 0,
  };
}

export interface WalletModel {
  id: string;
  availableBalance: number;
  pendingBalance: number;
  updatedAt: Date;
}

export function walletFromRow(row: Record<string, unknown>): WalletModel {
  return {
    id: (row['id'] as string) ?? '',
    availableBalance: Number(row['available_balance'] ?? 0),
    pendingBalance: Number(row['pending_balance'] ?? 0),
    updatedAt: row['updated_at'] ? new Date(row['updated_at'] as string) : new Date(),
  };
}

export type TransactionStatus = 'pending' | 'cleared' | 'rejected';
export type TransactionAppealStatus = 'none' | 'pending' | 'reviewed' | 'not_applicable';

export interface TransactionModel {
  id: string;
  userId: string;
  amount: number;
  type: string;
  postId?: string;
  createdAt: Date;
  status: TransactionStatus;
  rejectionReason?: string;
  appealStatus: TransactionAppealStatus;
  engagementLogId?: string;
}

export function transactionFromRow(row: Record<string, unknown>): TransactionModel {
  return {
    id: (row['id'] as string) ?? '',
    userId: (row['user_id'] as string) ?? '',
    amount: Number(row['amount'] ?? 0),
    type: (row['type'] as string) ?? '',
    postId: row['post_id'] as string | undefined,
    createdAt: row['created_at'] ? new Date(row['created_at'] as string) : new Date(),
    status: (row['status'] as TransactionStatus) ?? 'pending',
    rejectionReason: row['rejection_reason'] as string | undefined,
    appealStatus: (row['appeal_status'] as TransactionAppealStatus) ?? 'none',
    engagementLogId: row['engagement_log_id'] as string | undefined,
  };
}
