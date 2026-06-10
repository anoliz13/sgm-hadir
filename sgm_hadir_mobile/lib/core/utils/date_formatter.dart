/// Date formatting utilities
/// All timestamps stored UTC, displayed WIB (UTC+7)
class DateFormatter {
  DateFormatter._();

  static const int _wibOffsetHours = 7;

  /// Convert UTC DateTime to WIB
  static DateTime toWib(DateTime utcDate) {
    return utcDate.add(const Duration(hours: _wibOffsetHours));
  }

  /// Format DateTime ke "HH:MM WIB"
  static String formatTimeWib(DateTime utcDate) {
    final wib = toWib(utcDate);
    return '${wib.hour.toString().padLeft(2, '0')}:${wib.minute.toString().padLeft(2, '0')} WIB';
  }

  /// Format DateTime ke "DD MMM YYYY"
  static String formatDateShort(DateTime date) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  /// Format DateTime ke "DD MMMM YYYY"
  static String formatDateLong(DateTime date) {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return '${date.day} ${months[date.month - 1]} ${date.year}';
  }

  /// Format to "YYYY-MM-DD"
  static String toDateString(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Get greeting based on WIB time
  static String getGreeting() {
    final hour = toWib(DateTime.now().toUtc()).hour;
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  /// Format relative time (e.g., "5 menit lalu", "Hari ini")
  static String formatRelative(DateTime utcDate) {
    final now = DateTime.now().toUtc();
    final diff = now.difference(utcDate);

    if (diff.inMinutes < 1) return 'Baru saja';
    if (diff.inMinutes < 60) return '${diff.inMinutes} menit lalu';
    if (diff.inHours < 24) return '${diff.inHours} jam lalu';
    if (diff.inDays < 2) return 'Kemarin';
    if (diff.inDays < 7) return '${diff.inDays} hari lalu';
    return formatDateShort(toWib(utcDate));
  }
}
