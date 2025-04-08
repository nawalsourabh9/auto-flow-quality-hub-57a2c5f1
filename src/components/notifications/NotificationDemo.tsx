
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/use-notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const NotificationDemo = () => {
  const { addNotification } = useNotifications();

  const createInfoNotification = () => {
    addNotification({
      title: 'Information',
      message: 'This is an informational notification.',
      type: 'info',
    });
  };

  const createSuccessNotification = () => {
    addNotification({
      title: 'Success',
      message: 'Operation completed successfully!',
      type: 'success',
    });
  };

  const createWarningNotification = () => {
    addNotification({
      title: 'Warning',
      message: 'Please check your input and try again.',
      type: 'warning',
    });
  };

  const createErrorNotification = () => {
    addNotification({
      title: 'Error',
      message: 'An error occurred while processing your request.',
      type: 'error',
    });
  };

  const createActionableNotification = () => {
    addNotification({
      title: 'New Document Available',
      message: 'A new document has been shared with you. Click to view.',
      type: 'info',
      actionUrl: '/documents',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Demo</CardTitle>
        <CardDescription>
          Click the buttons below to test different types of notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <Button onClick={createInfoNotification} variant="outline">
            Info Notification
          </Button>
          <Button onClick={createSuccessNotification} variant="outline" className="text-green-600">
            Success Notification
          </Button>
          <Button onClick={createWarningNotification} variant="outline" className="text-amber-600">
            Warning Notification
          </Button>
          <Button onClick={createErrorNotification} variant="outline" className="text-red-600">
            Error Notification
          </Button>
          <Button onClick={createActionableNotification} variant="outline" className="text-blue-600">
            Actionable Notification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
