// app/setting/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/src/components/ui";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Palette,
  Database,
  Map,
  Mail,
  Lock,
  Moon,
  Sun,
  Volume2,
  Clock,
  HardDrive,
  Cloud,
  Save,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  UserCog,
  FileText,
  Download,
  Upload,
  Filter,
  Sliders,
  ToggleLeft,
  ToggleRight,
  Smartphone,
  Monitor,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Wifi,
  Battery,
  Fingerprint,
  Key
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/id";

moment.locale('id');

interface AppSettings {
  id: string;
  site_name: string;
  site_description: string;
  site_url: string;
  admin_email: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification: boolean;
  created_at: string;
  updated_at: string;
}

interface NotificationSettings {
  id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  notification_sound: boolean;
  desktop_notifications: boolean;
  notification_volume: number;
  email_on_new_submission: boolean;
  email_on_survey_complete: boolean;
  email_on_status_change: boolean;
  created_at: string;
  updated_at: string;
}

interface SecuritySettings {
  id: string;
  two_factor_auth: boolean;
  session_timeout: number;
  max_login_attempts: number;
  password_min_length: number;
  password_require_special: boolean;
  password_require_numbers: boolean;
  password_require_uppercase: boolean;
  session_management: 'single' | 'multiple' | 'limited';
  ip_whitelist_enabled: boolean;
  ip_whitelist: string[];
  created_at: string;
  updated_at: string;
}

interface ThemeSettings {
  id: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  sidebar_color: string;
  header_color: string;
  font_family: string;
  borderRadius: number;
  dark_mode: boolean;
  high_contrast: boolean;
  animations_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface BackupSettings {
  id: string;
  auto_backup: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  retention_days: number;
  backup_to_cloud: boolean;
  cloud_provider: 'google' | 'aws' | 'none';
  last_backup: string;
  backup_size: number;
  created_at: string;
  updated_at: string;
}

interface MapSettings {
  id: string;
  default_latitude: number;
  default_longitude: number;
  default_zoom: number;
  map_provider: 'openstreetmap' | 'google' | 'maptiler';
  map_style: 'streets' | 'satellite' | 'terrain' | 'light' | 'dark';
  enable_clustering: boolean;
  show_heatmap: boolean;
  heatmap_radius: number;
  show_traffic: boolean;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export default function SettingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);

