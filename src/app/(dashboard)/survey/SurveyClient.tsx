"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";
import { toast } from "sonner";
import { Card } from "@/src/components/ui";
import {
  Camera,
  Upload,
  FileText,
  Calendar,
  AlertCircle,
  Download,
  Search,
  RefreshCw,
  ChevronRight,
  TreePine,
  ArrowLeft,
  Edit,
  Save,
  Ruler,
  Weight,
  Activity,
  ThermometerSun,
  ClipboardList,
  User,
  Loader2,
  Info,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import moment from "moment";
import "moment/locale/id";

moment.locale("id");

// ⚠️ Semua interface kamu tetap sama (tidak saya potong)
// Paste semua interface SurveyData, PermohonanData, SurveyPhoto di sini

// ⚠️ Lalu paste SELURUH isi function SurveyPage kamu,
// tapi ganti namanya menjadi SurveyClient

export default function SurveyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permohonanId = searchParams.get("permohonan");

  // ⬇️ PASTE SEMUA STATE, useEffect, function, dan JSX RETURN
  // dari file lama kamu DI SINI tanpa diubah

}