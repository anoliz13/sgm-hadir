abstract class OvertimeEvent {}

class LoadOvertimes extends OvertimeEvent {}

class SubmitOvertimeRequest extends OvertimeEvent {
  final String date;
  final String estimatedStart;
  final String estimatedEnd;
  final String reason;

  SubmitOvertimeRequest({
    required this.date,
    required this.estimatedStart,
    required this.estimatedEnd,
    required this.reason,
  });
}

class EditOvertimeRequest extends OvertimeEvent {
  final String overtimeId;
  final String date;
  final String estimatedStart;
  final String estimatedEnd;
  final String reason;

  EditOvertimeRequest({
    required this.overtimeId,
    required this.date,
    required this.estimatedStart,
    required this.estimatedEnd,
    required this.reason,
  });
}
