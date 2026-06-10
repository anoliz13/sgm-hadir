class OvertimeModel {
  final String id;
  final String date;
  final String estimatedStart;
  final String estimatedEnd;
  final String? actualStart;
  final String? actualEnd;
  final double? actualHours;
  final String? reason;
  final String status;
  final String? approverName;
  final String? approverNote;

  OvertimeModel({
    required this.id,
    required this.date,
    required this.estimatedStart,
    required this.estimatedEnd,
    this.actualStart,
    this.actualEnd,
    this.actualHours,
    this.reason,
    required this.status,
    this.approverName,
    this.approverNote,
  });

  factory OvertimeModel.fromJson(Map<String, dynamic> json) {
    return OvertimeModel(
      id: json['id'] ?? '',
      date: json['date'] ?? '',
      estimatedStart: json['estimated_start'] ?? '',
      estimatedEnd: json['estimated_end'] ?? '',
      actualStart: json['actual_start'],
      actualEnd: json['actual_end'],
      actualHours: json['actual_hours'] != null ? (json['actual_hours'] as num).toDouble() : null,
      reason: json['reason'],
      status: json['status'] ?? 'pending',
      approverName: json['approver_name'],
      approverNote: json['approver_note'],
    );
  }
}
