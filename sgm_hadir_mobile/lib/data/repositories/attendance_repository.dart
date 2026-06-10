import '../datasources/attendance_remote_datasource.dart';

class AttendanceRepository {
  final AttendanceRemoteDataSource remoteDataSource;

  AttendanceRepository(this.remoteDataSource);

  Future<String> uploadSelfie(String filePath) async {
    return await remoteDataSource.uploadSelfie(filePath);
  }

  Future<void> checkIn(double latitude, double longitude, String selfieUrl, {String? type, String? notes}) async {
    await remoteDataSource.checkIn(latitude, longitude, selfieUrl, type: type, notes: notes);
  }

  Future<void> checkOut(double latitude, double longitude, {String? type, String? notes}) async {
    await remoteDataSource.checkOut(latitude, longitude, type: type, notes: notes);
  }

  Future<Map<String, dynamic>> getTodayStatus() async {
    return await remoteDataSource.getTodayStatus();
  }

  Future<List<dynamic>> getMyHistory() async {
    return await remoteDataSource.getMyHistory();
  }

  Future<Map<String, dynamic>> getDashboardStats() async {
    return await remoteDataSource.getDashboardStats();
  }
}
