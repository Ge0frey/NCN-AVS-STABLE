import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  notification: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  hideNotification: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

interface AppContextProviderProps {
  children: ReactNode;
}

export const AppContextProvider: React.FC<AppContextProviderProps> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'info' as const,
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
    setNotification({
      show: true,
      message,
      type,
    });

    // Auto-hide notifications after 5 seconds
    setTimeout(() => {
      hideNotification();
    }, 5000);
  };

  const hideNotification = () => {
    setNotification((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const value = {
    loading,
    setLoading,
    notification,
    showNotification,
    hideNotification,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext; 