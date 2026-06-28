import { Colors } from "@/constants/theme";
import { TabBarVisibilityContext } from "@/contexts/TabBarVisibilityContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useState } from "react";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [tabBarHidden, setTabBarHidden] = useState(false);
  const { isDesktopWeb } = useBreakpoint();

  if (Platform.OS === 'web') {
    return (
      <TabBarVisibilityContext.Provider value={{ setTabBarHidden }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              display: tabBarHidden || isDesktopWeb ? 'none' : 'flex',
              backgroundColor: colors.background,
            },
            tabBarActiveTintColor: colors.text,
          }}
        >
          <Tabs.Screen name="index" options={{ title: "Zap" }} />
          <Tabs.Screen name="explore" options={{ title: "Explore" }} />
          <Tabs.Screen name="shorts" options={{ title: "Shorts" }} />
          <Tabs.Screen name="stories" options={{ title: "Stories" }} />
          <Tabs.Screen name="create" options={{ title: "Create" }} />
        </Tabs>
      </TabBarVisibilityContext.Provider>
    );
  }

  return (
    <TabBarVisibilityContext.Provider value={{ setTabBarHidden }}>
      <NativeTabs
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundElement}
        labelStyle={{ selected: { color: colors.text } }}
        hidden={tabBarHidden}
        minimizeBehavior="onScrollDown"
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>Zap</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/home.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="explore">
          <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/explore.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="shorts">
          <NativeTabs.Trigger.Label>Shorts</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/shorts.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="stories">
          <NativeTabs.Trigger.Label>Stories</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/stories.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="create" role="search">
          <NativeTabs.Trigger.Label>Create</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon
            src={require("@/assets/images/tabIcons/add.png")}
            renderingMode="template"
          />
        </NativeTabs.Trigger>
      </NativeTabs>
    </TabBarVisibilityContext.Provider>
  );
}
