// src/components/notifications/NotificationBell.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, X, Clock, Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { createClient } from '@/src/lib/supabase/client';
import { toast } from 'sonner';
import Link from 'next/link';
import moment from 'moment';
import 'moment/locale/id';

moment.locale('id');

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'system' | 'activity' | 'reminder' | 'alert';
  read: boolean;
  action_url?: string;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time notifications
  useEffect(() => {
    fetchNotifications();

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          setUnreadCount(prev => prev + 1);
          
          // Show toast for new notification
          toast.custom((t) => (
            <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
              <div className="flex items-start gap-3">
                <div className="shrink-0">
                  {getNotificationIcon(newNotification.type, 'h-5 w-5')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{newNotification.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{newNotification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">{moment(newNotification.created_at).fromNow()}</p>
                </div>
                <button onClick={() => toast.dismiss(t)} className="text-gray-500 hover:text-gray-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ), { duration: 5000 });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      toast.success('Semua notifikasi telah ditandai dibaca');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Gagal menandai semua notifikasi');
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: string, className: string = 'h-5 w-5') => {
    switch (type) {
      case 'success':
        return <CheckCircle className={`${className} text-green-400`} />;
      case 'warning':
        return <AlertTriangle className={`${className} text-yellow-400`} />;
      case 'error':
        return <AlertCircle className={`${className} text-red-400`} />;
      default:
        return <Info className={`${className} text-blue-400`} />;
    }
  };

  // Get notification badge color
  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs flex items-center justify-center rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Tandai semua dibaca
                </button>
              )}
              <button
                onClick={() => setShowDropdown(false)}
                className="text-gray-400 hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-700 last:border-0 hover:bg-gray-700/50 transition-colors ${
                    !notification.read ? 'bg-emerald-500/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-white text-sm">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {moment(notification.created_at).fromNow()}
                        </span>
                        <div className="flex items-center gap-2">
                          {notification.action_url && (
                            <Link
                              href={notification.action_url}
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              Lihat Detail
                            </Link>
                          )}
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-gray-500 hover:text-gray-400"
                            >
                              Tandai dibaca
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">Tidak ada notifikasi</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-700 text-center">
            <Link
              href="/notifications"
              className="text-sm text-emerald-400 hover:text-emerald-300"
              onClick={() => setShowDropdown(false)}
            >
              Lihat Semua Notifikasi
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}