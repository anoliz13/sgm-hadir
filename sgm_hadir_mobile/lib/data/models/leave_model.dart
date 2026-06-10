class LeaveTypeModel {
  final String id;
  final String name;
  final bool requiresDocument;
  final bool deductsQuota;
  final int? maxDaysPerYear;

  LeaveTypeModel({
    required this.id,
    required this.name,
    required this.requiresDocument,
    required this.deductsQuota,
    this.maxDaysPerYear,
  });

  factory LeaveTypeModel.fromJson(Map<String, dynamic> json) {
    return LeaveTypeModel(
      id: json['ID'] ?? json['id'] ?? '',
      name: json['Name'] ?? json['name'] ?? '',
      requiresDocument: json['RequiresDocument'] ?? json['requires_document'] ?? false,
      deductsQuota: json['DeductsQuota'] ?? json['deducts_quota'] ?? true,
      maxDaysPerYear: json['MaxDaysPerYear'] ?? json['max_days_per_year'],
    );
  }
}

class LeaveRequestModel {
  final String id;
  final String leaveTypeId;
  final String leaveTypeName;
  final String startDate;
  final String endDate;
  final int totalDays;
  final String? reason;
  final String? attachmentUrl;
  final String status;
  final String? approverName;
  final String? approverNote;
  final String createdAt;

  LeaveRequestModel({
    required this.id,
    required this.leaveTypeId,
    required this.leaveTypeName,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    this.reason,
    this.attachmentUrl,
    required this.status,
    this.approverName,
    this.approverNote,
    required this.createdAt,
  });

  factory LeaveRequestModel.fromJson(Map<String, dynamic> json) {
    return LeaveRequestModel(
      id: json['id'] ?? '',
      leaveTypeId: json['leave_type_id'] ?? '',
      leaveTypeName: json['leave_type_name'] ?? '',
      startDate: json['start_date'] ?? '',
      endDate: json['end_date'] ?? '',
      totalDays: json['total_days'] ?? 0,
      reason: json['reason'],
      attachmentUrl: json['attachment_url'],
      status: json['status'] ?? 'pending',
      approverName: json['approver_name'],
      approverNote: json['approver_note'],
      createdAt: json['created_at'] ?? '',
    );
  }
}
