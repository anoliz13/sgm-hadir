abstract class LeaveEvent {}

class FetchLeaves extends LeaveEvent {}

class FetchLeaveTypes extends LeaveEvent {}

class SubmitLeave extends LeaveEvent {
  final String leaveTypeId;
  final String startDate;
  final String endDate;
  final int totalDays;
  final String? reason;
  final String? attachmentPath;

  SubmitLeave({
    required this.leaveTypeId,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    this.reason,
    this.attachmentPath,
  });
}

class EditLeave extends LeaveEvent {
  final String leaveId;
  final String leaveTypeId;
  final String startDate;
  final String endDate;
  final int totalDays;
  final String? reason;
  final String? attachmentPath;
  final String? existingAttachmentUrl;

  EditLeave({
    required this.leaveId,
    required this.leaveTypeId,
    required this.startDate,
    required this.endDate,
    required this.totalDays,
    this.reason,
    this.attachmentPath,
    this.existingAttachmentUrl,
  });
}
