import 'package:flutter_bloc/flutter_bloc.dart';
import 'overtime_event.dart';
import 'overtime_state.dart';
import '../../../data/datasources/overtime_remote_datasource.dart';

class OvertimeBloc extends Bloc<OvertimeEvent, OvertimeState> {
  final OvertimeRemoteDataSource dataSource;

  OvertimeBloc({required this.dataSource}) : super(OvertimeInitial()) {
    on<LoadOvertimes>(_onLoadOvertimes);
    on<SubmitOvertimeRequest>(_onSubmitOvertimeRequest);
    on<EditOvertimeRequest>(_onEditOvertimeRequest);
  }

  Future<void> _onLoadOvertimes(LoadOvertimes event, Emitter<OvertimeState> emit) async {
    emit(OvertimeLoading());
    try {
      final overtimes = await dataSource.getMyOvertimes();
      emit(OvertimeLoaded(overtimes));
    } catch (e) {
      emit(OvertimeError(e.toString()));
    }
  }

  Future<void> _onSubmitOvertimeRequest(SubmitOvertimeRequest event, Emitter<OvertimeState> emit) async {
    emit(OvertimeSubmitLoading());
    try {
      await dataSource.createOvertime(
        date: event.date,
        estimatedStart: event.estimatedStart,
        estimatedEnd: event.estimatedEnd,
        reason: event.reason,
      );
      emit(OvertimeSubmitSuccess('Berhasil mengajukan lembur'));
    } catch (e) {
      emit(OvertimeSubmitError(e.toString()));
    }
  }

  Future<void> _onEditOvertimeRequest(EditOvertimeRequest event, Emitter<OvertimeState> emit) async {
    emit(OvertimeSubmitLoading());
    try {
      await dataSource.updateOvertime(
        overtimeId: event.overtimeId,
        date: event.date,
        estimatedStart: event.estimatedStart,
        estimatedEnd: event.estimatedEnd,
        reason: event.reason,
      );
      emit(OvertimeEditSuccess('Pengajuan lembur berhasil diperbarui'));
    } catch (e) {
      emit(OvertimeEditError(e.toString()));
    }
  }
}
