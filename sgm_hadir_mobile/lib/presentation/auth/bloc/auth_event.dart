import 'package:equatable/equatable.dart';

abstract class AuthEvent extends Equatable {
  const AuthEvent();

  @override
  List<Object> get props => [];
}

class LoginSubmitted extends AuthEvent {
  final String nik;
  final String password;

  const LoginSubmitted(this.nik, this.password);

  @override
  List<Object> get props => [nik, password];
}
