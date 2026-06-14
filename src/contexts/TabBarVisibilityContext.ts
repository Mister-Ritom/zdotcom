import { createContext, useContext } from 'react';

type TabBarVisibilityContextType = {
  setTabBarHidden: (hidden: boolean) => void;
};

export const TabBarVisibilityContext = createContext<TabBarVisibilityContextType>({
  setTabBarHidden: () => {},
});

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