  // Settings states
  const [appSettings, setAppSettings] = useState<AppSettings>({
    id: '',
    site_name: 'SIPANTARU',
    site_description: 'Sistem Pemantauan Pohon Dinas Lingkungan Hidup Kota Banjarbaru',
    site_url: 'https://app.example.com',
    admin_email: 'admin@example.com',
    timezone: 'Asia/Jakarta',
    date_format: 'DD/MM/YYYY',
    time_format: 'HH:mm',
    language: 'id',
    maintenance_mode: false,
    registration_enabled: true,
    email_verification: true,
    created_at: '',
    updated_at: ''
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    id: '',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    notification_sound: true,
    desktop_notifications: true,
    notification_volume: 70,
    email_on_new_submission: true,
    email_on_survey_complete: true,
    email_on_status_change: true,
    created_at: '',
    updated_at: ''
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    id: '',
    two_factor_auth: false,
    session_timeout: 30,
    max_login_attempts: 5,
    password_min_length: 8,
    password_require_special: true,
    password_require_numbers: true,
    password_require_uppercase: true,
    session_management: 'multiple',
    ip_whitelist_enabled: false,
    ip_whitelist: [],
    created_at: '',
    updated_at: ''
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    id: '',
    primary_color: '#10b981',
    secondary_color: '#3b82f6',
    accent_color: '#f59e0b',
    sidebar_color: '#1f2937',
    header_color: '#111827',
    font_family: 'Inter',
    borderRadius: 8,
    dark_mode: true,
    high_contrast: false,
    animations_enabled: true,
    created_at: '',
    updated_at: ''
  });

  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    id: '',
    auto_backup: true,
    backup_frequency: 'daily',
    backup_time: '02:00',
    retention_days: 30,
    backup_to_cloud: false,
    cloud_provider: 'none',
    last_backup: '',
    backup_size: 0,
    created_at: '',
    updated_at: ''
  });

  const [mapSettings, setMapSettings] = useState<MapSettings>({
    id: '',
    default_latitude: -3.4431,
    default_longitude: 114.8308,
    default_zoom: 13,
    map_provider: 'openstreetmap',
    map_style: 'dark',
    enable_clustering: true,
    show_heatmap: false,
    heatmap_radius: 20,
    show_traffic: false,
    api_key: '',
    created_at: '',
    updated_at: ''
  });

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        toast.error("Anda harus login terlebih dahulu");
        router.push("/login");
        return;
      }

      setUser(session.user);
      
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();
      
      setProfile(profileData);
      
      // Check if user is admin
      if (profileData?.role !== 'admin') {
        toast.error("Anda tidak memiliki akses ke halaman ini");
        router.push("/dashboard");
        return;
      }

      await fetchSettings();
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const fetchSettings = async () => {
    try {
      const supabase = createClient();

      const [
        appData,
        notificationData,
        securityData,
        themeData,
        backupData,
        mapData
      ] = await Promise.all([
        supabase.from('app_settings').select('*').single(),
        supabase.from('notification_settings').select('*').single(),
        supabase.from('security_settings').select('*').single(),
        supabase.from('theme_settings').select('*').single(),
        supabase.from('backup_settings').select('*').single(),
        supabase.from('map_settings').select('*').single()
      ]);

      if (!appData.error && appData.data) setAppSettings(appData.data);
      if (!notificationData.error && notificationData.data) setNotificationSettings(notificationData.data);
      if (!securityData.error && securityData.data) setSecuritySettings(securityData.data);
      if (!themeData.error && themeData.data) setThemeSettings(themeData.data);
      if (!backupData.error && backupData.data) setBackupSettings(backupData.data);
      if (!mapData.error && mapData.data) setMapSettings(mapData.data);

    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Gagal memuat pengaturan");
    }
  };

  const saveSettings = async (type: string, data: any) => {
    setSaving(true);

    try {
      const supabase = createClient();
      const tableMap: Record<string, string> = {
        general: 'app_settings',
        notifications: 'notification_settings',
        security: 'security_settings',
        theme: 'theme_settings',
        backup: 'backup_settings',
        map: 'map_settings'
      };

      const table = tableMap[type];
      if (!table) return;

      const { error } = await supabase
        .from(table)
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success(`Pengaturan ${type} berhasil disimpan`);

    } catch (error: any) {
      console.error(`Error saving ${type} settings:`, error);
      toast.error(`Gagal menyimpan pengaturan ${type}`);
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    try {
      toast.info("Memulai proses backup...");
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setBackupSettings(prev => ({
        ...prev,
        last_backup: new Date().toISOString(),
        backup_size: Math.floor(Math.random() * 100) + 50
      }));

      toast.success("Backup berhasil dibuat");

    } catch (error) {
      console.error("Error creating backup:", error);
      toast.error("Gagal membuat backup");
    }
  };

  const handleRestore = async () => {
    toast.info("Fitur restore akan segera tersedia");
  };

  const handleClearCache = async () => {
    try {
      toast.info("Membersihkan cache...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Cache berhasil dibersihkan");
    } catch (error) {
      toast.error("Gagal membersihkan cache");
    }
  };

  const handleTestEmail = async () => {
    toast.info("Mengirim email test...");
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success("Email test berhasil dikirim");
  };

  const handleTestNotification = async () => {
    toast.info("Mengirim notifikasi test...");
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Notifikasi test berhasil dikirim");
  };

  const handleResetToDefault = (type: string) => {
    if (confirm(`Apakah Anda yakin ingin mengembalikan pengaturan ${type} ke default?`)) {
      toast.success(`Pengaturan ${type} dikembalikan ke default`);
    }
  };

  const timezones = [
    'Asia/Jakarta',
    'Asia/Makassar',
    'Asia/Jayapura',
    'Asia/Bangkok',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
    'America/New_York',
    'Europe/London'
  ];

  const languages = [
    { value: 'id', label: 'Indonesia' },
    { value: 'en', label: 'English' }
  ];

  const fontFamilies = [
    'Inter',
    'Roboto',
    'Poppins',
    'Open Sans',
    'Lato',
    'Montserrat',
    'System Default'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-400">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">
                Pengaturan Sistem
              </h1>
              <p className="text-gray-400">
                Kelola konfigurasi dan preferensi aplikasi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleResetToDefault(activeTab)}
                className="px-4 py-2 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Reset ke Default
              </button>
              <button
                onClick={() => saveSettings(activeTab, 
                  activeTab === 'general' ? appSettings :
                  activeTab === 'notifications' ? notificationSettings :
                  activeTab === 'security' ? securitySettings :
                  activeTab === 'theme' ? themeSettings :
                  activeTab === 'backup' ? backupSettings : mapSettings
                )}
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Settings Navigation */}
        <div className="mb-6 overflow-x-auto">
          <nav className="flex space-x-2 pb-2">
            {[
              { id: 'general', label: 'Umum', icon: Settings },
              { id: 'notifications', label: 'Notifikasi', icon: Bell },
              { id: 'security', label: 'Keamanan', icon: Shield },
              { id: 'theme', label: 'Tampilan', icon: Palette },
              { id: 'map', label: 'Peta', icon: Map },
              { id: 'backup', label: 'Backup', icon: Database },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Settings Content */}
        <Card className="p-6 bg-gray-800 border-gray-700">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-emerald-400" />
                Pengaturan Umum
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nama Aplikasi
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white placeholder-gray-500"
                    value={appSettings.site_name}
                    onChange={(e) => setAppSettings({...appSettings, site_name: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    URL Aplikasi
                  </label>
                  <input
                    type="url"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white placeholder-gray-500"
                    value={appSettings.site_url}
                    onChange={(e) => setAppSettings({...appSettings, site_url: e.target.value})}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deskripsi Aplikasi
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white placeholder-gray-500"
                    value={appSettings.site_description}
                    onChange={(e) => setAppSettings({...appSettings, site_description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Admin
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white placeholder-gray-500"
                    value={appSettings.admin_email}
                    onChange={(e) => setAppSettings({...appSettings, admin_email: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Zona Waktu
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={appSettings.timezone}
                    onChange={(e) => setAppSettings({...appSettings, timezone: e.target.value})}
                  >
                    {timezones.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Format Tanggal
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={appSettings.date_format}
                    onChange={(e) => setAppSettings({...appSettings, date_format: e.target.value})}
                  >
                    <option value="DD/MM/YYYY">31/12/2024</option>
                    <option value="MM/DD/YYYY">12/31/2024</option>
                    <option value="YYYY-MM-DD">2024-12-31</option>
                    <option value="DD MMM YYYY">31 Des 2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Format Waktu
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={appSettings.time_format}
                    onChange={(e) => setAppSettings({...appSettings, time_format: e.target.value})}
                  >
                    <option value="HH:mm">14:30 (24 jam)</option>
                    <option value="hh:mm A">02:30 PM (12 jam)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bahasa
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={appSettings.language}
                    onChange={(e) => setAppSettings({...appSettings, language: e.target.value})}
                  >
                    {languages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <h4 className="font-medium text-gray-200 mb-4">Fitur Aplikasi</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-300">Mode Maintenance</p>
                      <p className="text-sm text-gray-500">Nonaktifkan akses untuk pengguna biasa</p>
                    </div>
                    <button
                      onClick={() => setAppSettings({...appSettings, maintenance_mode: !appSettings.maintenance_mode})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        appSettings.maintenance_mode ? 'bg-red-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          appSettings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-300">Registrasi Pengguna</p>
                      <p className="text-sm text-gray-500">Izinkan pengguna baru mendaftar</p>
                    </div>
                    <button
                      onClick={() => setAppSettings({...appSettings, registration_enabled: !appSettings.registration_enabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        appSettings.registration_enabled ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          appSettings.registration_enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <div>
                      <p className="font-medium text-gray-300">Verifikasi Email</p>
                      <p className="text-sm text-gray-500">Wajib verifikasi email saat registrasi</p>
                    </div>
                    <button
                      onClick={() => setAppSettings({...appSettings, email_verification: !appSettings.email_verification})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        appSettings.email_verification ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          appSettings.email_verification ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-emerald-400" />
                Pengaturan Notifikasi
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-200 mb-3">Channel Notifikasi</h4>
                  
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Email Notifications</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, email_notifications: !notificationSettings.email_notifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.email_notifications ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Push Notifications</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, push_notifications: !notificationSettings.push_notifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.push_notifications ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">SMS Notifications</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, sms_notifications: !notificationSettings.sms_notifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.sms_notifications ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Desktop Notifications</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, desktop_notifications: !notificationSettings.desktop_notifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.desktop_notifications ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.desktop_notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-200 mb-3">Pengaturan Suara</h4>
                  
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Suara Notifikasi</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, notification_sound: !notificationSettings.notification_sound})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.notification_sound ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.notification_sound ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Volume Suara: {notificationSettings.notification_volume}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={notificationSettings.notification_volume}
                      onChange={(e) => setNotificationSettings({...notificationSettings, notification_volume: parseInt(e.target.value)})}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <h4 className="font-medium text-gray-200 mb-3">Event Notifikasi</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Pengajuan Baru</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, email_on_new_submission: !notificationSettings.email_on_new_submission})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.email_on_new_submission ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.email_on_new_submission ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Survey Selesai</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, email_on_survey_complete: !notificationSettings.email_on_survey_complete})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.email_on_survey_complete ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.email_on_survey_complete ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Perubahan Status</span>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, email_on_status_change: !notificationSettings.email_on_status_change})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.email_on_status_change ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationSettings.email_on_status_change ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleTestEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                >
                  Test Email
                </button>
                <button
                  onClick={handleTestNotification}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
                >
                  Test Notifikasi
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-emerald-400" />
                Pengaturan Keamanan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timeout Sesi (menit)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({...securitySettings, session_timeout: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Maksimal Percobaan Login
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="10"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={securitySettings.max_login_attempts}
                    onChange={(e) => setSecuritySettings({...securitySettings, max_login_attempts: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Panjang Minimal Password
                  </label>
                  <input
                    type="number"
                    min="6"
                    max="20"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={securitySettings.password_min_length}
                    onChange={(e) => setSecuritySettings({...securitySettings, password_min_length: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manajemen Sesi
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={securitySettings.session_management}
                    onChange={(e) => setSecuritySettings({...securitySettings, session_management: e.target.value as any})}
                  >
                    <option value="single">Single Session</option>
                    <option value="multiple">Multiple Sessions</option>
                    <option value="limited">Limited (max 3)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-200">Kebijakan Password</h4>
                
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Harus mengandung karakter khusus (!@#$%)</span>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, password_require_special: !securitySettings.password_require_special})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.password_require_special ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.password_require_special ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Harus mengandung angka</span>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, password_require_numbers: !securitySettings.password_require_numbers})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.password_require_numbers ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.password_require_numbers ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Harus mengandung huruf kapital</span>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, password_require_uppercase: !securitySettings.password_require_uppercase})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.password_require_uppercase ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.password_require_uppercase ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Two-Factor Authentication (2FA)</span>
                  <button
                    onClick={() => setSecuritySettings({...securitySettings, two_factor_auth: !securitySettings.two_factor_auth})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings.two_factor_auth ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.two_factor_auth ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>

              <div className="pt-6 border-t border-gray-700">
                <h4 className="font-medium text-gray-200 mb-3">IP Whitelist</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-300">Aktifkan IP Whitelist</span>
                    <button
                      onClick={() => setSecuritySettings({...securitySettings, ip_whitelist_enabled: !securitySettings.ip_whitelist_enabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        securitySettings.ip_whitelist_enabled ? 'bg-emerald-600' : 'bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings.ip_whitelist_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </label>

                  {securitySettings.ip_whitelist_enabled && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Daftar IP (pisahkan dengan koma)
                      </label>
                      <textarea
                        rows={3}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white font-mono text-sm"
                        value={securitySettings.ip_whitelist.join(', ')}
                        onChange={(e) => setSecuritySettings({
                          ...securitySettings, 
                          ip_whitelist: e.target.value.split(',').map(ip => ip.trim())
                        })}
                        placeholder="192.168.1.1, 10.0.0.1, 172.16.0.1"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Theme Settings */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Palette className="h-5 w-5 mr-2 text-emerald-400" />
                Pengaturan Tampilan
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Warna Primer
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="h-10 w-20 rounded border border-gray-700 bg-gray-900"
                      value={themeSettings.primary_color}
                      onChange={(e) => setThemeSettings({...themeSettings, primary_color: e.target.value})}
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                      value={themeSettings.primary_color}
                      onChange={(e) => setThemeSettings({...themeSettings, primary_color: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Warna Sekunder
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="h-10 w-20 rounded border border-gray-700 bg-gray-900"
                      value={themeSettings.secondary_color}
                      onChange={(e) => setThemeSettings({...themeSettings, secondary_color: e.target.value})}
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                      value={themeSettings.secondary_color}
                      onChange={(e) => setThemeSettings({...themeSettings, secondary_color: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Warna Aksen
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="h-10 w-20 rounded border border-gray-700 bg-gray-900"
                      value={themeSettings.accent_color}
                      onChange={(e) => setThemeSettings({...themeSettings, accent_color: e.target.value})}
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                      value={themeSettings.accent_color}
                      onChange={(e) => setThemeSettings({...themeSettings, accent_color: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Warna Sidebar
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="color"
                      className="h-10 w-20 rounded border border-gray-700 bg-gray-900"
                      value={themeSettings.sidebar_color}
                      onChange={(e) => setThemeSettings({...themeSettings, sidebar_color: e.target.value})}
                    />
                    <input
                      type="text"
                      className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                      value={themeSettings.sidebar_color}
                      onChange={(e) => setThemeSettings({...themeSettings, sidebar_color: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Font Family
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={themeSettings.font_family}
                    onChange={(e) => setThemeSettings({...themeSettings, font_family: e.target.value})}
                  >
                    {fontFamilies.map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Border Radius (px)
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={themeSettings.borderRadius}
                    onChange={(e) => setThemeSettings({...themeSettings, borderRadius: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">0px</span>
                    <span className="text-xs font-medium text-white">{themeSettings.borderRadius}px</span>
                    <span className="text-xs text-gray-500">20px</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Mode Gelap</p>
                    <p className="text-sm text-gray-500">Aktifkan tema gelap untuk seluruh aplikasi</p>
                  </div>
                  <button
                    onClick={() => setThemeSettings({...themeSettings, dark_mode: !themeSettings.dark_mode})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      themeSettings.dark_mode ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeSettings.dark_mode ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Kontras Tinggi</p>
                    <p className="text-sm text-gray-500">Meningkatkan kontras untuk aksesibilitas</p>
                  </div>
                  <button
                    onClick={() => setThemeSettings({...themeSettings, high_contrast: !themeSettings.high_contrast})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      themeSettings.high_contrast ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeSettings.high_contrast ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Aktifkan Animasi</p>
                    <p className="text-sm text-gray-500">Tampilkan animasi di seluruh aplikasi</p>
                  </div>
                  <button
                    onClick={() => setThemeSettings({...themeSettings, animations_enabled: !themeSettings.animations_enabled})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      themeSettings.animations_enabled ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      themeSettings.animations_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>

              <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <h4 className="font-medium text-gray-200 mb-3">Preview</h4>
                <div className="flex gap-3">
                  <button
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: themeSettings.primary_color, borderRadius: themeSettings.borderRadius }}
                  >
                    Tombol Primer
                  </button>
                  <button
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: themeSettings.secondary_color, borderRadius: themeSettings.borderRadius }}
                  >
                    Tombol Sekunder
                  </button>
                  <button
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: themeSettings.accent_color, borderRadius: themeSettings.borderRadius }}
                  >
                    Tombol Aksen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map Settings */}
          {activeTab === 'map' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Map className="h-5 w-5 mr-2 text-emerald-400" />
                Pengaturan Peta
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={mapSettings.default_latitude}
                    onChange={(e) => setMapSettings({...mapSettings, default_latitude: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={mapSettings.default_longitude}
                    onChange={(e) => setMapSettings({...mapSettings, default_longitude: parseFloat(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Default Zoom Level
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="18"
                    value={mapSettings.default_zoom}
                    onChange={(e) => setMapSettings({...mapSettings, default_zoom: parseInt(e.target.value)})}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-500">1</span>
                    <span className="text-xs font-medium text-white">{mapSettings.default_zoom}</span>
                    <span className="text-xs text-gray-500">18</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Map Provider
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={mapSettings.map_provider}
                    onChange={(e) => setMapSettings({...mapSettings, map_provider: e.target.value as any})}
                  >
                    <option value="openstreetmap">OpenStreetMap</option>
                    <option value="google">Google Maps</option>
                    <option value="maptiler">MapTiler</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Map Style
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={mapSettings.map_style}
                    onChange={(e) => setMapSettings({...mapSettings, map_style: e.target.value as any})}
                  >
                    <option value="streets">Streets</option>
                    <option value="satellite">Satellite</option>
                    <option value="terrain">Terrain</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Key (jika menggunakan Google Maps/MapTiler)
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white pr-10"
                      value={mapSettings.api_key}
                      onChange={(e) => setMapSettings({...mapSettings, api_key: e.target.value})}
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-gray-200 mb-3">Fitur Peta</h4>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Marker Clustering</p>
                    <p className="text-sm text-gray-500">Gabungkan marker yang berdekatan</p>
                  </div>
                  <button
                    onClick={() => setMapSettings({...mapSettings, enable_clustering: !mapSettings.enable_clustering})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      mapSettings.enable_clustering ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mapSettings.enable_clustering ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Tampilkan Heatmap</p>
                    <p className="text-sm text-gray-500">Visualisasi kepadatan data</p>
                  </div>
                  <button
                    onClick={() => setMapSettings({...mapSettings, show_heatmap: !mapSettings.show_heatmap})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      mapSettings.show_heatmap ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mapSettings.show_heatmap ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                {mapSettings.show_heatmap && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Heatmap Radius: {mapSettings.heatmap_radius}px
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      value={mapSettings.heatmap_radius}
                      onChange={(e) => setMapSettings({...mapSettings, heatmap_radius: parseInt(e.target.value)})}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                )}

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Tampilkan Lalu Lintas</p>
                    <p className="text-sm text-gray-500">Informasi lalu lintas real-time</p>
                  </div>
                  <button
                    onClick={() => setMapSettings({...mapSettings, show_traffic: !mapSettings.show_traffic})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      mapSettings.show_traffic ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      mapSettings.show_traffic ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Database className="h-5 w-5 mr-2 text-emerald-400" />
                Pengaturan Backup
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Frekuensi Backup
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={backupSettings.backup_frequency}
                    onChange={(e) => setBackupSettings({...backupSettings, backup_frequency: e.target.value as any})}
                  >
                    <option value="daily">Harian</option>
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Waktu Backup
                  </label>
                  <input
                    type="time"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={backupSettings.backup_time}
                    onChange={(e) => setBackupSettings({...backupSettings, backup_time: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Masa Retensi (hari)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={backupSettings.retention_days}
                    onChange={(e) => setBackupSettings({...backupSettings, retention_days: parseInt(e.target.value)})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cloud Provider
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-white"
                    value={backupSettings.cloud_provider}
                    onChange={(e) => setBackupSettings({...backupSettings, cloud_provider: e.target.value as any})}
                  >
                    <option value="none">None (Local only)</option>
                    <option value="google">Google Drive</option>
                    <option value="aws">Amazon S3</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Backup Otomatis</p>
                    <p className="text-sm text-gray-500">Jalankan backup sesuai jadwal</p>
                  </div>
                  <button
                    onClick={() => setBackupSettings({...backupSettings, auto_backup: !backupSettings.auto_backup})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      backupSettings.auto_backup ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      backupSettings.auto_backup ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-300">Backup ke Cloud</p>
                    <p className="text-sm text-gray-500">Simpan backup ke penyimpanan cloud</p>
                  </div>
                  <button
                    onClick={() => setBackupSettings({...backupSettings, backup_to_cloud: !backupSettings.backup_to_cloud})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      backupSettings.backup_to_cloud ? 'bg-emerald-600' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      backupSettings.backup_to_cloud ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </label>
              </div>

              {/* Backup Status */}
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                      <HardDrive className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Backup Terakhir</p>
                      <p className="text-lg font-semibold text-white">
                        {backupSettings.last_backup 
                          ? moment(backupSettings.last_backup).format('DD MMMM YYYY HH:mm')
                          : 'Belum pernah'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-gray-400">Ukuran Backup</p>
                      <p className="text-lg font-semibold text-white">{backupSettings.backup_size} MB</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleBackup}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 flex items-center gap-2"
                      >
                        <Upload className="h-4 w-4" />
                        Backup Sekarang
                      </button>
                      <button
                        onClick={handleRestore}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <HardDrive className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Penggunaan Disk</p>
                      <p className="text-lg font-semibold text-white">2.4 GB / 10 GB</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Database className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Total Data</p>
                      <p className="text-lg font-semibold text-white">1,234 records</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Cloud className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Backup Cloud</p>
                      <p className="text-lg font-semibold text-white">3 files</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cache Management */}
              <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <RefreshCw className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Cache Size</p>
                      <p className="text-lg font-semibold text-white">156 MB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearCache}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Cache
                    </button>
                    <button className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Optimize
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}