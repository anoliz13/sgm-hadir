import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://10.0.2.2:8080/api/v1'; // 10.0.2.2 for Android Emulator, use actual IP for real device
  final Dio _dio;

  ApiClient()
      : _dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 15),
            receiveTimeout: const Duration(seconds: 15),
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          ),
        ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('access_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            // Handle token expiration/unauthorized
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove('access_token');
            await prefs.remove('user_data');
            // We should ideally broadcast a logout event here so the UI can navigate to login
          }
          return handler.next(e);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
