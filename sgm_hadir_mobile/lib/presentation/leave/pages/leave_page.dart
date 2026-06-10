import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/datasources/leave_remote_datasource.dart';
import '../bloc/leave_bloc.dart';
import '../bloc/leave_event.dart';
import '../bloc/leave_state.dart';
import 'leave_create_page.dart';

class LeavePage extends StatefulWidget {
  const LeavePage({super.key});

  @override
  State<LeavePage> createState() => _LeavePageState();
}

class _LeavePageState extends State<LeavePage> {
  Map<String, dynamic>? _quota;
  bool _loadingQuota = true;

  @override
  void initState() {
    super.initState();
    context.read<LeaveBloc>().add(FetchLeaves());
    _fetchQuota();
  }

  Future<void> _fetchQuota() async {
    try {
      final ds = context.read<LeaveRemoteDataSource>();
      final data = await ds.getLeaveQuota();
      if (mounted) setState(() { _quota = data; _loadingQuota = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingQuota = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Izin & Cuti', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: Column(
        children: [
          _buildQuotaCard(),
          Expanded(child: _buildList()),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const LeaveCreatePage()),
          ).then((_) {
            if (!context.mounted) return;
            context.read<LeaveBloc>().add(FetchLeaves());
            _fetchQuota();
          });
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildQuotaCard() {
    if (_loadingQuota) {
      return Container(
        color: AppColors.primary,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        child: Container(
          height: 72,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))),
        ),
      );
    }

    if (_quota == null) return const SizedBox.shrink();

    final annual = _quota!['annual_quota'] ?? 0;
    final used = _quota!['used_days'] ?? 0;
    final remaining = _quota!['remaining_days'] ?? 0;
    final year = _quota!['year'] ?? DateTime.now().year;

    return Container(
      color: AppColors.primary,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            const Icon(Icons.event_available, color: Colors.white, size: 28),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Kuota Cuti Tahunan $year',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$remaining hari tersisa',
                    style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _QuotaBadge(label: 'Total', value: '$annual', color: Colors.white),
                const SizedBox(height: 4),
                _QuotaBadge(label: 'Terpakai', value: '$used', color: Colors.orange.shade200),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildList() {
    return BlocBuilder<LeaveBloc, LeaveState>(
      buildWhen: (previous, current) =>
          current is LeaveLoading || current is LeaveLoaded || current is LeaveError,
      builder: (context, state) {
        if (state is LeaveLoading) {
          return const Center(child: CircularProgressIndicator());
        } else if (state is LeaveError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
                const SizedBox(height: 16),
                Text(state.message, style: const TextStyle(color: AppColors.danger)),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () => context.read<LeaveBloc>().add(FetchLeaves()),
                  child: const Text('Coba Lagi'),
                ),
              ],
            ),
          );
        } else if (state is LeaveLoaded) {
          final leaves = state.leaves;
          if (leaves.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.event_note, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'Belum ada pengajuan izin/cuti',
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              context.read<LeaveBloc>().add(FetchLeaves());
              _fetchQuota();
            },
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: leaves.length,
              separatorBuilder: (context, index) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final leave = leaves[index];
                Color statusColor;
                String statusText;

                if (leave.status == 'approved') {
                  statusColor = AppColors.success;
                  statusText = 'Disetujui';
                } else if (leave.status == 'rejected') {
                  statusColor = AppColors.danger;
                  statusText = 'Ditolak';
                } else {
                  statusColor = AppColors.warning;
                  statusText = 'Menunggu';
                }

                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 5, offset: const Offset(0, 2)),
                    ],
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              leave.leaveTypeName,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                          Row(
                            children: [
                              if (leave.status == 'pending')
                                GestureDetector(
                                  onTap: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (context) => LeaveCreatePage(initialLeave: leave)),
                                    ).then((updated) {
                                      if (updated == true && context.mounted) {
                                        context.read<LeaveBloc>().add(FetchLeaves());
                                        _fetchQuota();
                                      }
                                    });
                                  },
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    margin: const EdgeInsets.only(right: 8),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Icon(Icons.edit, size: 16, color: AppColors.primary),
                                  ),
                                ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusColor.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  statusText,
                                  style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                          const SizedBox(width: 6),
                          Text(
                            '${leave.startDate} - ${leave.endDate} (${leave.totalDays} hari)',
                            style: const TextStyle(color: Colors.black87, fontSize: 13),
                          ),
                        ],
                      ),
                      if (leave.reason != null && leave.reason!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(leave.reason!, style: const TextStyle(color: Colors.black54, fontSize: 13)),
                      ],
                      if (leave.approverNote != null && leave.approverNote!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Catatan Approver: ${leave.approverNote}',
                            style: const TextStyle(color: Colors.black87, fontSize: 12, fontStyle: FontStyle.italic),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          );
        }

        return const SizedBox();
      },
    );
  }
}

class _QuotaBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _QuotaBadge({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$label: ', style: TextStyle(color: color.withValues(alpha: 0.8), fontSize: 11)),
        Text(value, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
