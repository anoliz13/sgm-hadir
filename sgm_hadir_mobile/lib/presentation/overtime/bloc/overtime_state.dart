import '../../../data/models/overtime_model.dart';

abstract class OvertimeState {}

class OvertimeInitial extends OvertimeState {}

class OvertimeLoading extends OvertimeState {}

class OvertimeLoaded extends OvertimeState {
  final List<OvertimeModel> overtimes;
  OvertimeLoaded(this.overtimes);
}

class OvertimeError extends OvertimeState {
  final String message;
  OvertimeError(this.message);
}

class OvertimeSubmitLoading extends OvertimeState {}

class OvertimeSubmitSuccess extends OvertimeState {
  final String message;
  OvertimeSubmitSuccess(this.message);
}

class OvertimeSubmitError extends OvertimeState {
  final String message;
  OvertimeSubmitError(this.message);
}

class OvertimeEditSuccess extends OvertimeState {
  final String message;
  OvertimeEditSuccess(this.message);
}

class OvertimeEditError extends OvertimeState {
  final String message;
  OvertimeEditError(this.message);
}
