import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';

class AdminRemoteDataSource {
  final DioClient dioClient;
  AdminRemoteDataSource(this.dioClient);

  Future<Map<String, dynamic>> getDashboardSummary() async {
    try {
      final res = await dioClient.dio.get('/admin/dashboard/summary');
      return (res.data['data'] as Map<String, dynamic>?) ?? {};
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal mengambil data dashboard');
    }
  }

  Future<List<Map<String, dynamic>>> getPendingLeaves() async {
    try {
      final res = await dioClient.dio.get('/admin/leaves', queryParameters: {'status': 'pending'});
      final data = res.data['data'];
      if (data == null) return [];
      return List<Map<String, dynamic>>.from(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal mengambil pengajuan izin');
    }
  }

  Future<void> updateLeaveStatus(String id, String status, String? note) async {
    try {
      await dioClient.dio.put('/admin/leaves/$id/status', data: {
        'status': status,
        if (note != null && note.isNotEmpty) 'approver_note': note,
      });
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal memperbarui status');
    }
  }

  Future<List<Map<String, dynamic>>> getPendingOvertimes() async {
    try {
      final res = await dioClient.dio.get('/admin/overtimes', queryParameters: {'status': 'pending'});
      final data = res.data['data'];
      if (data == null) return [];
      return List<Map<String, dynamic>>.from(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal mengambil pengajuan lembur');
    }
  }

  Future<void> updateOvertimeStatus(String id, String status, String? note) async {
    try {
      await dioClient.dio.put('/admin/overtimes/$id/status', data: {
        'status': status,
        if (note != null && note.isNotEmpty) 'approver_note': note,
      });
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal memperbarui status');
    }
  }

  Future<List<Map<String, dynamic>>> getTodayAttendances() async {
    try {
      final today = DateTime.now().toIso8601String().substring(0, 10);
      final res = await dioClient.dio.get('/admin/attendances', queryParameters: {
        'start_date': today,
        'end_date': today,
        'type': 'check_in',
      });
      final data = res.data['data'];
      if (data == null) return [];
      return List<Map<String, dynamic>>.from(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal mengambil data absensi');
    }
  }

  Future<List<Map<String, dynamic>>> getAllLeaves({String? status}) async {
    try {
      final params = <String, dynamic>{};
      if (status != null) params['status'] = status;
      final res = await dioClient.dio.get('/admin/leaves', queryParameters: params);
      final data = res.data['data'];
      if (data == null) return [];
      return List<Map<String, dynamic>>.from(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal mengambil data izin');
    }
  }

  Future<List<Map<String, dynamic>>> getAllOvertimes({String? status}) async {
    try {
      final params = <String, dynamic>{};
      if (status != null) params['status'] = status;
      final res = await dioClient.dio.get('/admin/overtimes', queryParameters: params);
      final data = res.data['data'];
      if (data == null) return [];
      return List<Map<String, dynamic>>.from(data);
    } on DioException catch (e) {
      throw Exception(e.response?.data['message'] ?? 'Gagal mengambil data lembur');
    }
  }
}
