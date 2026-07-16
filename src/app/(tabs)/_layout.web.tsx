import React, { useState } from 'react';
import { Tabs } from 'expo-router';
import { TabBarVisibilityContext } from '@/contexts/TabBarVisibilityContext';
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Image } from "react-native";

export default function TabsLayoutWeb() {
  const [tabBarHidden, setTabBarHidden] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const { isDesktopWeb } = useBreakpoint();

  return (
    <TabBarVisibilityContext.Provider value={{ setTabBarHidden }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: tabBarHidden || isDesktopWeb ? 'none' : 'flex',
            backgroundColor: colors.background,
            borderTopColor: colors.backgroundElement,
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSecondary || colors.text,
        }}
      >
        <Tabs.Screen 
          name="index" 
          options={{ 
            title: "Zap",
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("@/assets/images/tabIcons/home.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            )
          }} 
        />
        <Tabs.Screen 
          name="explore" 
          options={{ 
            title: "Explore",
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("@/assets/images/tabIcons/explore.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            )
          }} 
        />
        <Tabs.Screen 
          name="shorts" 
          options={{ 
            title: "Shorts",
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("@/assets/images/tabIcons/shorts.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            )
          }} 
        />
        <Tabs.Screen 
          name="stories" 
          options={{ 
            title: "Stories",
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("@/assets/images/tabIcons/stories.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            )
          }} 
        />
        <Tabs.Screen 
          name="create" 
          options={{ 
            title: "Create",
            tabBarIcon: ({ color, size }) => (
              <Image
                source={require("@/assets/images/tabIcons/add.png")}
                style={{ width: size, height: size, tintColor: color }}
              />
            )
          }} 
        />
      </Tabs>
    </TabBarVisibilityContext.Provider>
  );
}
