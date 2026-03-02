// src/app/(dashboard)/notifications/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Info,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowLeft
} from 'lucide-react';
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
  metadata?: Record<string, any>;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const itemsPerPage = 20;

  const supabase = createClient();

  useEffect(() => {
    fetchNotifications();
  }, [page, filter, typeFilter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      if (filter === 'unread') {
        query = query.eq('read', false);
      } else if (filter === 'read') {
        query = query.eq('read', true);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setNotifications(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Gagal memuat notifikasi');
    } finally {
      setLoading(false);
    }
  };

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
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Gagal menandai notifikasi');
    }
  };

  const markSelectedAsRead = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', selectedNotifications);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => 
          selectedNotifications.includes(n.id) ? { ...n, read: true } : n
        )
      );
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notifikasi ditandai dibaca`);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Gagal menandai notifikasi');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast.success('Notifikasi dihapus');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const deleteSelected = async () => {
    if (selectedNotifications.length === 0) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedNotifications);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)));
      setSelectedNotifications([]);
      toast.success(`${selectedNotifications.length} notifikasi dihapus`);
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500/20 text-green-400';
      case 'warning': return 'bg-yellow-500/20 text-yellow-400';
      case 'error': return 'bg-red-500/20 text-red-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Bell className="h-8 w-8 text-emerald-400" />
                Notifikasi
              </h1>
              <p className="text-gray-400 mt-1">
                Kelola semua notifikasi Anda
              </p>
            </div>

            {/* Bulk Actions */}
            {selectedNotifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={markSelectedAsRead}
                  className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center gap-2 text-sm"
                >
                  <CheckCheck className="h-4 w-4" />
                  Tandai Dibaca ({selectedNotifications.length})
                </button>
                <button
                  onClick={deleteSelected}
                  className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 flex items-center gap-2 text-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Hapus ({selectedNotifications.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Status
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Notifikasi</option>
                <option value="unread">Belum Dibaca</option>
                <option value="read">Sudah Dibaca</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Tipe
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="info">Info</option>
                <option value="success">Sukses</option>
                <option value="warning">Peringatan</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilter('all');
                  setTypeFilter('all');
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Reset Filter
              </button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : notifications.length > 0 ? (
            <>
              {/* Select All Header */}
              <div className="p-4 border-b border-gray-700 bg-gray-900/50">
                <label className="flex items-center gap-3 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.length === notifications.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Pilih Semua</span>
                  <span className="text-gray-500 text-xs">
                    ({selectedNotifications.length} dipilih)
                  </span>
                </label>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-700/50 transition-colors ${
                      !notification.read ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => toggleSelect(notification.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                      />

                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-white">
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {moment(notification.created_at).fromNow()}
                          </span>
                        </div>

                        <p className="text-sm text-gray-400 mb-2">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getNotificationBadge(notification.type)}`}>
                              {notification.type}
                            </span>
                            <span className="text-xs text-gray-600">•</span>
                            <span className="text-xs text-gray-500">
                              {notification.category}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {notification.action_url && (
                              <Link
                                href={notification.action_url}
                                className="text-xs text-emerald-400 hover:text-emerald-300"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Lihat Detail
                              </Link>
                            )}
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-xs text-gray-500 hover:text-gray-400"
                              >
                                Tandai Dibaca
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(notification.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Halaman {page} dari {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Tidak Ada Notifikasi
              </h3>
              <p className="text-gray-400 text-sm">
                {filter !== 'all' 
                  ? 'Tidak ada notifikasi dengan filter yang dipilih'
                  : 'Anda belum memiliki notifikasi'}
              </p>
              {filter !== 'all' && (
                <button
                  onClick={() => {
                    setFilter('all');
                    setTypeFilter('all');
                  }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 text-sm"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}