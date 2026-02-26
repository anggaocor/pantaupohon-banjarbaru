"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/src/components/ui";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  Lock,
  LogOut,
  Shield,
  Calendar,
  Edit,
  X,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowLeft,
  Loader2,
  Key,
  Smartphone,
  Globe,
  Clock,
  Eye,
  EyeOff,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/id";

moment.locale('id');

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  role: 'admin' | 'petugas' | 'user';
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

interface SessionData {
  id: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
  is_current: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const [formData, setFormData] = useState({
    full_name: "",
    phone_number: "",
    address: ""
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: ""
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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
      await fetchProfile(session.user.id);
      await fetchSessions();
      setLoading(false);
    };

    checkSession();
  }, [router]);

  const fetchProfile = async (userId: string) => {
    try {
      const supabase = createClient();
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: user?.email || "",
            full_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User",
            role: "user",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        setProfile(newProfile);
        setFormData({
          full_name: newProfile.full_name || "",
          phone_number: newProfile.phone_number || "",
          address: newProfile.address || ""
        });
      } else {
        setProfile(existingProfile);
        setFormData({
          full_name: existingProfile.full_name || "",
          phone_number: existingProfile.phone_number || "",
          address: existingProfile.address || ""
        });
      }

    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast.error("Gagal memuat data profil");
    }
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const supabase = createClient();
      const mockSessions: SessionData[] = [
        {
          id: '1',
          user_agent: 'Chrome / Windows',
          ip_address: '192.168.1.1',
          created_at: new Date().toISOString(),
          is_current: true
        },
        {
          id: '2',
          user_agent: 'Safari / iPhone',
          ip_address: '192.168.1.2',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          is_current: false
        }
      ];
      setSessions(mockSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Nama lengkap wajib diisi";
    }

    if (formData.phone_number && !/^[0-9+\-\s()]{10,15}$/.test(formData.phone_number.replace(/\s/g, ''))) {
      newErrors.phone_number = "Format nomor telepon tidak valid";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.current_password) {
      newErrors.current_password = "Password saat ini wajib diisi";
    }

    if (!passwordData.new_password) {
      newErrors.new_password = "Password baru wajib diisi";
    } else if (passwordData.new_password.length < 8) {
      newErrors.new_password = "Password minimal 8 karakter";
    } else if (!/[A-Z]/.test(passwordData.new_password)) {
      newErrors.new_password = "Password harus mengandung huruf kapital";
    } else if (!/[0-9]/.test(passwordData.new_password)) {
      newErrors.new_password = "Password harus mengandung angka";
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      newErrors.confirm_password = "Konfirmasi password tidak cocok";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      toast.error("Format file harus JPG, PNG, atau WebP");
      return;
    }

    if (file.size > maxSize) {
      toast.error("Ukuran file maksimal 2MB");
      return;
    }

    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return;

    try {
      setUploadingAvatar(true);
      const supabase = createClient();

      if (profile?.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success("Foto profil berhasil diubah");
      setAvatarFile(null);
      setAvatarPreview("");
      await fetchProfile(user.id);

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error("Gagal mengupload foto profil");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast.error("Harap perbaiki kesalahan pada form");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone_number: formData.phone_number.trim() || null,
          address: formData.address.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success("Profil berhasil diperbarui");
      setIsEditing(false);
      await fetchProfile(user.id);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error("Harap periksa kembali password Anda");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.current_password
      });

      if (signInError) {
        toast.error("Password saat ini salah");
        setSaving(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) throw error;

      toast.success("Password berhasil diubah");
      setShowChangePassword(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });

    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error("Gagal mengubah password");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast.success("Berhasil logout");
      router.push('/login');
      router.refresh();

    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error("Gagal logout");
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      toast.info("Fitur akan segera tersedia");
    } catch (error) {
      console.error("Error logging out all devices:", error);
      toast.error("Gagal logout dari semua perangkat");
    }
  };

  const getRoleBadge = (role: string) => {
    const badges: Record<string, { text: string; className: string; icon: JSX.Element }> = {
      admin: { 
        text: 'Administrator', 
        className: 'bg-red-500/20 text-red-400 border-red-500/30',
        icon: <Shield className="h-3 w-3 mr-1" />
      },
      petugas: { 
        text: 'Petugas Lapangan', 
        className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        icon: <User className="h-3 w-3 mr-1" />
      },
      user: { 
        text: 'Pengguna', 
        className: 'bg-green-500/20 text-green-400 border-green-500/30',
        icon: <User className="h-3 w-3 mr-1" />
      }
    };

    return badges[role] || { 
      text: role, 
      className: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      icon: <User className="h-3 w-3 mr-1" />
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-gray-400">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-400">Profil tidak ditemukan</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-5xl mx-auto">
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
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gray-800 border border-gray-700 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/30 shadow-lg">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
                      <User className="h-12 w-12 text-white" />
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-emerald-600 text-white p-2 rounded-full cursor-pointer hover:bg-emerald-500 transition-colors shadow-lg">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  {profile.full_name}
                </h1>
                <p className="text-gray-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Mail className="h-4 w-4 text-emerald-400" />
                  {profile.email}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadge(profile.role).className}`}>
                    {getRoleBadge(profile.role).icon}
                    {getRoleBadge(profile.role).text}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm border border-gray-600">
                    <Calendar className="h-3 w-3 mr-1 text-emerald-400" />
                    Member sejak {moment(profile.created_at).format('MMM YYYY')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  isEditing
                    ? "bg-gray-700 text-white hover:bg-gray-600"
                    : "bg-emerald-600 text-white hover:bg-emerald-500"
                }`}
              >
                {isEditing ? (
                  <>
                    <X className="h-4 w-4" />
                    Batal Edit
                  </>
                ) : (
                  <>
                    <Edit className="h-4 w-4" />
                    Edit Profil
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info Card */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-emerald-400" />
                Informasi Kontak
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Nomor Telepon</p>
                    <p className="font-medium text-white">{profile.phone_number || "Belum diisi"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Alamat</p>
                    <p className="font-medium text-white">{profile.address || "Belum diisi"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Terakhir Update</p>
                    <p className="font-medium text-white">{moment(profile.updated_at).format('DD MMM YYYY')}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions Card */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h3 className="font-semibold text-gray-200 mb-4 flex items-center">
                <Key className="h-5 w-5 mr-2 text-emerald-400" />
                Tindakan Cepat
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full p-3 bg-yellow-500/10 text-yellow-400 rounded-lg hover:bg-yellow-500/20 flex items-center gap-3 transition-colors border border-yellow-500/30"
                >
                  <Lock className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Ubah Password</p>
                    <p className="text-xs text-gray-500">Perbarui password Anda</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full p-3 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 flex items-center gap-3 transition-colors border border-red-500/30"
                >
                  <LogOut className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Logout</p>
                    <p className="text-xs text-gray-500">Keluar dari aplikasi</p>
                  </div>
                </button>
              </div>
            </Card>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-6">
            {isEditing ? (
              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-xl font-semibold text-gray-200 mb-6 flex items-center">
                  <Edit className="h-5 w-5 mr-2 text-emerald-400" />
                  Edit Informasi Profil
                </h3>

                {avatarFile && (
                  <div className="mb-6 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-emerald-400">Foto Profil Baru</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview("");
                        }}
                        className="text-gray-400 hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500/30">
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {avatarFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(avatarFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={uploadAvatar}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {uploadingAvatar ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Upload...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <User className="inline h-4 w-4 mr-1 text-emerald-400" />
                      Nama Lengkap <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                        errors.full_name 
                          ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                          : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                      }`}
                      value={formData.full_name}
                      onChange={(e) => {
                        setFormData({ ...formData, full_name: e.target.value });
                        if (errors.full_name) setErrors({ ...errors, full_name: "" });
                      }}
                      placeholder="Masukkan nama lengkap"
                    />
                    {errors.full_name && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Mail className="inline h-4 w-4 mr-1 text-emerald-400" />
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-xl text-gray-400"
                      value={profile.email}
                      readOnly
                      disabled
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Email tidak dapat diubah
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Phone className="inline h-4 w-4 mr-1 text-emerald-400" />
                      Nomor Telepon
                    </label>
                    <input
                      type="tel"
                      className={`w-full px-4 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white placeholder-gray-500 ${
                        errors.phone_number 
                          ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                          : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                      }`}
                      value={formData.phone_number}
                      onChange={(e) => {
                        setFormData({ ...formData, phone_number: e.target.value });
                        if (errors.phone_number) setErrors({ ...errors, phone_number: "" });
                      }}
                      placeholder="Contoh: 081234567890"
                    />
                    {errors.phone_number && (
                      <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.phone_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1 text-emerald-400" />
                      Alamat
                    </label>
                    <textarea
                      rows={3}
                      className="w-full px-4 py-3 bg-gray-900 border-2 border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-white placeholder-gray-500"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Masukkan alamat lengkap"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      <Shield className="inline h-4 w-4 mr-1 text-emerald-400" />
                      Role / Peran
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                      <span className={`px-3 py-1 rounded-full text-sm ${getRoleBadge(profile.role).className}`}>
                        {getRoleBadge(profile.role).icon}
                        {getRoleBadge(profile.role).text}
                      </span>
                      <p className="text-sm text-gray-500">
                        Role menentukan akses Anda dalam sistem
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-gray-700">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            Simpan Perubahan
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setAvatarFile(null);
                          setAvatarPreview("");
                          setFormData({
                            full_name: profile.full_name || "",
                            phone_number: profile.phone_number || "",
                            address: profile.address || ""
                          });
                        }}
                        className="px-6 py-3 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 font-medium transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                </form>
              </Card>
            ) : (
              <Card className="p-6 bg-gray-800 border-gray-700">
                <h3 className="text-xl font-semibold text-gray-200 mb-6 flex items-center">
                  <User className="h-5 w-5 mr-2 text-emerald-400" />
                  Informasi Profil
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                      <p className="text-lg font-semibold text-white">{profile.full_name || "-"}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-emerald-400" />
                        <p className="text-white">{profile.email}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Nomor Telepon</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-emerald-400" />
                        <p className="text-white">{profile.phone_number || "-"}</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-500">Role</p>
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-emerald-400" />
                        <span className={`px-3 py-1 rounded-full text-sm ${getRoleBadge(profile.role).className}`}>
                          {getRoleBadge(profile.role).icon}
                          {getRoleBadge(profile.role).text}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Alamat</p>
                    <div className="flex items-start gap-2 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                      <MapPin className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-gray-300">{profile.address || "Belum ada alamat yang ditambahkan"}</p>
                    </div>
                  </div>

                  <div className="p-5 bg-gradient-to-br from-emerald-600/10 to-emerald-600/5 rounded-xl border border-emerald-500/30">
                    <h4 className="font-medium text-emerald-400 mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Informasi Akun
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-emerald-400/70">ID Pengguna</p>
                        <p className="font-mono text-xs bg-gray-900/50 px-2 py-1 rounded mt-1 text-gray-300">{profile.id}</p>
                      </div>
                      <div>
                        <p className="text-emerald-400/70">Dibuat Pada</p>
                        <p className="font-medium text-gray-300">{moment(profile.created_at).format('DD MMMM YYYY HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-emerald-400/70">Diperbarui Pada</p>
                        <p className="font-medium text-gray-300">{moment(profile.updated_at).format('DD MMMM YYYY HH:mm')}</p>
                      </div>
                      <div>
                        <p className="text-emerald-400/70">Status Akun</p>
                        <span className="inline-flex items-center px-3 py-1 text-xs bg-green-500/20 text-green-400 rounded-full">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aktif
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Change Password Modal */}
            {showChangePassword && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                <Card className="p-6 max-w-md w-full bg-gray-800 border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Ubah Password</h3>
                    <button
                      onClick={() => {
                        setShowChangePassword(false);
                        setPasswordData({
                          current_password: "",
                          new_password: "",
                          confirm_password: ""
                        });
                        setPasswordErrors({});
                      }}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password Saat Ini *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type={showPassword.current ? "text" : "password"}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                            passwordErrors.current_password 
                              ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                              : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                          }`}
                          value={passwordData.current_password}
                          onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                          placeholder="Masukkan password saat ini"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, current: !showPassword.current})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordErrors.current_password && (
                        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.current_password}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Password Baru *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type={showPassword.new ? "text" : "password"}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                            passwordErrors.new_password 
                              ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                              : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                          }`}
                          value={passwordData.new_password}
                          onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                          placeholder="Masukkan password baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordErrors.new_password && (
                        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.new_password}
                        </p>
                      )}
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Password harus:</p>
                        <ul className="list-disc list-inside">
                          <li className={passwordData.new_password.length >= 8 ? "text-green-400" : ""}>
                            Minimal 8 karakter
                          </li>
                          <li className={/[A-Z]/.test(passwordData.new_password) ? "text-green-400" : ""}>
                            Mengandung huruf kapital
                          </li>
                          <li className={/[0-9]/.test(passwordData.new_password) ? "text-green-400" : ""}>
                            Mengandung angka
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Konfirmasi Password Baru *
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
                        <input
                          type={showPassword.confirm ? "text" : "password"}
                          className={`w-full pl-10 pr-10 py-3 bg-gray-900 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all text-white ${
                            passwordErrors.confirm_password 
                              ? "border-red-500/50 focus:ring-red-500/30 focus:border-red-500" 
                              : "border-gray-700 focus:ring-emerald-500/30 focus:border-emerald-500"
                          }`}
                          value={passwordData.confirm_password}
                          onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                          placeholder="Konfirmasi password baru"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                        >
                          {showPassword.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      {passwordErrors.confirm_password && (
                        <p className="mt-2 text-sm text-red-400 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {passwordErrors.confirm_password}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Menyimpan...
                          </>
                        ) : (
                          <>
                            <Save className="h-5 w-5" />
                            Ubah Password
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowChangePassword(false);
                          setPasswordData({
                            current_password: "",
                            new_password: "",
                            confirm_password: ""
                          });
                          setPasswordErrors({});
                        }}
                        className="px-6 py-3 border-2 border-gray-700 text-gray-300 rounded-xl hover:bg-gray-700 font-medium transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </Card>
              </div>
            )}

            {/* Active Sessions */}
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-200 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2 text-emerald-400" />
                  Sesi Aktif
                </h3>
                <button
                  onClick={fetchSessions}
                  className="p-2 text-gray-400 hover:text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {loadingSessions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                </div>
              ) : (
                <div className="space-y-3">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 rounded-lg border ${
                        session.is_current
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-gray-700/50 border-gray-600'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Globe className={`h-5 w-5 ${
                            session.is_current ? 'text-emerald-400' : 'text-gray-500'
                          }`} />
                          <div>
                            <p className="font-medium text-white">
                              {session.user_agent}
                              {session.is_current && (
                                <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                                  Sesi Saat Ini
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500">
                              IP: {session.ip_address} • {moment(session.created_at).format('DD MMM YYYY HH:mm')}
                            </p>
                          </div>
                        </div>
                        {!session.is_current && (
                          <button
                            onClick={() => toast.info("Fitur logout sesi akan segera tersedia")}
                            className="text-xs text-red-400 hover:text-red-300 font-medium"
                          >
                            Logout
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleLogoutAllDevices}
                className="mt-4 w-full p-3 text-sm text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                Logout dari Semua Perangkat
              </button>
            </Card>

            {/* Security Tips */}
            <Card className="p-6 bg-gradient-to-br from-yellow-600/10 to-yellow-600/5 border border-yellow-500/30">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-400 mb-2">Tips Keamanan Akun</h4>
                  <ul className="text-sm text-gray-400 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5"></span>
                      <span>Gunakan password yang kuat dan unik, minimal 8 karakter dengan kombinasi huruf besar, kecil, dan angka</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5"></span>
                      <span>Jangan pernah membagikan password Anda kepada siapapun, termasuk petugas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5"></span>
                      <span>Selalu logout setelah menggunakan aplikasi, terutama di perangkat publik</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5"></span>
                      <span>Perbarui informasi kontak Anda secara berkala untuk keperluan verifikasi</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}