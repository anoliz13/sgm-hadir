import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeCubit extends ValueNotifier<ThemeMode> {
  ThemeCubit() : super(ThemeMode.light);

  static const _key = 'theme_mode';

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final mode = prefs.getString(_key) ?? 'light';
    value = mode == 'dark' ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }

  Future<void> toggle() async {
    value = value == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_key, value == ThemeMode.dark ? 'dark' : 'light');
  }
}
