import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class AttendanceRemoteDataSource {
  final DioClient dioClient;

  AttendanceRemoteDataSource(this.dioClient);

  Future<String> uploadSelfie(String filePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(filePath),
      });

      final response = await dioClient.dio.post(
        '/upload',
        data: formData,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data']['url'];
      } else {
        throw Exception('Gagal mengunggah foto');
      }
    } on DioException catch (e) {
      throw Exception('Gagal mengunggah foto: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> checkIn(
      double latitude, double longitude, String selfieUrl, {String? type, String? notes}) async {
    try {
      final response = await dioClient.dio.post(
        ApiConstants.checkIn,
        data: {
          'latitude': latitude,
          'longitude': longitude,
          'selfie_url': selfieUrl,
          if (type != null) 'type': type,
          if (notes != null) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['message'] ?? 'Gagal melakukan check-in');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal melakukan check-in');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<Map<String, dynamic>> checkOut(
      double latitude, double longitude, {String? type, String? notes}) async {
    try {
      final response = await dioClient.dio.post(
        ApiConstants.checkOut,
        data: {
          'latitude': latitude,
          'longitude': longitude,
          if (type != null) 'type': type,
          if (notes != null) 'notes': notes,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['message'] ?? 'Gagal melakukan check-out');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal melakukan check-out');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<Map<String, dynamic>> getTodayStatus() async {
    try {
      final response = await dioClient.dio.get('/attendance/my-today');
      if (response.statusCode == 200) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil status hari ini');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil status hari ini');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<List<dynamic>> getMyHistory({int days = 30}) async {
    try {
      final endDate = DateTime.now();
      final startDate = endDate.subtract(Duration(days: days));
      final params = {
        'start_date': startDate.toIso8601String().substring(0, 10),
        'end_date': endDate.toIso8601String().substring(0, 10),
      };
      final response = await dioClient.dio.get('/attendance/my-history', queryParameters: params);
      if (response.statusCode == 200) {
        return response.data['data'] ?? [];
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil riwayat');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil riwayat');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await dioClient.dio.get('/attendance/dashboard');
      if (response.statusCode == 200) {
        return response.data['data'] ?? {};
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil data dashboard');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil data dashboard');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }
}
