/**
 * Tabs group layout — Phase 2
 * 5-tab navigation: Home (Zap), Search, Shorts, Stories, Notifications
 * Mirrors the Flutter MainNavigation layout.
 */

import { Tabs } from "expo-router";
import { CircleDashed, Play, Search, Zap } from "lucide-react-native";
import { StyleSheet, Text, View } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';

const ACCENT = "#208AEF";
const TAB_H = 60;

function TabIcon({
  icon,
  focused,
  badge,
}: {
  icon: React.ReactNode;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.iconWrap}>
      {icon}
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badge > 99 ? "99+" : String(badge)}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: isDark ? "#52525B" : "#A1A1AA",
        tabBarStyle: {
          backgroundColor: isDark ? "#09090B" : "#FFFFFF",
          borderTopColor: isDark ? "#18181B" : "#F4F4F5",
          borderTopWidth: 1,
          height: TAB_H,
          paddingTop: 8,
          paddingBottom: 8,
          paddingLeft: 16,
          paddingRight: 16,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          letterSpacing: 0.2,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Zap",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              icon={
                <Zap size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              icon={
                <Search
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shorts"
        options={{
          title: "Shorts",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              icon={
                <Play
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                  fill={focused ? color : "none"}
                />
              }
            />
          ),
        }}
      />
      <Tabs.Screen
        name="stories"
        options={{
          title: "Stories",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              focused={focused}
              icon={
                <CircleDashed
                  size={22}
                  color={color}
                  strokeWidth={focused ? 2.5 : 2}
                />
              }
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: "center", justifyContent: "center" },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "800" },
});
