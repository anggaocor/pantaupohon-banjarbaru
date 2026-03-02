// src/app/(dashboard)/notifications/preferences/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import { 
  Bell, 
  Mail, 
  Smartphone,
  AlertCircle,
  Activity,
  Calendar,
  Shield,
  Save,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  activity_alerts: boolean;
  reminder_alerts: boolean;
  system_alerts: boolean;
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    activity_alerts: true,
    reminder_alerts: true,
    system_alerts: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Gagal memuat preferensi notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Preferensi notifikasi berhasil disimpan');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Gagal menyimpan preferensi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Notifikasi
          </Link>

          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Bell className="h-8 w-8 text-emerald-400" />
            Preferensi Notifikasi
          </h1>
          <p className="text-gray-400 mt-1">
            Atur bagaimana Anda ingin menerima notifikasi
          </p>
        </div>

        {/* Preferences Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="space-y-6">
            {/* Channel Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-400" />
                Saluran Notifikasi
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">Notifikasi Email</p>
                      <p className="text-xs text-gray-400">Terima notifikasi melalui email</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.email_notifications}
                    onChange={(e) => setPreferences({...preferences, email_notifications: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">Notifikasi Push</p>
                      <p className="text-xs text-gray-400">Terima notifikasi real-time di browser</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.push_notifications}
                    onChange={(e) => setPreferences({...preferences, push_notifications: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Type Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-emerald-400" />
                Jenis Notifikasi
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">Aktivitas</p>
                      <p className="text-xs text-gray-400">Notifikasi terkait aktivitas Anda</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.activity_alerts}
                    onChange={(e) => setPreferences({...preferences, activity_alerts: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">Pengingat</p>
                      <p className="text-xs text-gray-400">Notifikasi pengingat jadwal</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.reminder_alerts}
                    onChange={(e) => setPreferences({...preferences, reminder_alerts: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-white">Sistem</p>
                      <p className="text-xs text-gray-400">Notifikasi sistem dan keamanan</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.system_alerts}
                    onChange={(e) => setPreferences({...preferences, system_alerts: e.target.checked})}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-emerald-600 focus:ring-emerald-500"
                  />
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-700">
              <button
                onClick={savePreferences}
                disabled={saving}
                className="w-full md:w-auto px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    Simpan Preferensi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}