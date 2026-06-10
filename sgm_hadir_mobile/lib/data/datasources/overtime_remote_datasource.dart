import 'package:dio/dio.dart';
import '../models/overtime_model.dart';
import '../../../core/network/dio_client.dart';

class OvertimeRemoteDataSource {
  final DioClient dioClient;

  OvertimeRemoteDataSource(this.dioClient);

  Future<List<OvertimeModel>> getMyOvertimes() async {
    try {
      final response = await dioClient.dio.get('/overtimes');
      final data = response.data['data'];
      if (data == null) return [];
      return (data as List).map((e) => OvertimeModel.fromJson(e)).toList();
    } catch (e) {
      if (e is DioException) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil data lembur');
      }
      throw Exception('Terjadi kesalahan: $e');
    }
  }

  Future<void> updateOvertime({
    required String overtimeId,
    required String date,
    required String estimatedStart,
    required String estimatedEnd,
    required String reason,
  }) async {
    try {
      await dioClient.dio.put('/overtimes/$overtimeId', data: {
        'date': date,
        'estimated_start': estimatedStart,
        'estimated_end': estimatedEnd,
        'reason': reason,
      });
    } catch (e) {
      if (e is DioException) {
        throw Exception(e.response?.data['message'] ?? 'Gagal memperbarui pengajuan lembur');
      }
      throw Exception('Terjadi kesalahan: $e');
    }
  }

  Future<void> createOvertime({
    required String date,
    required String estimatedStart,
    required String estimatedEnd,
    required String reason,
  }) async {
    try {
      await dioClient.dio.post('/overtimes', data: {
        'date': date,
        'estimated_start': estimatedStart,
        'estimated_end': estimatedEnd,
        'reason': reason,
      });
    } catch (e) {
      if (e is DioException) {
        throw Exception(e.response?.data['message'] ?? 'Gagal membuat pengajuan lembur');
      }
      throw Exception('Terjadi kesalahan: $e');
    }
  }
}
