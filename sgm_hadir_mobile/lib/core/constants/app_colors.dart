import 'package:flutter/material.dart';

/// Warna utama SGM Hadir
class AppColors {
  AppColors._();

  // Brand Colors
  static const Color primary = Color(0xFF1E40AF);
  static const Color primaryLight = Color(0xFF3B82F6);
  static const Color primaryDark = Color(0xFF1E3A8A);
  static const Color accent = Color(0xFF10B981);
  static const Color accentLight = Color(0xFF34D399);
  static const Color accentDark = Color(0xFF059669);

  // Semantic Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color danger = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Attendance Status Colors
  static const Color statusHadir = Color(0xFF10B981);     // Hijau
  static const Color statusTerlambat = Color(0xFFF59E0B);  // Kuning
  static const Color statusAlpha = Color(0xFFEF4444);      // Merah
  static const Color statusIzin = Color(0xFF3B82F6);       // Biru
  static const Color statusLembur = Color(0xFF8B5CF6);     // Ungu
  static const Color statusLibur = Color(0xFF94A3B8);      // Abu

  // Neutral Light
  static const Color background = Color(0xFFF8FAFC);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color border = Color(0xFFE2E8F0);
  static const Color textPrimary = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);
  static const Color textMuted = Color(0xFF94A3B8);

  // Neutral Dark
  static const Color backgroundDark = Color(0xFF0F172A);
  static const Color surfaceDark = Color(0xFF1E293B);
  static const Color borderDark = Color(0xFF334155);
  static const Color textPrimaryDark = Color(0xFFF1F5F9);
  static const Color textSecondaryDark = Color(0xFF94A3B8);
  static const Color textMutedDark = Color(0xFF64748B);

  // Gradient
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [primaryDark, primary, primaryLight],
  );

  static const LinearGradient checkInGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [accent, accentLight],
  );
}
