import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/datasources/admin_remote_datasource.dart';

class AdminAttendanceTodayPage extends StatefulWidget {
  final AdminRemoteDataSource dataSource;
  const AdminAttendanceTodayPage({super.key, required this.dataSource});

  @override
  State<AdminAttendanceTodayPage> createState() => _AdminAttendanceTodayPageState();
}

class _AdminAttendanceTodayPageState extends State<AdminAttendanceTodayPage> {
  List<Map<String, dynamic>> _attendances = [];
  bool _loading = true;
  String? _error;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await widget.dataSource.getTodayAttendances();
      if (mounted) setState(() { _attendances = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  List<Map<String, dynamic>> get _filtered {
    if (_search.isEmpty) return _attendances;
    final q = _search.toLowerCase();
    return _attendances.where((a) {
      final name = (a['user_name'] ?? '').toString().toLowerCase();
      final nik = (a['user_nik'] ?? '').toString().toLowerCase();
      return name.contains(q) || nik.contains(q);
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final today = DateTime.now();
    final todayStr = '${today.day.toString().padLeft(2, '0')}/${today.month.toString().padLeft(2, '0')}/${today.year}';

    final onTime = _attendances.where((a) => a['status'] == 'on_time').length;
    final late = _attendances.where((a) => a['status'] == 'late').length;
    final total = _attendances.length;

    return Column(
      children: [
        // Header summary
        Container(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
          decoration: const BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.only(
              bottomLeft: Radius.circular(24),
              bottomRight: Radius.circular(24),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Absensi Hari Ini', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      Text(todayStr, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                    onPressed: _fetch,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(child: _MiniStat(label: 'Total', value: '$total', color: Colors.white)),
                  Expanded(child: _MiniStat(label: 'Tepat Waktu', value: '$onTime', color: Colors.greenAccent.shade100)),
                  Expanded(child: _MiniStat(label: 'Terlambat', value: '$late', color: Colors.orangeAccent.shade100)),
                ],
              ),
            ],
          ),
        ),
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: TextField(
            onChanged: (v) => setState(() => _search = v),
            decoration: InputDecoration(
              hintText: 'Cari nama atau NIK...',
              prefixIcon: const Icon(Icons.search, color: Colors.grey),
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade300)),
              filled: true,
              fillColor: Colors.white,
            ),
          ),
        ),
        // List
        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
                        const SizedBox(height: 8),
                        Text(_error!, style: const TextStyle(color: AppColors.danger)),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _fetch, child: const Text('Coba Lagi')),
                      ]),
                    )
                  : _filtered.isEmpty
                      ? Center(
                          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(Icons.event_available, size: 64, color: Colors.grey.shade300),
                            const SizedBox(height: 12),
                            Text(
                              _search.isNotEmpty ? 'Tidak ditemukan' : 'Belum ada absensi hari ini',
                              style: TextStyle(color: Colors.grey.shade500),
                            ),
                          ]),
                        )
                      : RefreshIndicator(
                          onRefresh: _fetch,
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                            itemCount: _filtered.length,
                            separatorBuilder: (_, __) => const SizedBox(height: 8),
                            itemBuilder: (context, index) {
                              final item = _filtered[index];
                              final isLate = item['status'] == 'late';
                              final statusColor = isLate ? AppColors.warning : AppColors.success;
                              final checkInTime = _parseTime(item['created_at']);
                              final type = item['type'] ?? 'check_in';

                              return Container(
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4, offset: const Offset(0, 1))],
                                ),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      backgroundColor: statusColor.withValues(alpha: 0.1),
                                      radius: 20,
                                      child: Text(
                                        (item['user_name'] ?? '?').toString().isNotEmpty
                                            ? item['user_name'].toString()[0].toUpperCase()
                                            : '?',
                                        style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(item['user_name'] ?? '-', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                          Text(item['user_nik'] ?? '', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                          if (item['branch_name'] != null)
                                            Text(item['branch_name'], style: const TextStyle(color: Colors.grey, fontSize: 11)),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.end,
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                          decoration: BoxDecoration(
                                            color: statusColor.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: Text(
                                            isLate ? 'Terlambat' : 'Tepat Waktu',
                                            style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600),
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(checkInTime, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                                        if (type != 'check_in')
                                          Text(type, style: const TextStyle(color: Colors.blueGrey, fontSize: 10)),
                                      ],
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
        ),
      ],
    );
  }

  String _parseTime(dynamic raw) {
    if (raw == null) return '-';
    try {
      final d = DateTime.parse(raw.toString()).toLocal();
      return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return '-';
    }
  }
}

class _MiniStat extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _MiniStat({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w800)),
        Text(label, style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 11)),
      ],
    );
  }
}
