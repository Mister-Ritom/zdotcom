import { Avatar } from "@/components/common/Avatar";
import { FeedSkeleton } from "@/components/feed/FeedSkeleton";
import { ZapCardContainer } from "@/components/feed/ZapCardContainer";
import { StoriesRail } from "@/components/stories/StoriesRail";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { userService } from "@/services/userService";
import { useAuthStore } from "@/stores/useAuthStore";
import { useFeedStore } from "@/stores/useFeedStore";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { type UserModel, type ZapModel } from "@/types/models";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
  Bell,
  Bookmark,
  Coins,
  LogOut,
  Mail,
  Monitor,
  Moon,
  Settings,
  Sun,
  Zap,
} from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { isWeb } from "@/utils/platform";

const { width: W } = Dimensions.get("window");
const ACCENT = "#208AEF";

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function HomeTabBar({
  activeTab,
  onSelect,
  isDark,
}: {
  activeTab: 0 | 1;
  onSelect: (tab: 0 | 1) => void;
  isDark: boolean;
}) {
  const indicator = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(indicator, {
      toValue: activeTab * (W / 2),
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
  }, [activeTab]);

  const labelColor = (tab: 0 | 1) =>
    activeTab === tab
      ? isDark
        ? "#F4F4F5"
        : "#18181B"
      : isDark
        ? "#52525B"
        : "#A1A1AA";

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? "#09090B" : "#fff",
          borderBottomColor: isDark ? "#18181B" : "#F4F4F5",
        },
      ]}
    >
      {(["Following", "For You"] as const).map((label, i) => (
        <TouchableOpacity
          key={label}
          style={styles.tabBtn}
          onPress={() => onSelect(i as 0 | 1)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, { color: labelColor(i as 0 | 1) }]}>
            {label}
          </Text>
        </TouchableOpacity>
      ))}
      <Animated.View
        style={[
          styles.tabIndicator,
          { left: indicator, backgroundColor: ACCENT },
        ]}
      />
    </View>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ isDark, message }: { isDark: boolean; message: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Zap size={48} color={isDark ? "#27272A" : "#E4E4E7"} strokeWidth={1.5} />
      <Text
        style={[styles.emptyText, { color: isDark ? "#52525B" : "#A1A1AA" }]}
      >
        {message}
      </Text>
    </View>
  );
}

// ─── Feed list ────────────────────────────────────────────────────────────────

