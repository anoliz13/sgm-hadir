/// Attendance model for check-in/check-out records
class AttendanceModel {
  final String id;
  final String userId;
  final String userNik;
  final String userName;
  final String branchId;
  final String branchName;
  final String date;
  final String type; // CHECK_IN, CHECK_OUT
  final DateTime timestamp;
  final double latitude;
  final double longitude;
  final double gpsAccuracyMeters;
  final String? selfieUrl;
  final String status; // TEPAT_WAKTU, TERLAMBAT, SETENGAH_HARI, PULANG_AWAL
  final int lateMinutes;
  final bool isServerValidated;
  final bool isManualEntry;
  final String? manualEntryBy;
  final String? manualEntryReason;
  final DateTime createdAt;

  const AttendanceModel({
    required this.id,
    required this.userId,
    required this.userNik,
    required this.userName,
    required this.branchId,
    required this.branchName,
    required this.date,
    required this.type,
    required this.timestamp,
    required this.latitude,
    required this.longitude,
    this.gpsAccuracyMeters = 0,
    this.selfieUrl,
    required this.status,
    this.lateMinutes = 0,
    this.isServerValidated = false,
    this.isManualEntry = false,
    this.manualEntryBy,
    this.manualEntryReason,
    required this.createdAt,
  });

  bool get isCheckIn => type == 'CHECK_IN';
  bool get isCheckOut => type == 'CHECK_OUT';
  bool get isOnTime => status == 'TEPAT_WAKTU';
  bool get isLate => status == 'TERLAMBAT' || status == 'SETENGAH_HARI';

  String get statusLabel {
    switch (status) {
      case 'TEPAT_WAKTU':
        return 'Tepat Waktu';
      case 'TERLAMBAT':
        return 'Terlambat';
      case 'SETENGAH_HARI':
        return 'Setengah Hari';
      case 'PULANG_AWAL':
        return 'Pulang Awal';
      default:
        return status;
    }
  }

  factory AttendanceModel.fromMap(String id, Map<String, dynamic> map) {
    return AttendanceModel(
      id: id,
      userId: map['userId'] ?? '',
      userNik: map['userNik'] ?? '',
      userName: map['userName'] ?? '',
      branchId: map['branchId'] ?? '',
      branchName: map['branchName'] ?? '',
      date: map['date'] ?? '',
      type: map['type'] ?? '',
      timestamp: (map['timestamp'] as dynamic)?.toDate() ?? DateTime.now(),
      latitude: (map['latitude'] ?? 0).toDouble(),
      longitude: (map['longitude'] ?? 0).toDouble(),
      gpsAccuracyMeters: (map['gpsAccuracyMeters'] ?? 0).toDouble(),
      selfieUrl: map['selfieUrl'],
      status: map['status'] ?? '',
      lateMinutes: map['lateMinutes'] ?? 0,
      isServerValidated: map['isServerValidated'] ?? false,
      isManualEntry: map['isManualEntry'] ?? false,
      manualEntryBy: map['manualEntryBy'],
      manualEntryReason: map['manualEntryReason'],
      createdAt: (map['createdAt'] as dynamic)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'userNik': userNik,
      'userName': userName,
      'branchId': branchId,
      'branchName': branchName,
      'date': date,
      'type': type,
      'latitude': latitude,
      'longitude': longitude,
      'gpsAccuracyMeters': gpsAccuracyMeters,
      'selfieUrl': selfieUrl,
      'status': status,
      'lateMinutes': lateMinutes,
      'isServerValidated': isServerValidated,
      'isManualEntry': isManualEntry,
      'manualEntryBy': manualEntryBy,
      'manualEntryReason': manualEntryReason,
    };
  }
}
