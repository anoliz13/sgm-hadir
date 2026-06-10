import 'dart:math';

/// GPS utility functions
class LocationUtils {
  LocationUtils._();

  /// Haversine formula - menghitung jarak antara 2 koordinat GPS dalam meter
  static double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadius = 6371e3; // meter
    final double phi1 = lat1 * pi / 180;
    final double phi2 = lat2 * pi / 180;
    final double deltaPhi = (lat2 - lat1) * pi / 180;
    final double deltaLambda = (lon2 - lon1) * pi / 180;

    final double a = sin(deltaPhi / 2) * sin(deltaPhi / 2) +
        cos(phi1) * cos(phi2) * sin(deltaLambda / 2) * sin(deltaLambda / 2);

    final double c = 2 * atan2(sqrt(a), sqrt(1 - a));

    return earthRadius * c;
  }

  /// Cek apakah dalam radius geofence
  static bool isWithinRadius(
    double userLat,
    double userLon,
    double centerLat,
    double centerLon,
    double radiusMeters,
  ) {
    final distance = calculateDistance(userLat, userLon, centerLat, centerLon);
    return distance <= radiusMeters;
  }

  /// Format jarak ke string (misal: "150 m" atau "1.2 km")
  static String formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.round()} m';
    }
    return '${(meters / 1000).toStringAsFixed(1)} km';
  }
}
