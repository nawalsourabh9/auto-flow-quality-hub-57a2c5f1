
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  type: "info" | "warning" | "success" | "error";
  actionUrl?: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Check for user authentication status
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      if (event === 'SIGNED_IN') {
        loadNotifications();
      } else if (event === 'SIGNED_OUT') {
        setNotifications([]);
      }
    });

    // Get current user
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        loadNotifications();
      }
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Set up realtime subscription for notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Reload notifications when there's a change
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }

      // Transform the data to match our Notification interface
      const formattedNotifications = data.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        timestamp: new Date(notification.created_at),
        read: notification.read,
        type: notification.type as "info" | "warning" | "success" | "error",
        actionUrl: notification.action_url
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error in loadNotifications:', error);
    }
  };

  const addNotification = async (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    if (!user) {
      console.warn('Cannot add notification - user not authenticated');
      toast.error("Please log in to manage notifications");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: user.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            action_url: notification.actionUrl,
            read: false
          }
        ])
        .select();

      if (error) {
        console.error('Error adding notification:', error);
        return;
      }

      // Notification will be added via realtime subscription
    } catch (error) {
      console.error('Error in addNotification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    if (!user) {
      toast.error("Please log in to manage notifications");
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update will be reflected via realtime subscription
    } catch (error) {
      console.error('Error in markAsRead:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) {
      toast.error("Please log in to manage notifications");
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return;
      }

      // Updates will be reflected via realtime subscription
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
    }
  };

  const removeNotification = async (id: string) => {
    if (!user) {
      toast.error("Please log in to manage notifications");
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error removing notification:', error);
        return;
      }

      // Deletion will be reflected via realtime subscription
    } catch (error) {
      console.error('Error in removeNotification:', error);
    }
  };

  const clearNotifications = async () => {
    if (!user) {
      toast.error("Please log in to manage notifications");
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing notifications:', error);
        return;
      }

      // Deletions will be reflected via realtime subscription
    } catch (error) {
      console.error('Error in clearNotifications:', error);
    }
  };

  // If user is not authenticated but we're done loading, provide a limited context with placeholder functions
  if (!user && !loading) {
    return (
      <NotificationsContext.Provider
        value={{
          notifications: [],
          unreadCount: 0,
          addNotification: () => {
            toast.error("Please log in to manage notifications");
          },
          markAsRead: () => {
            toast.error("Please log in to manage notifications");
          },
          markAllAsRead: () => {
            toast.error("Please log in to manage notifications");
          },
          removeNotification: () => {
            toast.error("Please log in to manage notifications");
          },
          clearNotifications: () => {
            toast.error("Please log in to manage notifications");
          }
        }}
      >
        {children}
      </NotificationsContext.Provider>
    );
  }

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  
  return context;
};
