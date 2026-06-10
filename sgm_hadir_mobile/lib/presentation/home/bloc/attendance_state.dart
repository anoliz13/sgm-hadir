import 'package:equatable/equatable.dart';

abstract class AttendanceState extends Equatable {
  const AttendanceState();

  @override
  List<Object> get props => [];
}

class AttendanceInitial extends AttendanceState {}

class AttendanceLoading extends AttendanceState {}

class AttendanceSuccess extends AttendanceState {
  final Map<String, dynamic> data;
  final bool isCheckIn;

  const AttendanceSuccess(this.data, {this.isCheckIn = true});

  @override
  List<Object> get props => [data, isCheckIn];
}

class AttendanceError extends AttendanceState {
  final String message;

  const AttendanceError(this.message);

  @override
  List<Object> get props => [message];
}

class AttendanceStatusLoaded extends AttendanceState {
  final Map<String, dynamic> statusData;

  const AttendanceStatusLoaded(this.statusData);

  @override
  List<Object> get props => [statusData];
}

class AttendanceHistoryLoaded extends AttendanceState {
  final List<dynamic> history;

  const AttendanceHistoryLoaded(this.history);

  @override
  List<Object> get props => [history];
}
