import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../data/repositories/attendance_repository.dart';
import 'attendance_event.dart';
import 'attendance_state.dart';

class AttendanceBloc extends Bloc<AttendanceEvent, AttendanceState> {
  final AttendanceRepository repository;

  AttendanceBloc(this.repository) : super(AttendanceInitial()) {
    on<SubmitCheckIn>(_onSubmitCheckIn);
    on<SubmitCheckOut>(_onSubmitCheckOut);
    on<FetchTodayStatus>(_onFetchTodayStatus);
    on<FetchMyHistory>(_onFetchMyHistory);
  }

  Future<void> _onFetchMyHistory(
      FetchMyHistory event, Emitter<AttendanceState> emit) async {
    emit(AttendanceLoading());
    try {
      final history = await repository.getMyHistory();
      emit(AttendanceHistoryLoaded(history));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onFetchTodayStatus(
      FetchTodayStatus event, Emitter<AttendanceState> emit) async {
    emit(AttendanceLoading());
    try {
      final statusData = await repository.getTodayStatus();
      emit(AttendanceStatusLoaded(statusData));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSubmitCheckIn(
      SubmitCheckIn event, Emitter<AttendanceState> emit) async {
    emit(AttendanceLoading());
    try {
      final selfieUrl = await repository.uploadSelfie(event.imagePath);
      await repository.checkIn(
          event.latitude, event.longitude, selfieUrl, type: event.type, notes: event.notes);
      emit(const AttendanceSuccess({}, isCheckIn: true));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }

  Future<void> _onSubmitCheckOut(
      SubmitCheckOut event, Emitter<AttendanceState> emit) async {
    emit(AttendanceLoading());
    try {
      await repository.checkOut(event.latitude, event.longitude, type: event.type, notes: event.notes);
      emit(const AttendanceSuccess({}, isCheckIn: false));
    } catch (e) {
      emit(AttendanceError(e.toString().replaceAll('Exception: ', '')));
    }
  }
}
