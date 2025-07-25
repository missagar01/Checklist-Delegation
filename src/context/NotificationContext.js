// src/contexts/NotificationContext.js
import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notification, setNotification] = useState(null);

  // Optional: Add auto-dismiss functionality
  const showNotification = (message, timeout = 5000) => {
    setNotification(message);
    if (timeout) {
      setTimeout(() => setNotification(null), timeout);
    }
  };

  return (
    <NotificationContext.Provider value={{ notification, setNotification, showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);