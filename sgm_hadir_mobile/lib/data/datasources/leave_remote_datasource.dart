import 'package:dio/dio.dart';
import '../../core/network/dio_client.dart';
import '../models/leave_model.dart';

class LeaveRemoteDataSource {
  final DioClient dioClient;

  LeaveRemoteDataSource(this.dioClient);

  Future<List<LeaveTypeModel>> getLeaveTypes() async {
    try {
      final response = await dioClient.dio.get('/leaves/types');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        return data.map((json) => LeaveTypeModel.fromJson(json)).toList();
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil daftar tipe cuti');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil daftar tipe cuti');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<List<LeaveRequestModel>> getMyLeaveRequests() async {
    try {
      final response = await dioClient.dio.get('/leaves');
      if (response.statusCode == 200) {
        final List data = response.data['data'] ?? [];
        return data.map((json) => LeaveRequestModel.fromJson(json)).toList();
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil riwayat cuti');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil riwayat cuti');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<String> uploadAttachment(String filePath) async {
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
        throw Exception('Gagal mengunggah dokumen');
      }
    } on DioException catch (e) {
      throw Exception('Gagal mengunggah dokumen: ${e.message}');
    }
  }

  Future<void> updateLeaveRequest({
    required String leaveId,
    required String leaveTypeId,
    required String startDate,
    required String endDate,
    required int totalDays,
    String? reason,
    String? attachmentUrl,
  }) async {
    try {
      final response = await dioClient.dio.put(
        '/leaves/$leaveId',
        data: {
          'leave_type_id': leaveTypeId,
          'start_date': startDate,
          'end_date': endDate,
          'total_days': totalDays,
          if (reason != null) 'reason': reason,
          if (attachmentUrl != null) 'attachment_url': attachmentUrl,
        },
      );
      if (response.statusCode != 200) {
        throw Exception(response.data['message'] ?? 'Gagal memperbarui pengajuan');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal memperbarui pengajuan');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<Map<String, dynamic>> getLeaveQuota() async {
    try {
      final response = await dioClient.dio.get('/leaves/my-quota');
      if (response.statusCode == 200) {
        return (response.data['data'] as Map<String, dynamic>?) ?? {};
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengambil kuota cuti');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengambil kuota cuti');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }

  Future<LeaveRequestModel> submitLeaveRequest({
    required String leaveTypeId,
    required String startDate,
    required String endDate,
    required int totalDays,
    String? reason,
    String? attachmentUrl,
  }) async {
    try {
      final response = await dioClient.dio.post(
        '/leaves',
        data: {
          'leave_type_id': leaveTypeId,
          'start_date': startDate,
          'end_date': endDate,
          'total_days': totalDays,
          if (reason != null) 'reason': reason,
          if (attachmentUrl != null) 'attachment_url': attachmentUrl,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return LeaveRequestModel.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Gagal mengirim pengajuan cuti');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception(e.response?.data['message'] ?? 'Gagal mengirim pengajuan cuti');
      } else {
        throw Exception('Koneksi ke server gagal.');
      }
    }
  }
}
