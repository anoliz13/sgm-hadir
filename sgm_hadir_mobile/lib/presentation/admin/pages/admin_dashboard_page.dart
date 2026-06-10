import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/datasources/admin_remote_datasource.dart';

class AdminDashboardPage extends StatefulWidget {
  final AdminRemoteDataSource dataSource;
  const AdminDashboardPage({super.key, required this.dataSource});

  @override
  State<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends State<AdminDashboardPage> {
  Map<String, dynamic>? _summary;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await widget.dataSource.getDashboardSummary();
      if (mounted) setState(() { _summary = data; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _fetch,
      child: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(28),
                  bottomRight: Radius.circular(28),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('ADMIN', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text('Dashboard', style: TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w800)),
                  Text(
                    _formatDate(DateTime.now()),
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverFillRemaining(
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
                    const SizedBox(height: 12),
                    Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.danger)),
                    const SizedBox(height: 16),
                    ElevatedButton(onPressed: _fetch, child: const Text('Coba Lagi')),
                  ],
                ),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverGrid(
                delegate: SliverChildListDelegate([
                  _StatCard(
                    icon: Icons.people_alt_rounded,
                    label: 'Total Karyawan',
                    value: '${_summary?['total_active_employees'] ?? 0}',
                    color: AppColors.primary,
                  ),
                  _StatCard(
                    icon: Icons.check_circle_rounded,
                    label: 'Hadir Hari Ini',
                    value: '${_summary?['total_present_today'] ?? 0}',
                    color: AppColors.success,
                  ),
                  _StatCard(
                    icon: Icons.cancel_rounded,
                    label: 'Belum Absen',
                    value: '${_summary?['total_not_checked_in'] ?? 0}',
                    color: AppColors.danger,
                  ),
                  _StatCard(
                    icon: Icons.alarm_rounded,
                    label: 'Terlambat',
                    value: '${_summary?['total_late_today'] ?? 0}',
                    color: AppColors.warning,
                  ),
                  _StatCard(
                    icon: Icons.event_note_rounded,
                    label: 'Sedang Izin',
                    value: '${_summary?['total_leave_today'] ?? 0}',
                    color: AppColors.statusIzin,
                  ),
                ]),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.5,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) {
    const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return '${days[d.weekday - 1]}, ${d.day} ${months[d.month - 1]} ${d.year}';
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
              Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }
}
