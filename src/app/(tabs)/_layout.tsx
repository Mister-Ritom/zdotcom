import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useState } from "react";
import { TabBarVisibilityContext } from "@/contexts/TabBarVisibilityContext";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [tabBarHidden, setTabBarHidden] = useState(false);

  return (
    <TabBarVisibilityContext.Provider value={{ setTabBarHidden }}>
      <NativeTabs
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundElement}
        labelStyle={{ selected: { color: colors.text } }}
        hidden={tabBarHidden}
      >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Zap</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require("@/assets/images/tabIcons/home.png")}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
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
    </NativeTabs>
    </TabBarVisibilityContext.Provider>
  );
}
