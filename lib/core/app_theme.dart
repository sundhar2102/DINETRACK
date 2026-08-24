import 'package:flutter/material.dart';

/// Centralized Design System for DineTrack
/// Harmonized with Web Application design tokens (tailwind.config.js & index.css)
class AppTheme {
  // Brand Primary & Secondary Palette
  static const Color brand500 = Color(0xFFF97316); // #F97316 - Primary vibrant brand orange
  static const Color brand600 = Color(0xFFEA580C); // #EA580C - Dark vibrant orange
  static const Color brand400 = Color(0xFFFB923C); // #FB923C - Light vibrant orange
  static const Color brand50 = Color(0xFFFFF7ED);
  static const Color brand100 = Color(0xFFFFEDD5);

  // Partner / Accent Red
  static const Color brandAccent = Color(0xFFC81E1E); // #C81E1E - Partner portal & key accent red
  static const Color brandAccentHover = Color(0xFF991B1B); // #991B1B

  // Dark Surface System (.dp-card, .dp-panel)
  static const Color darkBg = Color(0xFF0B0F19);      // #0B0F19 - Main Page & Scaffold Background
  static const Color darkSurface = Color(0xFF111827); // #111827 - Navbar / Header / BottomNav Surface
  static const Color darkCard = Color(0xFF161F30);    // #161F30 - Modern Sleek Dark Card Background (.dp-card)
  static const Color darkCardHover = Color(0xFF1E293B);// #1E293B
  static const Color darkInput = Color(0xFF0F172A);   // #0F172A - Input & Text Area Fill (.dp-input)
  static const Color darkBorder = Color(0xFF1F293D);  // #1F293D - Card & Container Border
  static const Color darkBorderSubtle = Color(0xFF334155); // #334155 - Dividers & Focused Borders

  // Status & Semantic Colors (Matched with Web Badges)
  static const Color emerald = Color(0xFF10B981); // #10B981 - Available / Confirmed / Veg
  static const Color amber = Color(0xFFF59E0B);   // #F59E0B - Pending / Reserved / Warning
  static const Color red = Color(0xFFEF4444);     // #EF4444 - Occupied / Cancelled / Rejected / Non-Veg
  static const Color blue = Color(0xFF38BDF8);    // #38BDF8 - Seated / Completed / Info
  static const Color purple = Color(0xFFA855F7);  // #A855F7 - Waitlist Queue / VIP

  // Text Colors
  static const Color textPrimary = Color(0xFFFFFFFF);
  static const Color textSecondary = Color(0xFF94A3B8); // Slate-400
  static const Color textMuted = Color(0xFF64748B);     // Slate-500

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [brand500, brand600],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient brandGradient = primaryGradient;

  static const LinearGradient brandGlowGradient = LinearGradient(
    colors: [Color(0xFFFF7A18), Color(0xFFE55F00)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [brandAccent, Color(0xFFA11414)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Shadows
  static const List<BoxShadow> glowShadow = [
    BoxShadow(
      color: Color(0x66F97316),
      blurRadius: 24,
      offset: Offset(0, 6),
    ),
  ];

  static const List<BoxShadow> cardShadow = [
    BoxShadow(
      color: Color(0x4D000000),
      blurRadius: 16,
      offset: Offset(0, 4),
    ),
  ];

  // Typography Tokens
  static const TextStyle displayLarge = TextStyle(
    color: textPrimary,
    fontSize: 28,
    fontWeight: FontWeight.w900,
    letterSpacing: -0.5,
  );

  static const TextStyle headlineMedium = TextStyle(
    color: textPrimary,
    fontSize: 20,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.3,
  );

  static const TextStyle titleMedium = TextStyle(
    color: textPrimary,
    fontSize: 16,
    fontWeight: FontWeight.w700,
  );

  static const TextStyle bodyMedium = TextStyle(
    color: textSecondary,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.4,
  );

  static const TextStyle bodySmall = TextStyle(
    color: textMuted,
    fontSize: 12,
    fontWeight: FontWeight.w400,
  );

  static const TextStyle labelSmall = TextStyle(
    color: textSecondary,
    fontSize: 11,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.5,
  );

  // Common Card Box Decoration Helper (.dp-card)
  static BoxDecoration cardDecoration({
    BorderRadius? borderRadius,
    Color? borderColor,
    Color? backgroundColor,
  }) {
    return BoxDecoration(
      color: backgroundColor ?? darkCard,
      borderRadius: borderRadius ?? BorderRadius.circular(20),
      border: Border.all(color: borderColor ?? darkBorder, width: 1),
      boxShadow: cardShadow,
    );
  }

  // Common Input Decoration Helper (.dp-input)
  static InputDecoration inputDecoration({
    String? hintText,
    String? labelText,
    IconData? prefixIcon,
    Widget? suffixIcon,
  }) {
    return InputDecoration(
      hintText: hintText,
      labelText: labelText,
      hintStyle: const TextStyle(color: textMuted, fontSize: 13),
      labelStyle: const TextStyle(color: textSecondary, fontSize: 13),
      prefixIcon: prefixIcon != null ? Icon(prefixIcon, color: textSecondary, size: 20) : null,
      suffixIcon: suffixIcon,
      filled: true,
      fillColor: darkInput,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: brand500, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: red),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: red, width: 1.5),
      ),
    );
  }

  // Theme Data Builder
  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: darkBg,
      primaryColor: brand500,
      fontFamily: 'Roboto',
      colorScheme: const ColorScheme.dark(
        primary: brand500,
        secondary: brand400,
        surface: darkSurface,
        error: red,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: darkSurface,
        elevation: 0,
        centerTitle: true,
        titleTextStyle: TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -0.3,
        ),
        iconTheme: IconThemeData(color: Colors.white),
      ),
      cardTheme: CardThemeData(
        color: darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: darkCard,
        elevation: 16,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: darkBorder, width: 1),
        ),
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        contentTextStyle: const TextStyle(
          color: textSecondary,
          fontSize: 14,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: darkSurface,
        modalBackgroundColor: darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: darkSurface,
        selectedItemColor: brand500,
        unselectedItemColor: textMuted,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        selectedLabelStyle: TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: TextStyle(fontWeight: FontWeight.w500, fontSize: 11),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: darkInput,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: brand500, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: red),
        ),
        hintStyle: const TextStyle(color: textMuted, fontSize: 13),
        labelStyle: const TextStyle(color: textSecondary, fontSize: 13),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brand500,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w700,
            letterSpacing: 0.3,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: Colors.white,
          side: const BorderSide(color: darkBorder),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      useMaterial3: true,
    );
  }
}
