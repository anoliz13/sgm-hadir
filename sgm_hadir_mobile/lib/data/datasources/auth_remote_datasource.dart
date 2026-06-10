import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class AuthRemoteDataSource {
  final DioClient dioClient;

  AuthRemoteDataSource(this.dioClient);

  /// Login menggunakan NIK atau Email + Password
  /// Mengembalikan Map berisi access_token dan refresh_token
  Future<Map<String, String>> login(String identifier, String password) async {
    try {
      final response = await dioClient.dio.post(
        ApiConstants.login,
        data: {
          'identifier': identifier,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        return {
          'access_token': data['access_token'] as String,
          'refresh_token': data['refresh_token'] as String,
        };
      } else {
        throw Exception(response.data['message'] ?? 'Login gagal');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Login failed');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<Map<String, dynamic>> getProfile() async {
    try {
      final response = await dioClient.dio.get('/users/me');
      if (response.statusCode == 200) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil profil');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil profil');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<void> updateProfile({String? name, String? phone, String? photoUrl}) async {
    try {
      final data = <String, dynamic>{};
      if (name != null && name.isNotEmpty) data['name'] = name;
      if (phone != null && phone.isNotEmpty) data['phone'] = phone;
      if (photoUrl != null && photoUrl.isNotEmpty) data['photo_url'] = photoUrl;

      final response = await dioClient.dio.put('/profile', data: data);
      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Gagal memperbarui profil');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal memperbarui profil');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<void> changePassword(String currentPassword, String newPassword) async {
    try {
      final response = await dioClient.dio.post('/profile/change-password', data: {
        'current_password': currentPassword,
        'new_password': newPassword,
      });
      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Gagal mengubah password');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengubah password');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<String> uploadProfilePhoto(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });
      final response = await dioClient.dio.post('/upload', data: formData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data']['url'];
      } else {
        throw Exception('Gagal mengunggah foto');
      }
    } on DioException catch (e) {
      throw Exception('Gagal mengunggah foto: ${e.message}');
    }
  }
}
