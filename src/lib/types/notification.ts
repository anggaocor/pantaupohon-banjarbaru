// src/types/notification.ts
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'activity' | 'reminder' | 'alert';
  read: boolean;
  action_url?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  activity_alerts: boolean;
  reminder_alerts: boolean;
  system_alerts: boolean;
}

// src/lib/notifications.ts
import { createClient } from '@/src/lib/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  category?: 'system' | 'activity' | 'reminder' | 'alert';
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export async function createNotification({
  userId,
  title,
  message,
  type = 'info',
  category = 'system',
  actionUrl,
  metadata
}: CreateNotificationParams) {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        category,
        action_url: actionUrl,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Contoh penggunaan:
// await createNotification({
//   userId: user.id,
//   title: 'Data Baru Ditambahkan',
//   message: 'Sebuah data pemantauan pohon telah ditambahkan',
//   type: 'success',
//   category: 'activity',
//   actionUrl: '/laporan'
// });