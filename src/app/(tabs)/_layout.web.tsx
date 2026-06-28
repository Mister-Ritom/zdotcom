import React, { useState } from 'react';
import { Slot } from 'expo-router';
import { TabBarVisibilityContext } from '@/contexts/TabBarVisibilityContext';

export default function TabsLayoutWeb() {
  const [tabBarHidden, setTabBarHidden] = useState(false);

  return (
    <TabBarVisibilityContext.Provider value={{ setTabBarHidden }}>
      <Slot />
    </TabBarVisibilityContext.Provider>
  );
}
