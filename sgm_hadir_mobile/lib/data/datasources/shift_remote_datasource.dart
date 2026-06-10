import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../models/shift_model.dart';

class ShiftRemoteDataSource {
  static Future<ShiftModel?> fetchMyShift() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null) return null;

    final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
    final res = await dio.get(
      '/my-shift',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );

    final data = res.data['data'];
    if (data == null) return null;
    return ShiftModel.fromJson(data as Map<String, dynamic>);
  }
}
