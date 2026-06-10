/// User model for employee data
class UserModel {
  final String id;
  final String nik;
  final String name;
  final String email;
  final String phone;
  final String photoUrl;
  final String position;
  final String division;
  final String branchId;
  final String role;
  final List<String> supervisorBranchIds;
  final DateTime joinDate;
  final int annualLeaveQuota;
  final int annualLeaveUsed;
  final List<String> fcmTokens;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  const UserModel({
    required this.id,
    required this.nik,
    required this.name,
    required this.email,
    this.phone = '',
    this.photoUrl = '',
    this.position = '',
    this.division = '',
    required this.branchId,
    required this.role,
    this.supervisorBranchIds = const [],
    required this.joinDate,
    this.annualLeaveQuota = 7,
    this.annualLeaveUsed = 0,
    this.fcmTokens = const [],
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  int get annualLeaveRemaining => annualLeaveQuota - annualLeaveUsed;

  bool get isSuperAdmin => role == 'SUPER_ADMIN';
  bool get isSupervisor => role == 'SUPERVISOR';
  bool get isKaryawan => role == 'KARYAWAN';

  factory UserModel.fromMap(String id, Map<String, dynamic> map) {
    return UserModel(
      id: id,
      nik: map['nik'] ?? '',
      name: map['name'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      photoUrl: map['photoUrl'] ?? '',
      position: map['position'] ?? '',
      division: map['division'] ?? '',
      branchId: map['branchId'] ?? '',
      role: map['role'] ?? 'KARYAWAN',
      supervisorBranchIds: List<String>.from(map['supervisorBranchIds'] ?? []),
      joinDate: (map['joinDate'] as dynamic)?.toDate() ?? DateTime.now(),
      annualLeaveQuota: map['annualLeaveQuota'] ?? 7,
      annualLeaveUsed: map['annualLeaveUsed'] ?? 0,
      fcmTokens: List<String>.from(map['fcmTokens'] ?? []),
      isActive: map['isActive'] ?? true,
      createdAt: (map['createdAt'] as dynamic)?.toDate() ?? DateTime.now(),
      updatedAt: (map['updatedAt'] as dynamic)?.toDate() ?? DateTime.now(),
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'nik': nik,
      'name': name,
      'email': email,
      'phone': phone,
      'photoUrl': photoUrl,
      'position': position,
      'division': division,
      'branchId': branchId,
      'role': role,
      'supervisorBranchIds': supervisorBranchIds,
      'annualLeaveQuota': annualLeaveQuota,
      'annualLeaveUsed': annualLeaveUsed,
      'fcmTokens': fcmTokens,
      'isActive': isActive,
    };
  }
}
