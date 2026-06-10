/// Branch model
class BranchModel {
  final String id;
  final String name;
  final String code;
  final String address;
  final double latitude;
  final double longitude;
  final int radiusMeters;
  final String timezone;
  final WorkSchedule workSchedule;
  final bool requireSelfie;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const BranchModel({
    required this.id,
    required this.name,
    required this.code,
    this.address = '',
    required this.latitude,
    required this.longitude,
    this.radiusMeters = 100,
    this.timezone = 'Asia/Jakarta',
    required this.workSchedule,
    this.requireSelfie = false,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BranchModel.fromMap(String id, Map<String, dynamic> map) {
    return BranchModel(
      id: id,
      name: map['name'] ?? '',
      code: map['code'] ?? '',
      address: map['address'] ?? '',
      latitude: (map['latitude'] ?? 0).toDouble(),
      longitude: (map['longitude'] ?? 0).toDouble(),
      radiusMeters: map['radiusMeters'] ?? 100,
      timezone: map['timezone'] ?? 'Asia/Jakarta',
      workSchedule: WorkSchedule.fromMap(map['workSchedule'] ?? {}),
      requireSelfie: map['requireSelfie'] ?? false,
      isActive: map['isActive'] ?? true,
      createdAt: (map['createdAt'] as dynamic)?.toDate() ?? DateTime.now(),
      updatedAt: (map['updatedAt'] as dynamic)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'name': name,
      'code': code,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'radiusMeters': radiusMeters,
      'timezone': timezone,
      'workSchedule': workSchedule.toMap(),
      'requireSelfie': requireSelfie,
      'isActive': isActive,
    };
  }
}

class WorkSchedule {
  final List<int> workDays;
  final String checkInTime;
  final String checkOutTime;
  final int lateToleranceMinutes;

  const WorkSchedule({
    this.workDays = const [1, 2, 3, 4, 5],
    this.checkInTime = '08:00',
    this.checkOutTime = '17:00',
    this.lateToleranceMinutes = 15,
  });

  factory WorkSchedule.fromMap(Map<String, dynamic> map) {
    return WorkSchedule(
      workDays: List<int>.from(map['workDays'] ?? [1, 2, 3, 4, 5]),
      checkInTime: map['checkInTime'] ?? '08:00',
      checkOutTime: map['checkOutTime'] ?? '17:00',
      lateToleranceMinutes: map['lateToleranceMinutes'] ?? 15,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'workDays': workDays,
      'checkInTime': checkInTime,
      'checkOutTime': checkOutTime,
      'lateToleranceMinutes': lateToleranceMinutes,
    };
  }
}
