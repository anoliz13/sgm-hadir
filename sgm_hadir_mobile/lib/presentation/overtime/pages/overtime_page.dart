import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/constants/app_colors.dart';
import '../bloc/overtime_bloc.dart';
import '../bloc/overtime_event.dart';
import '../bloc/overtime_state.dart';
import 'overtime_create_page.dart';

class OvertimePage extends StatefulWidget {
  const OvertimePage({super.key});

  @override
  State<OvertimePage> createState() => _OvertimePageState();
}

class _OvertimePageState extends State<OvertimePage> {
  @override
  void initState() {
    super.initState();
    context.read<OvertimeBloc>().add(LoadOvertimes());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Pengajuan Lembur', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
        elevation: 0,
      ),
      body: BlocBuilder<OvertimeBloc, OvertimeState>(
        buildWhen: (previous, current) {
          return current is OvertimeLoading || current is OvertimeLoaded || current is OvertimeError;
        },
        builder: (context, state) {
          if (state is OvertimeLoading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is OvertimeError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
                  const SizedBox(height: 16),
                  Text(state.message, style: const TextStyle(color: AppColors.danger)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () {
                      context.read<OvertimeBloc>().add(LoadOvertimes());
                    },
                    child: const Text('Coba Lagi'),
                  ),
                ],
              ),
            );
          } else if (state is OvertimeLoaded) {
            final overtimes = state.overtimes;

            if (overtimes.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.access_time_filled, size: 64, color: Colors.grey.shade400),
                    const SizedBox(height: 16),
                    Text(
                      'Belum ada pengajuan lembur',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                    ),
                  ],
                ),
              );
            }

            return RefreshIndicator(
              onRefresh: () async {
                context.read<OvertimeBloc>().add(LoadOvertimes());
              },
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: overtimes.length,
                separatorBuilder: (context, index) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final overtime = overtimes[index];
                  Color statusColor;
                  String statusText;

                  if (overtime.status == 'approved') {
                    statusColor = AppColors.success;
                    statusText = 'Disetujui';
                  } else if (overtime.status == 'rejected') {
                    statusColor = AppColors.danger;
                    statusText = 'Ditolak';
                  } else if (overtime.status == 'completed') {
                    statusColor = AppColors.statusLembur;
                    statusText = 'Selesai';
                  } else {
                    statusColor = AppColors.warning;
                    statusText = 'Menunggu';
                  }

                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 5,
                          offset: const Offset(0, 2),
                        ),
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
                                'Lembur - ${overtime.date}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                            ),
                            Row(
                              children: [
                                if (overtime.status == 'pending')
                                  GestureDetector(
                                    onTap: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (context) => OvertimeCreatePage(initialOvertime: overtime),
                                        ),
                                      ).then((updated) {
                                        if (updated == true && context.mounted) {
                                          context.read<OvertimeBloc>().add(LoadOvertimes());
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
                                    style: TextStyle(
                                      color: statusColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.access_time, size: 14, color: Colors.grey),
                            const SizedBox(width: 6),
                            Text(
                              'Estimasi: ${overtime.estimatedStart} - ${overtime.estimatedEnd}',
                              style: const TextStyle(color: Colors.black87, fontSize: 13),
                            ),
                          ],
                        ),
                        if (overtime.reason != null && overtime.reason!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            overtime.reason!,
                            style: const TextStyle(color: Colors.black54, fontSize: 13),
                          ),
                        ],
                        if (overtime.approverNote != null && overtime.approverNote!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade100,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Catatan Approver: ${overtime.approverNote}',
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
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const OvertimeCreatePage(),
            ),
          ).then((_) {
            if (!context.mounted) return;
            context.read<OvertimeBloc>().add(LoadOvertimes());
          });
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }
}
