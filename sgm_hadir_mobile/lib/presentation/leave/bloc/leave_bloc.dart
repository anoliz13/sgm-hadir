import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../data/datasources/leave_remote_datasource.dart';
import 'leave_event.dart';
import 'leave_state.dart';

class LeaveBloc extends Bloc<LeaveEvent, LeaveState> {
  final LeaveRemoteDataSource dataSource;

  LeaveBloc(this.dataSource) : super(LeaveInitial()) {
    on<FetchLeaves>((event, emit) async {
      emit(LeaveLoading());
      try {
        final leaves = await dataSource.getMyLeaveRequests();
        emit(LeaveLoaded(leaves));
      } catch (e) {
        emit(LeaveError(e.toString().replaceAll('Exception: ', '')));
      }
    });

    on<FetchLeaveTypes>((event, emit) async {
      emit(LeaveLoading());
      try {
        final types = await dataSource.getLeaveTypes();
        emit(LeaveTypesLoaded(types));
      } catch (e) {
        emit(LeaveError(e.toString().replaceAll('Exception: ', '')));
      }
    });

    on<SubmitLeave>((event, emit) async {
      emit(LeaveSubmitting());
      try {
        String? attachmentUrl;
        if (event.attachmentPath != null) {
          attachmentUrl = await dataSource.uploadAttachment(event.attachmentPath!);
        }

        final result = await dataSource.submitLeaveRequest(
          leaveTypeId: event.leaveTypeId,
          startDate: event.startDate,
          endDate: event.endDate,
          totalDays: event.totalDays,
          reason: event.reason,
          attachmentUrl: attachmentUrl,
        );

        emit(LeaveSubmitSuccess(result));
      } catch (e) {
        emit(LeaveError(e.toString().replaceAll('Exception: ', '')));
      }
    });

    on<EditLeave>((event, emit) async {
      emit(LeaveSubmitting());
      try {
        String? attachmentUrl = event.existingAttachmentUrl;
        if (event.attachmentPath != null) {
          attachmentUrl = await dataSource.uploadAttachment(event.attachmentPath!);
        }

        await dataSource.updateLeaveRequest(
          leaveId: event.leaveId,
          leaveTypeId: event.leaveTypeId,
          startDate: event.startDate,
          endDate: event.endDate,
          totalDays: event.totalDays,
          reason: event.reason,
          attachmentUrl: attachmentUrl,
        );

        emit(LeaveEditSuccess());
      } catch (e) {
        emit(LeaveError(e.toString().replaceAll('Exception: ', '')));
      }
    });
  }
}
