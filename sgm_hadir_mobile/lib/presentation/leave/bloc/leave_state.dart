import '../../../../data/models/leave_model.dart';

abstract class LeaveState {}

class LeaveInitial extends LeaveState {}

class LeaveLoading extends LeaveState {}

class LeaveSubmitting extends LeaveState {}

class LeaveLoaded extends LeaveState {
  final List<LeaveRequestModel> leaves;
  LeaveLoaded(this.leaves);
}

class LeaveTypesLoaded extends LeaveState {
  final List<LeaveTypeModel> types;
  LeaveTypesLoaded(this.types);
}

class LeaveSubmitSuccess extends LeaveState {
  final LeaveRequestModel leave;
  LeaveSubmitSuccess(this.leave);
}

class LeaveEditSuccess extends LeaveState {}

class LeaveError extends LeaveState {
  final String message;
  LeaveError(this.message);
}
