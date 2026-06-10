import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // Untuk Web gunakan localhost, untuk Android emulator gunakan 10.0.2.2
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:8080/api/v1';
    }
    return 'http://10.0.2.2:8080/api/v1';
  }

  // Auth endpoints
  static const String login = '/auth/login';

  // Branch endpoints
  static const String branches = '/admin/branches';

  // Attendance endpoints
  static const String checkIn = '/attendance/check-in';
  static const String checkOut = '/attendance/check-out';
}
