import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Image, Pressable, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useColorScheme } from '../hooks/use-color-scheme';
import { useAuthStore } from '../stores/useAuthStore';
import { userService } from '../services/userService';
import { Avatar } from './common/Avatar';
import { 
  Zap, 
  Compass, 
  Play, 
  BookOpen, 
  PlusSquare, 
  Bell, 
  Mail, 
  Bookmark, 
  Settings, 
  LogOut 
} from 'lucide-react-native';
import NotificationsPanel from './panels/NotificationsPanel';

const ACCENT = '#208AEF';

interface NavItem {
  label: string;
  icon: React.ComponentType<any>;
  path?: string;
  panel?: 'notifications' | 'messages';
}

export default function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isTablet } = useBreakpoint();
  const isDark = useColorScheme() === 'dark';
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  
  const [activePanel, setActivePanel] = useState<'notifications' | 'messages' | null>(null);
  const panelWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user?.id) {
      userService.getById(user.id).then(setProfile);
    }
  }, [user?.id]);

  const togglePanel = (panel: 'notifications' | 'messages') => {
    if (activePanel === panel) {
      // Close
      Animated.timing(panelWidth, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setActivePanel(null));
    } else {
      // Open or switch
      const wasOpen = activePanel !== null;
      setActivePanel(panel);
      if (!wasOpen) {
        Animated.timing(panelWidth, {
          toValue: 320,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  const closePanel = () => {
    Animated.timing(panelWidth, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setActivePanel(null));
  };

  const handleNavPress = (item: NavItem) => {
    if (item.panel) {
      togglePanel(item.panel);
    } else if (item.path) {
      closePanel();
      router.push(item.path as any);
    }
  };

  const navItems: NavItem[] = [
    { label: 'Zap', icon: Zap, path: '/' },
    { label: 'Explore', icon: Compass, path: '/explore' },
    { label: 'Shorts', icon: Play, path: '/shorts' },
    { label: 'Stories', icon: BookOpen, path: '/stories' },
    { label: 'Create', icon: PlusSquare, path: '/create' },
    { label: 'Notifications', icon: Bell, panel: 'notifications' },
    { label: 'Messages', icon: Mail, path: '/messages' }, // Standard route but we could make it a panel if wanted. Prompt says "Nav items that open panels get an icon button... Build a NotificationsPanel as the first panel"
    { label: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
  ];

  const bg = isDark ? '#09090B' : '#FFF';
  const border = isDark ? '#18181B' : '#F4F4F5';
  const textColor = isDark ? '#FFF' : '#18181B';
  const subColor = isDark ? '#A1A1AA' : '#71717A';

  const navWidth = isTablet ? 64 : 240;

  return (
    <View style={[styles.container, { backgroundColor: bg, borderRightColor: border }]}>
      {/* Left Navigation Column */}
      <View style={[styles.navColumn, { width: navWidth, borderRightColor: border }]}>
        {/* Top Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={
              isDark
                ? require('../../assets/images/icon_dark.png')
                : require('../../assets/images/icon_black.png')
            }
            style={styles.logoImage}
            resizeMode="contain"
          />
          {!isTablet && <Text style={[styles.logoText, { color: textColor }]}>Z</Text>}
        </View>

        <View style={styles.divider} />

        {/* Nav Items */}
        <View style={styles.navItemsList}>
          {navItems.map((item, idx) => {
            const Icon = item.icon;
            // Check if active
            const isRouteActive = item.path && (pathname === item.path || (item.path === '/' && pathname === '/(tabs)'));
            const isPanelActive = item.panel && activePanel === item.panel;
            const isActive = isRouteActive || isPanelActive;

            return (
              <Pressable
                key={idx}
                onPress={() => handleNavPress(item)}
                // @ts-ignore
                title={isTablet ? item.label : undefined}
                style={({ hovered }: any) => [
                  styles.navItem,
                  {
                    height: 40,
                    paddingHorizontal: isTablet ? 0 : 16,
                    justifyContent: isTablet ? 'center' : 'flex-start',
                    backgroundColor: isActive 
                      ? (isDark ? 'rgba(32, 138, 239, 0.15)' : 'rgba(32, 138, 239, 0.08)')
                      : hovered 
                        ? (isDark ? '#1C1917' : '#F4F4F5') 
                        : 'transparent',
                    borderLeftWidth: isActive ? 3 : 0,
                    borderLeftColor: ACCENT,
                  }
                ]}
              >
                <Icon 
                  size={20} 
                  color={isActive ? ACCENT : subColor} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                {!isTablet && (
                  <Text 
                    style={[
                      styles.navLabel, 
                      { 
                        color: isActive ? ACCENT : textColor,
                        fontWeight: isActive ? '700' : '500',
                      }
                    ]}
                  >
                    {item.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Profile / Settings */}
        <View style={styles.bottomSection}>
          <Pressable
            onPress={() => {
              closePanel();
              if (user?.id) router.push(`/profile/${user.id}`);
            }}
            // @ts-ignore
            title={isTablet ? 'Profile' : undefined}
            style={({ hovered }: any) => [
              styles.profileBtn,
              {
                paddingHorizontal: isTablet ? 0 : 12,
                justifyContent: isTablet ? 'center' : 'flex-start',
                backgroundColor: hovered ? (isDark ? '#1C1917' : '#F4F4F5') : 'transparent',
              }
            ]}
          >
            <Avatar 
              uri={profile?.profilePictureUrl} 
              name={profile?.displayName ?? user?.email ?? 'User'} 
              size={isTablet ? 32 : 36} 
            />
            {!isTablet && (
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: textColor }]} numberOfLines={1}>
                  {profile?.displayName ?? 'User'}
                </Text>
                <Text style={[styles.profileUsername, { color: subColor }]} numberOfLines={1}>
                  @{profile?.username ?? 'username'}
                </Text>
              </View>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              closePanel();
              router.push('/settings');
            }}
            // @ts-ignore
            title={isTablet ? 'Settings' : undefined}
            style={({ hovered }: any) => [
              styles.navItem,
              {
                height: 40,
                paddingHorizontal: isTablet ? 0 : 16,
                justifyContent: isTablet ? 'center' : 'flex-start',
                backgroundColor: hovered ? (isDark ? '#1C1917' : '#F4F4F5') : 'transparent',
              }
            ]}
          >
            <Settings size={20} color={subColor} />
            {!isTablet && <Text style={[styles.navLabel, { color: textColor }]}>Settings</Text>}
          </Pressable>

          <Pressable
            onPress={() => {
              closePanel();
              signOut();
            }}
            // @ts-ignore
            title={isTablet ? 'Sign Out' : undefined}
            style={({ hovered }: any) => [
              styles.navItem,
              {
                height: 40,
                paddingHorizontal: isTablet ? 0 : 16,
                justifyContent: isTablet ? 'center' : 'flex-start',
                backgroundColor: hovered ? (isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)') : 'transparent',
              }
            ]}
          >
            <LogOut size={20} color="#EF4444" />
            {!isTablet && <Text style={[styles.navLabel, { color: '#EF4444' }]}>Sign Out</Text>}
          </Pressable>
        </View>
      </View>

      {/* Animated Panel Column */}
      <Animated.View style={[styles.panelColumn, { width: panelWidth, borderRightColor: border }]}>
        <View style={styles.panelContentWrapper}>
          {activePanel === 'notifications' && (
            <NotificationsPanel onClose={closePanel} />
          )}
          {activePanel === 'messages' && (
            <View style={styles.dummyPanel}>
              <Text style={{ color: textColor }}>Messages Panel</Text>
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    flexDirection: 'row',
    borderRightWidth: 1,
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
      }
    })
  },
  navColumn: {
    height: '100%',
    paddingVertical: 20,
    display: 'flex',
    flexDirection: 'column',
    borderRightWidth: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    height: 32,
    marginBottom: 16,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  navItemsList: {
    gap: 8,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    // @ts-ignore
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  navLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  bottomSection: {
    marginTop: 'auto',
    gap: 8,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 8,
    // @ts-ignore
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 13,
    fontWeight: '600',
  },
  profileUsername: {
    fontSize: 11,
    marginTop: 1,
  },
  panelColumn: {
    height: '100%',
    overflow: 'hidden',
    borderRightWidth: 1,
  },
  panelContentWrapper: {
    width: 320,
    height: '100%',
  },
  dummyPanel: {
    flex: 1,
    padding: 16,
  }
});