function ZapFeed({
  zaps,
  isLoading,
  isRefreshing,
  hasMore,
  onRefresh,
  onEndReached,
  header,
  emptyMessage,
}: {
  zaps: ZapModel[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  header?: React.ReactElement;
  emptyMessage: string;
}) {
  const isDark = useColorScheme() === "dark";

  if (zaps.length === 0 && isLoading) {
    return (
      <Animated.FlatList
        data={[1, 2, 3, 4, 5]}
        keyExtractor={(i) => String(i)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={header}
        renderItem={() => <FeedSkeleton />}
        scrollIndicatorInsets={{ bottom: 0 }}
        automaticallyAdjustsScrollIndicatorInsets={false}
        contentInsetAdjustmentBehavior="automatic"
      />
    );
  }

  return (
    <Animated.FlatList
      data={zaps}
      keyExtractor={(z) => z.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState isDark={isDark} message={emptyMessage} />}
      ListFooterComponent={
        hasMore || isLoading ? (
          <View style={styles.footer}>
            {[60, 80, 60].map((w, i) => (
              <View
                key={i}
                style={[
                  styles.footerPill,
                  { width: w, backgroundColor: isDark ? "#27272A" : "#E4E4E7" },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.footer}>
            <Text
              style={{ color: isDark ? "#3F3F46" : "#D4D4D8", fontSize: 12 }}
            >
              You've caught up ⚡
            </Text>
          </View>
        )
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={ACCENT}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.6}
      renderItem={({ item }) => <ZapCardContainer zap={item} />}
      showsVerticalScrollIndicator={false}
      scrollIndicatorInsets={{ bottom: 0 }}
      automaticallyAdjustsScrollIndicatorInsets={false}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const isDark = useColorScheme() === "dark";
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [profile, setProfile] = useState<UserModel | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { isMobile } = useBreakpoint();

  const drawerAnim = useRef(new Animated.Value(-W * 0.8)).current;

  const { forYou, following, loadForYou, loadFollowing, loadMoreForYou } =
    useFeedStore();

  // Initial load
  useEffect(() => {
    loadForYou(user?.id, true);
    if (user?.id) {
      loadFollowing(user.id, true);
      userService.getById(user.id).then(setProfile);
    }
  }, [user?.id]);

  const handleForYouRefresh = useCallback(() => loadForYou(user?.id, true), [user?.id]);
  const handleFollowingRefresh = useCallback(() => {
    if (user?.id) loadFollowing(user.id, true);
  }, [user?.id]);

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
    Animated.timing(drawerAnim, {
      toValue: open ? 0 : -W * 0.8,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const nextTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const isDesktop = isWeb && !isMobile;

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? "#09090B" : "#F9F9F9" }}>
      <SafeAreaView style={styles.container} edges={["top"]}>
        {/* App bar — only on native/mobile web */}
        {!isDesktop && (
        <View
          style={[
            styles.appBar,
            {
              backgroundColor: isDark ? "#09090B" : "#fff",
              borderBottomColor: isDark ? "#18181B" : "#F4F4F5",
            },
          ]}
        >
          <View style={styles.appBarContent}>
            <TouchableOpacity
              onPress={() => toggleDrawer(true)}
              style={styles.headerAvatar}
            >
              <Avatar
                uri={profile?.profilePictureUrl}
                name={profile?.displayName ?? user?.email ?? "User"}
                size={32}
              />
            </TouchableOpacity>

            <Image
              source={
                isDark
                  ? require("@/../assets/images/icon_dark.png")
                  : require("@/../assets/images/icon_black.png")
              }
              style={{ width: 28, height: 28 }}
              contentFit="contain"
            />

            <View style={styles.headerRightActions}>
              <TouchableOpacity onPress={() => router.push("/notifications")}>
                <Bell size={22} color={isDark ? "#fff" : "#18181B"} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/messages")}>
                <Mail size={22} color={isDark ? "#fff" : "#18181B"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        )}

        {/* Tab bar */}
        <HomeTabBar
          activeTab={activeTab}
          onSelect={setActiveTab}
          isDark={isDark}
        />

        {/* Content — Following */}
        {activeTab === 0 ? (
          <ZapFeed
            zaps={following.zaps}
            isLoading={following.isLoading}
            isRefreshing={following.isRefreshing}
            hasMore={following.hasMore}
            onRefresh={handleFollowingRefresh}
            onEndReached={() => {}}
            header={<StoriesRail />}
            emptyMessage="Your circle is quiet. Follow people to see their posts here."
          />
        ) : (
          <ZapFeed
            zaps={forYou.zaps}
            isLoading={forYou.isLoading}
            isRefreshing={forYou.isRefreshing}
            hasMore={forYou.hasMore}
            onRefresh={handleForYouRefresh}
            onEndReached={loadMoreForYou}
            emptyMessage="No posts yet. Be the first to share something amazing!"
          />
        )}
      </SafeAreaView>

      {/* Drawer Overlay Backdrop — native/mobile only */}
      {!isDesktop && drawerOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => toggleDrawer(false)}
        >
          <View style={styles.drawerBackdrop} />
        </Pressable>
      )}

      {/* Custom Left Drawer — native/mobile only */}
      {!isDesktop && (
      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: drawerAnim }],
            backgroundColor: isDark ? "#18181B" : "#FFF",
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        {/* User profile header inside drawer */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            toggleDrawer(false);
            if (user?.id) router.push(`/profile/${user.id}`);
          }}
          style={styles.drawerHeader}
        >
          <Avatar
            uri={profile?.profilePictureUrl}
            name={profile?.displayName ?? user?.email ?? "Name"}
            size={64}
          />
          <Text
            style={[styles.drawerName, { color: isDark ? "#FFF" : "#000" }]}
          >
            {profile?.displayName ?? "No Name"}
          </Text>
          <Text style={styles.drawerUsername}>
            @{profile?.username ?? "username"}
          </Text>

          <View style={styles.drawerCounts}>
            <Text
              style={[styles.countText, { color: isDark ? "#FFF" : "#000" }]}
            >
              {profile?.followingCount ?? 0}{" "}
              <Text style={{ color: "#888" }}>Following</Text>
            </Text>
            <Text
              style={[styles.countText, { color: isDark ? "#FFF" : "#000" }]}
            >
              {profile?.followersCount ?? 0}{" "}
              <Text style={{ color: "#888" }}>Followers</Text>
            </Text>
          </View>
        </TouchableOpacity>

        {/* Drawer Options */}
        <View style={styles.drawerList}>
          <DrawerItem
            icon={<Bookmark size={20} color={isDark ? "#A1A1AA" : "#52525B"} />}
            label="Bookmarks"
            onPress={() => {
              toggleDrawer(false);
              router.push("/bookmarks");
            }}
            isDark={isDark}
          />
          <DrawerItem
            icon={<Coins size={20} color={isDark ? "#A1A1AA" : "#52525B"} />}
            label="Wallet & Coins"
            onPress={() => {
              toggleDrawer(false);
              router.push("/wallet");
            }}
            isDark={isDark}
          />
          <DrawerItem
            icon={<Settings size={20} color={isDark ? "#A1A1AA" : "#52525B"} />}
            label="Settings"
            onPress={() => {
              toggleDrawer(false);
              router.push("/settings");
            }}
            isDark={isDark}
          />

          <View style={styles.drawerDivider} />

          <DrawerItem
            icon={
              theme === "light" ? (
                <Sun size={20} color={isDark ? "#A1A1AA" : "#52525B"} />
              ) : theme === "dark" ? (
                <Moon size={20} color={isDark ? "#A1A1AA" : "#52525B"} />
              ) : (
                <Monitor size={20} color={isDark ? "#A1A1AA" : "#52525B"} />
              )
            }
            label={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
            onPress={nextTheme}
            isDark={isDark}
          />

          <DrawerItem
            icon={<LogOut size={20} color="#EF4444" />}
            label="Logout"
            onPress={() => {
              toggleDrawer(false);
              signOut();
            }}
            isDark={isDark}
            danger
          />
        </View>
      </Animated.View>
      )}
    </View>
  );
}

// ─── Drawer item ─────────────────────────────────────────────────────────────

function DrawerItem({
  icon,
  label,
  onPress,
  isDark,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isDark: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.drawerItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.drawerItemIcon}>{icon}</View>
      <Text
        style={[
          styles.drawerItemLabel,
          { color: danger ? "#EF4444" : isDark ? "#E4E4E7" : "#27272A" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  appBar: {
    borderBottomWidth: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  appBarContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    position: "relative",
  },
  headerAvatar: {
    position: "absolute",
    left: 16,
  },
  headerRightActions: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logo: { fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
    height: 44,
  },
  tabBtn: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabLabel: { fontSize: 14, fontWeight: "600" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    width: W / 2,
    height: 2,
    borderRadius: 1,
  },
  listContent: { padding: 12, paddingBottom: 80 },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: { fontSize: 14, textAlign: "center", maxWidth: 240 },
  footer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
    flexDirection: "row",
    justifyContent: "center",
  },
  footerPill: { height: 8, borderRadius: 4 },
  // Drawer Styles
  drawerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: W * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 16,
    paddingHorizontal: 20,
    zIndex: 999,
  },
  drawerHeader: {
    marginBottom: 24,
  },
  drawerName: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  drawerUsername: {
    fontSize: 14,
    color: "#888",
    marginTop: 2,
  },
  drawerCounts: {
    flexDirection: "row",
    gap: 16,
    marginTop: 16,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
  },
  drawerList: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  drawerItemIcon: {
    width: 32,
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "rgba(128, 128, 128, 0.15)",
    marginVertical: 12,
  },
});
