
import React from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationItem } from "./NotificationItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export const NotificationsList: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  if (notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No notifications yet</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={markAllAsRead}
          className="text-xs"
        >
          Mark all as read
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearNotifications}
          className="text-xs text-red-500 hover:text-red-600"
        >
          <Trash2 className="h-3 w-3 mr-1" /> 
          Clear all
        </Button>
      </div>
      <ScrollArea className="h-[300px]">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={markAsRead}
          />
        ))}
      </ScrollArea>
    </div>
  );
};
