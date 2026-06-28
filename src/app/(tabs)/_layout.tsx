import { Colors } from "@/constants/theme";
import { TabBarVisibilityContext } from "@/contexts/TabBarVisibilityContext";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useState } from "react";

export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];
  const [tabBarHidden, setTabBarHidden] = useState(false);
  const { isDesktopWeb } = useBreakpoint();

  return (
    <TabBarVisibilityContext.Provider value={{ setTabBarHidden }}>
      <NativeTabs
        backgroundColor={colors.background}
        indicatorColor={colors.backgroundElement}
        labelStyle={{ selected: { color: colors.text } }}
        hidden={tabBarHidden || isDesktopWeb}
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
