import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TabBarContextType {
    isTabBarVisible: boolean;
    hideTabBar: () => void;
    showTabBar: () => void;
}

const TabBarContext = createContext<TabBarContextType | undefined>(undefined);

export const TabBarProvider = ({ children }: { children: ReactNode }) => {
    const [isTabBarVisible, setIsTabBarVisible] = useState(true);

    const hideTabBar = () => setIsTabBarVisible(false);
    const showTabBar = () => setIsTabBarVisible(true);

    return (
        <TabBarContext.Provider value={{ isTabBarVisible, hideTabBar, showTabBar }}>
            {children}
        </TabBarContext.Provider>
    );
};

export const useTabBar = () => {
    const context = useContext(TabBarContext);
    if (!context) {
        throw new Error('useTabBar must be used within TabBarProvider');
    }
    return context;
};
