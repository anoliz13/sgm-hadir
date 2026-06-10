import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/constants/app_colors.dart';
import '../../home/bloc/attendance_bloc.dart';
import '../../home/bloc/attendance_event.dart';
import '../../home/bloc/attendance_state.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({super.key});

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  @override
  void initState() {
    super.initState();
    context.read<AttendanceBloc>().add(FetchMyHistory());
  }

  Widget _getStatusIcon(String status, String type) {
    if (type.contains('visit')) {
      return const Icon(Icons.directions_run, color: AppColors.primary);
    }
    if (type == 'check_in') {
      return const Icon(Icons.login, color: AppColors.success);
    }
    if (type == 'check_out') {
      return const Icon(Icons.logout, color: AppColors.warning);
    }
    return const Icon(Icons.event_note, color: Colors.grey);
  }

  String _formatDate(String isoString) {
    try {
      final date = DateTime.parse(isoString).toLocal();
      return "${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}";
    } catch (e) {
      return isoString;
    }
  }

  String _formatType(String type) {
    switch (type) {
      case 'check_in':
        return 'Check-In';
      case 'check_out':
        return 'Check-Out';
      case 'visit_in':
        return 'Kunjungan (Masuk)';
      case 'visit_out':
        return 'Kunjungan (Keluar)';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Riwayat Kehadiran', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: BlocBuilder<AttendanceBloc, AttendanceState>(
        buildWhen: (previous, current) => current is AttendanceLoading || current is AttendanceHistoryLoaded || current is AttendanceError,
        builder: (context, state) {
          if (state is AttendanceLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is AttendanceError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
                  const SizedBox(height: 16),
                  Text(state.message, style: const TextStyle(color: AppColors.danger)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => context.read<AttendanceBloc>().add(FetchMyHistory()),
                    child: const Text('Coba Lagi'),
                  )
                ],
              ),
            );
          }
          if (state is AttendanceHistoryLoaded) {
            final history = state.history;
            if (history.isEmpty) {
              return const Center(
                child: Text('Belum ada riwayat kehadiran.', style: TextStyle(color: AppColors.textSecondary)),
              );
            }

            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: history.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final item = history[index];
                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: _getStatusIcon(item['status'] ?? '', item['type'] ?? ''),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _formatType(item['type'] ?? ''),
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(item['created_at'] ?? ''),
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                fontSize: 13,
                              ),
                            ),
                            if (item['notes'] != null && item['notes'].toString().isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                '"${item['notes']}"',
                                style: const TextStyle(
                                  color: AppColors.textMuted,
                                  fontSize: 12,
                                  fontStyle: FontStyle.italic,
                                ),
                              ),
                            ]
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: item['status'] == 'approved' ? AppColors.success.withValues(alpha: 0.1) : AppColors.warning.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          (item['status'] ?? '').toString().toUpperCase(),
                          style: TextStyle(
                            color: item['status'] == 'approved' ? AppColors.success : AppColors.warning,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          }
          return const Center(child: Text('Memuat riwayat...'));
        },
      ),
    );
  }
}
