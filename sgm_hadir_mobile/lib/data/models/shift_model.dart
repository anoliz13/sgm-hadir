class ShiftModel {
  final String id;
  final String name;
  final String startTime;
  final String endTime;
  final bool isActive;

  const ShiftModel({
    required this.id,
    required this.name,
    required this.startTime,
    required this.endTime,
    required this.isActive,
  });

  factory ShiftModel.fromJson(Map<String, dynamic> json) {
    return ShiftModel(
      id: json['id'] as String,
      name: json['name'] as String,
      startTime: json['start_time'] as String,
      endTime: json['end_time'] as String,
      isActive: json['is_active'] as bool? ?? true,
    );
  }
}
