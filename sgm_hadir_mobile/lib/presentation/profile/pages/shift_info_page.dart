import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/shift_model.dart';

class ShiftInfoPage extends StatefulWidget {
  const ShiftInfoPage({super.key});

  @override
  State<ShiftInfoPage> createState() => _ShiftInfoPageState();
}

class _ShiftInfoPageState extends State<ShiftInfoPage> {
  ShiftModel? _shift;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchShift();
  }

  Future<void> _fetchShift() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');
      final dio = Dio(BaseOptions(baseUrl: ApiConstants.baseUrl));
      final res = await dio.get(
        '/my-shift',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      final data = res.data['data'];
      setState(() {
        _shift = data != null ? ShiftModel.fromJson(data as Map<String, dynamic>) : null;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Gagal memuat info shift';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Info Shift Kerja'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!, style: const TextStyle(color: Colors.red)))
              : _shift == null
                  ? _buildNoShift()
                  : _buildShiftCard(),
    );
  }

  Widget _buildNoShift() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.schedule, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'Belum ada shift yang ditetapkan',
            style: TextStyle(color: Colors.grey[600], fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            'Hubungi admin untuk menetapkan shift kerja Anda',
            style: TextStyle(color: Colors.grey[500], fontSize: 13),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildShiftCard() {
    final shift = _shift!;
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(32),
                ),
                child: Icon(Icons.work_history, color: AppColors.primary, size: 32),
              ),
              const SizedBox(height: 16),
              Text(
                shift.name,
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildTimeInfo('Jam Masuk', shift.startTime, Icons.login),
                  Container(width: 1, height: 60, color: Colors.grey[300]),
                  _buildTimeInfo('Jam Pulang', shift.endTime, Icons.logout),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: shift.isActive ? Colors.green[50] : Colors.grey[100],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  shift.isActive ? 'Aktif' : 'Tidak Aktif',
                  style: TextStyle(
                    color: shift.isActive ? Colors.green[700] : Colors.grey[600],
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimeInfo(String label, String time, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 24),
        const SizedBox(height: 8),
        Text(
          time,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
      ],
    );
  }
}
