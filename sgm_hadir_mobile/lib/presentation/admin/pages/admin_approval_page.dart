import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/datasources/admin_remote_datasource.dart';

class AdminApprovalPage extends StatefulWidget {
  final AdminRemoteDataSource dataSource;
  const AdminApprovalPage({super.key, required this.dataSource});

  @override
  State<AdminApprovalPage> createState() => _AdminApprovalPageState();
}

class _AdminApprovalPageState extends State<AdminApprovalPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  List<Map<String, dynamic>> _leaves = [];
  List<Map<String, dynamic>> _overtimes = [];
  bool _loadingLeaves = true;
  bool _loadingOvertimes = true;

  String _leaveFilter = 'pending';
  String _overtimeFilter = 'pending';

  static const _filterOptions = [
    {'label': 'Menunggu', 'value': 'pending'},
    {'label': 'Disetujui', 'value': 'approved'},
    {'label': 'Ditolak', 'value': 'rejected'},
    {'label': 'Semua', 'value': ''},
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchLeaves();
    _fetchOvertimes();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchLeaves() async {
    setState(() => _loadingLeaves = true);
    try {
      final data = await widget.dataSource.getAllLeaves(
        status: _leaveFilter.isEmpty ? null : _leaveFilter,
      );
      if (mounted) setState(() { _leaves = data; _loadingLeaves = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingLeaves = false);
    }
  }

  Future<void> _fetchOvertimes() async {
    setState(() => _loadingOvertimes = true);
    try {
      final data = await widget.dataSource.getAllOvertimes(
        status: _overtimeFilter.isEmpty ? null : _overtimeFilter,
      );
      if (mounted) setState(() { _overtimes = data; _loadingOvertimes = false; });
    } catch (_) {
      if (mounted) setState(() => _loadingOvertimes = false);
    }
  }

  int get _pendingLeaveCount => _leaves.where((l) => l['status'] == 'pending').length;
  int get _pendingOvertimeCount => _overtimes.where((o) => o['status'] == 'pending').length;

  Future<void> _showApprovalDialog({
    required String id,
    required String title,
    required bool isLeave,
  }) async {
    final noteCtrl = TextEditingController();
    String? selectedStatus;

    await showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                children: [
                  Expanded(
                    child: _ActionButton(
                      label: 'Setujui',
                      color: AppColors.success,
                      selected: selectedStatus == 'approved',
                      icon: Icons.check_circle_outline,
                      onTap: () => setDialogState(() => selectedStatus = 'approved'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionButton(
                      label: 'Tolak',
                      color: AppColors.danger,
                      selected: selectedStatus == 'rejected',
                      icon: Icons.cancel_outlined,
                      onTap: () => setDialogState(() => selectedStatus = 'rejected'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: noteCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Catatan (opsional)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  contentPadding: const EdgeInsets.all(12),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
            ElevatedButton(
              onPressed: selectedStatus == null
                  ? null
                  : () async {
                      Navigator.pop(ctx);
                      await _submitApproval(
                          id: id, status: selectedStatus!, note: noteCtrl.text, isLeave: isLeave);
                    },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary),
              child: const Text('Konfirmasi', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitApproval({
    required String id,
    required String status,
    required String note,
    required bool isLeave,
  }) async {
    try {
      if (isLeave) {
        await widget.dataSource.updateLeaveStatus(id, status, note.isEmpty ? null : note);
        await _fetchLeaves();
      } else {
        await widget.dataSource.updateOvertimeStatus(id, status, note.isEmpty ? null : note);
        await _fetchOvertimes();
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(status == 'approved' ? 'Pengajuan disetujui' : 'Pengajuan ditolak'),
          backgroundColor: status == 'approved' ? AppColors.success : AppColors.danger,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: AppColors.primary,
          child: TabBar(
            controller: _tabController,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white60,
            indicatorColor: Colors.white,
            indicatorWeight: 3,
            tabs: [
              Tab(
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Text('Izin & Cuti'),
                  if (_pendingLeaveCount > 0) ...[
                    const SizedBox(width: 6),
                    _Badge(count: _pendingLeaveCount),
                  ],
                ]),
              ),
              Tab(
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  const Text('Lembur'),
                  if (_pendingOvertimeCount > 0) ...[
                    const SizedBox(width: 6),
                    _Badge(count: _pendingOvertimeCount),
                  ],
                ]),
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildLeaveList(),
              _buildOvertimeList(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilterChips({
    required String selected,
    required ValueChanged<String> onSelected,
  }) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Row(
        children: _filterOptions.map((opt) {
          final value = opt['value']!;
          final label = opt['label']!;
          final isSelected = selected == value;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: FilterChip(
              label: Text(label),
              selected: isSelected,
              onSelected: (_) {
                onSelected(value);
              },
              selectedColor: AppColors.primary.withValues(alpha: 0.15),
              checkmarkColor: AppColors.primary,
              labelStyle: TextStyle(
                color: isSelected ? AppColors.primary : Colors.grey.shade700,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                fontSize: 13,
              ),
              side: BorderSide(
                color: isSelected ? AppColors.primary : Colors.grey.shade300,
              ),
              backgroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 4),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildLeaveList() {
    return Column(
      children: [
        _buildFilterChips(
          selected: _leaveFilter,
          onSelected: (val) {
            setState(() => _leaveFilter = val);
            _fetchLeaves();
          },
        ),
        Expanded(child: _buildLeaveContent()),
      ],
    );
  }

  Widget _buildLeaveContent() {
    if (_loadingLeaves) return const Center(child: CircularProgressIndicator());
    if (_leaves.isEmpty) {
      return _emptyState('Tidak ada pengajuan izin ditemukan', Icons.event_available);
    }

    return RefreshIndicator(
      onRefresh: _fetchLeaves,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        itemCount: _leaves.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final item = _leaves[index];
          final status = item['status'] as String? ?? 'pending';
          final isPending = status == 'pending';
          return _ApprovalCard(
            name: item['user_name'] ?? '',
            nik: item['user_nik'] ?? '',
            title: item['leave_type_name'] ?? 'Izin',
            subtitle:
                '${_fmtDate(item['start_date'])} - ${_fmtDate(item['end_date'])} (${item['total_days']} hari)',
            reason: item['reason'] as String?,
            status: status,
            approverNote: item['approver_note'] as String?,
            showApproveButton: isPending,
            onTap: isPending
                ? () => _showApprovalDialog(
                      id: item['id'],
                      title: 'Persetujuan Izin - ${item['user_name']}',
                      isLeave: true,
                    )
                : null,
          );
        },
      ),
    );
  }

  Widget _buildOvertimeList() {
    return Column(
      children: [
        _buildFilterChips(
          selected: _overtimeFilter,
          onSelected: (val) {
            setState(() => _overtimeFilter = val);
            _fetchOvertimes();
          },
        ),
        Expanded(child: _buildOvertimeContent()),
      ],
    );
  }

  Widget _buildOvertimeContent() {
    if (_loadingOvertimes) return const Center(child: CircularProgressIndicator());
    if (_overtimes.isEmpty) {
      return _emptyState('Tidak ada pengajuan lembur ditemukan', Icons.access_time_filled);
    }

    return RefreshIndicator(
      onRefresh: _fetchOvertimes,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
        itemCount: _overtimes.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final item = _overtimes[index];
          final status = item['status'] as String? ?? 'pending';
          final isPending = status == 'pending';
          return _ApprovalCard(
            name: item['user_name'] ?? '',
            nik: '',
            title: 'Lembur - ${_fmtDate(item['date'])}',
            subtitle: '${item['estimated_start'] ?? '--'} s/d ${item['estimated_end'] ?? '--'}',
            reason: item['reason'] as String?,
            status: status,
            approverNote: item['approver_note'] as String?,
            showApproveButton: isPending,
            onTap: isPending
                ? () => _showApprovalDialog(
                      id: item['id'],
                      title: 'Persetujuan Lembur - ${item['user_name']}',
                      isLeave: false,
                    )
                : null,
          );
        },
      ),
    );
  }

  Widget _emptyState(String msg, IconData icon) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 12),
          Text(msg, textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade500)),
        ],
      ),
    );
  }

  String _fmtDate(dynamic raw) {
    if (raw == null) return '-';
    try {
      final d = DateTime.parse(raw.toString());
      return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
    } catch (_) {
      final s = raw.toString();
      return s.length >= 10 ? s.substring(0, 10) : s;
    }
  }
}

class _Badge extends StatelessWidget {
  final int count;
  const _Badge({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(10)),
      child: Text('$count',
          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final bool selected;
  final IconData icon;
  final VoidCallback onTap;

  const _ActionButton(
      {required this.label,
      required this.color,
      required this.selected,
      required this.icon,
      required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? color : color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color, width: 1.5),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: selected ? Colors.white : color, size: 18),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(
                    color: selected ? Colors.white : color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}

class _ApprovalCard extends StatelessWidget {
  final String name;
  final String nik;
  final String title;
  final String subtitle;
  final String? reason;
  final String status;
  final String? approverNote;
  final bool showApproveButton;
  final VoidCallback? onTap;

  const _ApprovalCard({
    required this.name,
    required this.nik,
    required this.title,
    required this.subtitle,
    this.reason,
    required this.status,
    this.approverNote,
    required this.showApproveButton,
    this.onTap,
  });

  Color get _statusColor {
    switch (status) {
      case 'approved':
        return AppColors.success;
      case 'rejected':
        return AppColors.danger;
      default:
        return AppColors.warning;
    }
  }

  String get _statusLabel {
    switch (status) {
      case 'approved':
        return 'Disetujui';
      case 'rejected':
        return 'Ditolak';
      default:
        return 'Menunggu';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 6, offset: const Offset(0, 2))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                  radius: 22,
                  child: Text(
                    name.isNotEmpty ? name[0].toUpperCase() : '?',
                    style: const TextStyle(
                        color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name,
                          style:
                              const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      Text(title,
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 13,
                              fontWeight: FontWeight.w500)),
                      Text(subtitle,
                          style: const TextStyle(color: Colors.grey, fontSize: 12)),
                      if (reason != null && reason!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(reason!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(color: Colors.black54, fontSize: 12)),
                      ],
                      if (approverNote != null && approverNote!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text('Catatan: $approverNote',
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: Colors.black45,
                                fontSize: 11,
                                fontStyle: FontStyle.italic)),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: _statusColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _statusColor.withValues(alpha: 0.5)),
                  ),
                  child: Text(
                    showApproveButton ? 'Tinjau' : _statusLabel,
                    style: TextStyle(
                        color: _statusColor, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
