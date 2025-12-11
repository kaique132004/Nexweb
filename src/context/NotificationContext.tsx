// context/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { notificationService, type Notification } from '../service/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: number) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Pega o userId da sessão
    const userSession = sessionStorage.getItem('user-session');

    if (userSession) {
      try {
        const userData = JSON.parse(userSession);
        const userId = userData?.id || userData?.userId;

        console.log('User session found:', { userId, userData });

        if (userId) {
          // Conectar WebSocket
          notificationService.connect(userId.toString());

          // Carregar notificações existentes
          notificationService.getNotifications()
            .then(data => {
              console.log('Loaded notifications:', data);
              setNotifications(data);
            })
            .catch(err => console.error('Failed to load notifications:', err));

          notificationService.getUnreadCount()
            .then(count => {
              console.log('Unread count:', count);
              setUnreadCount(count);
            })
            .catch(err => console.error('Failed to load unread count:', err));

          // Inscrever para novas notificações
          const unsubscribe = notificationService.subscribe((notification) => {
            console.log('New notification received:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Mostrar notificação do navegador
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.title, {
                body: notification.message,
                icon: '/logo.png',
              });
            }
          });

          // Pedir permissão para notificações do navegador
          if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
          }

          return () => {
            unsubscribe();
            notificationService.disconnect();
          };
        } else {
          console.warn('No userId found in session');
        }
      } catch (error) {
        console.error('Failed to parse user session:', error);
      }
    } else {
      console.warn('No user-session found in sessionStorage');
    }
  }, []);

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, addNotification, markAsRead, markAllAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
