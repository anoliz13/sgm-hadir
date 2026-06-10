import 'package:shared_preferences/shared_preferences.dart';
import '../datasources/auth_remote_datasource.dart';

class AuthRepository {
  final AuthRemoteDataSource remoteDataSource;

  AuthRepository(this.remoteDataSource);

  Future<void> login(String identifier, String password) async {
    final tokens = await remoteDataSource.login(identifier, password);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', tokens['access_token']!);
    await prefs.setString('refresh_token', tokens['refresh_token']!);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token') != null;
  }

  Future<Map<String, dynamic>> getProfile() async {
    return await remoteDataSource.getProfile();
  }

  Future<void> updateProfile({String? name, String? phone, String? photoUrl}) async {
    await remoteDataSource.updateProfile(name: name, phone: phone, photoUrl: photoUrl);
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    await remoteDataSource.changePassword(currentPassword, newPassword);
  }

  Future<String> uploadProfilePhoto(String filePath) async {
    return await remoteDataSource.uploadProfilePhoto(filePath);
  }
}
