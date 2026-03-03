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
  ArrowLeft,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationPreferences {
  id?: string;
  user_id?: string;
  email_notifications: boolean;
  push_notifications: boolean;
  activity_alerts: boolean;
  reminder_alerts: boolean;
  system_alerts: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function NotificationPreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_notifications: true,
    push_notifications: true,
    activity_alerts: true,
    reminder_alerts: true,
    system_alerts: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPreferences();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [preferences]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(); // Menggunakan maybeSingle agar tidak error jika data tidak ada

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      } else {
        // Jika belum ada preferensi, buat default
        const defaultPrefs = {
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          activity_alerts: true,
          reminder_alerts: true,
          system_alerts: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { data: newData, error: insertError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (newData) {
          setPreferences(newData);
          toast.success('Preferensi default telah dibuat');
        }
      }
    } catch (error: any) {
      console.error('Error fetching preferences:', error);
      toast.error(error.message || 'Gagal memuat preferensi notifikasi');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setHasChanges(false);
      toast.success('Preferensi notifikasi berhasil disimpan');
      
      // Refresh data
      await fetchPreferences();
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error(error.message || 'Gagal menyimpan preferensi');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setPreferences({
      email_notifications: true,
      push_notifications: true,
      activity_alerts: true,
      reminder_alerts: true,
      system_alerts: true
    });
    toast.info('Preferensi direset ke default');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-emerald-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Bell className="h-6 w-6 text-emerald-400 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-400 mt-4">Memuat preferensi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-brfrom-gray-900 via-gray-800 to-emerald-900 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header with status */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/notifications"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Kembali ke Notifikasi
          </Link>
          
          {hasChanges && (
            <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm border border-yellow-500/30">
              <AlertCircle className="h-4 w-4" />
              Ada perubahan yang belum disimpan
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 md:p-8 shadow-xl">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-xl">
                <Bell className="h-6 w-6 text-emerald-400" />
              </div>
              Preferensi Notifikasi
            </h1>
            <p className="text-gray-400 mt-2 ml-14">
              Atur bagaimana dan kapan Anda ingin menerima notifikasi
            </p>
          </div>

          <div className="space-y-8">
            {/* Channel Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 px-1">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                Saluran Notifikasi
              </h3>
              
              <div className="grid gap-3">
                <ToggleOption
                  icon={Mail}
                  title="Notifikasi Email"
                  description="Terima notifikasi melalui email"
                  checked={preferences.email_notifications}
                  onChange={(checked) => setPreferences({...preferences, email_notifications: checked})}
                />

                <ToggleOption
                  icon={Smartphone}
                  title="Notifikasi Push"
                  description="Terima notifikasi real-time di browser"
                  checked={preferences.push_notifications}
                  onChange={(checked) => setPreferences({...preferences, push_notifications: checked})}
                />
              </div>
            </div>

            {/* Type Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 px-1">
                <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
                Jenis Notifikasi
              </h3>
              
              <div className="grid gap-3">
                <ToggleOption
                  icon={Activity}
                  title="Aktivitas"
                  description="Notifikasi terkait aktivitas Anda seperti status permohonan"
                  checked={preferences.activity_alerts}
                  onChange={(checked) => setPreferences({...preferences, activity_alerts: checked})}
                />

                <ToggleOption
                  icon={Calendar}
                  title="Pengingat"
                  description="Notifikasi pengingat jadwal survey dan deadline"
                  checked={preferences.reminder_alerts}
                  onChange={(checked) => setPreferences({...preferences, reminder_alerts: checked})}
                />

                <ToggleOption
                  icon={Shield}
                  title="Sistem"
                  description="Notifikasi sistem dan keamanan seperti perubahan password"
                  checked={preferences.system_alerts}
                  onChange={(checked) => setPreferences({...preferences, system_alerts: checked})}
                />
              </div>
            </div>

            {/* Summary Card */}
            <div className="bg-gray-700/30 rounded-xl p-4 border border-gray-600">
              <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Ringkasan Preferensi
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <div className={`w-2 h-2 rounded-full ${preferences.email_notifications ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  Email: {preferences.email_notifications ? 'Aktif' : 'Nonaktif'}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className={`w-2 h-2 rounded-full ${preferences.push_notifications ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  Push: {preferences.push_notifications ? 'Aktif' : 'Nonaktif'}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className={`w-2 h-2 rounded-full ${preferences.activity_alerts ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  Aktivitas: {preferences.activity_alerts ? 'Aktif' : 'Nonaktif'}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className={`w-2 h-2 rounded-full ${preferences.reminder_alerts ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  Pengingat: {preferences.reminder_alerts ? 'Aktif' : 'Nonaktif'}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <div className={`w-2 h-2 rounded-full ${preferences.system_alerts ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                  Sistem: {preferences.system_alerts ? 'Aktif' : 'Nonaktif'}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-3">
              <button
                onClick={savePreferences}
                disabled={saving || !hasChanges}
                className="flex-1 px-6 py-3 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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
              
              <button
                onClick={resetToDefault}
                disabled={saving}
                className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <XCircle className="h-5 w-5" />
                Reset ke Default
              </button>
            </div>
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Notifikasi akan dikirim sesuai dengan preferensi yang Anda atur</p>
        </div>
      </div>
    </div>
  );
}

// Komponen Toggle Option yang lebih rapi
function ToggleOption({ 
  icon: Icon, 
  title, 
  description, 
  checked, 
  onChange 
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-4 bg-gray-700/30 rounded-xl border border-gray-600 hover:border-emerald-500/50 transition-colors cursor-pointer group">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg transition-colors ${
          checked ? 'bg-emerald-500/20' : 'bg-gray-600/50'
        }`}>
          <Icon className={`h-5 w-5 transition-colors ${
            checked ? 'text-emerald-400' : 'text-gray-400'
          }`} />
        </div>
        <div>
          <p className="font-medium text-white group-hover:text-emerald-400 transition-colors">
            {title}
          </p>
          <p className="text-xs text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-12 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-600' : 'bg-gray-600'
        }`}>
          <div className={`w-4 h-4 rounded-full bg-white transform transition-transform absolute top-1 ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </div>
      </div>
    </label>
  );
}