import 'package:equatable/equatable.dart';

abstract class AttendanceEvent extends Equatable {
  const AttendanceEvent();

  @override
  List<Object> get props => [];
}

class SubmitCheckIn extends AttendanceEvent {
  final double latitude;
  final double longitude;
  final String imagePath;
  final String? type;
  final String? notes;

  const SubmitCheckIn({
    required this.latitude,
    required this.longitude,
    required this.imagePath,
    this.type,
    this.notes,
  });

  @override
  List<Object> get props => [latitude, longitude, imagePath, type ?? '', notes ?? ''];
}

class SubmitCheckOut extends AttendanceEvent {
  final double latitude;
  final double longitude;
  final String? type;
  final String? notes;

  const SubmitCheckOut({
    required this.latitude,
    required this.longitude,
    this.type,
    this.notes,
  });

  @override
  List<Object> get props => [latitude, longitude, type ?? '', notes ?? ''];
}

class FetchTodayStatus extends AttendanceEvent {}

class FetchMyHistory extends AttendanceEvent {}
