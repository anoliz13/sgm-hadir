import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/datasources/leave_remote_datasource.dart';
import '../../../data/models/leave_model.dart';
import '../bloc/leave_bloc.dart';
import '../bloc/leave_event.dart';
import '../bloc/leave_state.dart';

class LeaveCreatePage extends StatefulWidget {
  final LeaveRequestModel? initialLeave;

  const LeaveCreatePage({super.key, this.initialLeave});

  @override
  State<LeaveCreatePage> createState() => _LeaveCreatePageState();
}

class _LeaveCreatePageState extends State<LeaveCreatePage> {
  final _formKey = GlobalKey<FormState>();

  LeaveTypeModel? _selectedLeaveType;
  DateTime? _startDate;
  DateTime? _endDate;
  final TextEditingController _reasonController = TextEditingController();
  final TextEditingController _totalDaysController = TextEditingController();

  String? _attachmentPath;
  String? _existingAttachmentUrl;

  Map<String, dynamic>? _quota;

  bool get _isEditMode => widget.initialLeave != null;

  @override
  void initState() {
    super.initState();
    context.read<LeaveBloc>().add(FetchLeaveTypes());
    _fetchQuota();
    if (_isEditMode) {
      final leave = widget.initialLeave!;
      _reasonController.text = leave.reason ?? '';
      _totalDaysController.text = leave.totalDays.toString();
      _existingAttachmentUrl = leave.attachmentUrl;
      try {
        _startDate = DateTime.parse(leave.startDate);
        _endDate = DateTime.parse(leave.endDate);
      } catch (_) {}
    }
  }

  Future<void> _fetchQuota() async {
    try {
      final ds = context.read<LeaveRemoteDataSource>();
      final quota = await ds.getLeaveQuota();
      if (mounted) setState(() => _quota = quota);
    } catch (_) {}
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _totalDaysController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context, bool isStart) async {
    final initialDate = isStart
        ? (_startDate ?? DateTime.now())
        : (_endDate ?? _startDate ?? DateTime.now());

    final firstDate = isStart
        ? DateTime.now().subtract(const Duration(days: 30))
        : (_startDate ?? DateTime.now().subtract(const Duration(days: 30)));

    final picked = await showDatePicker(
      context: context,
      initialDate: initialDate,
      firstDate: firstDate,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(_startDate!)) {
            _endDate = _startDate;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile =
        await picker.pickImage(source: ImageSource.gallery, imageQuality: 50);
    if (pickedFile != null) {
      setState(() => _attachmentPath = pickedFile.path);
    }
  }

  void _submit(List<LeaveTypeModel> leaveTypes) {
    if (_formKey.currentState!.validate()) {
      if (_selectedLeaveType == null && !_isEditMode) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Pilih tipe cuti/izin terlebih dahulu')),
        );
        return;
      }
      if (_startDate == null || _endDate == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Pilih tanggal mulai dan selesai')),
        );
        return;
      }

      final totalDays = int.tryParse(_totalDaysController.text);
      if (totalDays == null || totalDays <= 0) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Masukkan total hari yang valid')),
        );
        return;
      }

      final deductsQuota = _selectedLeaveType?.deductsQuota ?? false;
      final remaining = ((_quota?['remaining_days'] ?? 0) as num).toInt();
      if (!_isEditMode && deductsQuota && remaining <= 0) {
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Kuota Cuti Habis'),
            content: const Text(
              'Kuota cuti tahunan Anda sudah habis. Silakan laporkan ke Supervisor / Kepala Salut untuk pengajuan manual.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Mengerti'),
              ),
            ],
          ),
        );
        return;
      }

      if (!_isEditMode && deductsQuota && totalDays > remaining) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Sisa kuota cuti Anda hanya $remaining hari, tidak cukup untuk $totalDays hari.'),
            backgroundColor: AppColors.danger,
          ),
        );
        return;
      }

      if (_isEditMode) {
        final leave = widget.initialLeave!;
        final typeId = _selectedLeaveType?.id ?? leave.leaveTypeId;
        context.read<LeaveBloc>().add(EditLeave(
              leaveId: leave.id,
              leaveTypeId: typeId,
              startDate: _startDate!.toIso8601String().split('T')[0],
              endDate: _endDate!.toIso8601String().split('T')[0],
              totalDays: totalDays,
              reason: _reasonController.text.isNotEmpty
                  ? _reasonController.text
                  : null,
              attachmentPath: _attachmentPath,
              existingAttachmentUrl: _existingAttachmentUrl,
            ));
      } else {
        context.read<LeaveBloc>().add(SubmitLeave(
              leaveTypeId: _selectedLeaveType!.id,
              startDate: _startDate!.toIso8601String().split('T')[0],
              endDate: _endDate!.toIso8601String().split('T')[0],
              totalDays: totalDays,
              reason: _reasonController.text.isNotEmpty
                  ? _reasonController.text
                  : null,
              attachmentPath: _attachmentPath,
            ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _isEditMode ? 'Edit Pengajuan' : 'Buat Pengajuan',
          style: const TextStyle(color: Colors.white),
        ),
        backgroundColor: AppColors.primary,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: BlocConsumer<LeaveBloc, LeaveState>(
        listener: (context, state) {
          if (state is LeaveSubmitSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Pengajuan berhasil dikirim!'),
                  backgroundColor: AppColors.success),
            );
            Navigator.pop(context, true);
          } else if (state is LeaveEditSuccess) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                  content: Text('Pengajuan berhasil diperbarui!'),
                  backgroundColor: AppColors.success),
            );
            Navigator.pop(context, true);
          } else if (state is LeaveError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                  content: Text(state.message),
                  backgroundColor: AppColors.danger),
            );
          }
        },
        buildWhen: (previous, current) {
          return current is LeaveTypesLoaded ||
              current is LeaveLoading ||
              current is LeaveSubmitting;
        },
        builder: (context, state) {
          if (state is LeaveLoading && !_isEditMode) {
            return const Center(child: CircularProgressIndicator());
          }

          List<LeaveTypeModel> leaveTypes = [];
          if (state is LeaveTypesLoaded) {
            leaveTypes = state.types;
            if (_isEditMode && _selectedLeaveType == null) {
              try {
                _selectedLeaveType = leaveTypes.firstWhere(
                  (t) => t.id == widget.initialLeave!.leaveTypeId,
                );
              } catch (_) {}
            }
          }

          final isSubmitting = state is LeaveSubmitting;

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tipe Izin / Cuti',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<LeaveTypeModel>(
                    decoration: InputDecoration(
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                    hint: const Text('Pilih Tipe'),
                    initialValue: _selectedLeaveType,
                    items: leaveTypes.map((type) {
                      return DropdownMenuItem(
                        value: type,
                        child: Text(type.name),
                      );
                    }).toList(),
                    onChanged: (value) =>
                        setState(() => _selectedLeaveType = value),
                    validator: (value) =>
                        (value == null && !_isEditMode) ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Dari Tanggal',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14)),
                            const SizedBox(height: 8),
                            InkWell(
                              onTap: () => _selectDate(context, true),
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(
                                      borderRadius:
                                          BorderRadius.circular(12)),
                                  contentPadding:
                                      const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 12),
                                ),
                                child: Text(_startDate != null
                                    ? _startDate!
                                        .toIso8601String()
                                        .split('T')[0]
                                    : 'Pilih'),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Sampai Tanggal',
                                style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14)),
                            const SizedBox(height: 8),
                            InkWell(
                              onTap: () => _selectDate(context, false),
                              child: InputDecorator(
                                decoration: InputDecoration(
                                  border: OutlineInputBorder(
                                      borderRadius:
                                          BorderRadius.circular(12)),
                                  contentPadding:
                                      const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 12),
                                ),
                                child: Text(_endDate != null
                                    ? _endDate!
                                        .toIso8601String()
                                        .split('T')[0]
                                    : 'Pilih'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Text('Total Hari',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _totalDaysController,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      hintText: 'Misal: 2',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                    ),
                    validator: (value) =>
                        value!.isEmpty ? 'Wajib diisi' : null,
                  ),
                  const SizedBox(height: 20),
                  const Text('Alasan Lengkap',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _reasonController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText:
                          'Tuliskan alasan pengajuan Anda secara lengkap...',
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.all(16),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Text('Lampiran Bukti (Opsional)',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 14)),
                  const SizedBox(height: 8),
                  InkWell(
                    onTap: _pickImage,
                    child: Container(
                      width: double.infinity,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: Colors.grey.shade300,
                            style: BorderStyle.solid),
                      ),
                      child: _attachmentPath != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.file(
                                File(_attachmentPath!),
                                fit: BoxFit.cover,
                              ),
                            )
                          : _existingAttachmentUrl != null
                              ? Stack(
                                  children: [
                                    ClipRRect(
                                      borderRadius:
                                          BorderRadius.circular(12),
                                      child: Image.network(
                                        _existingAttachmentUrl!,
                                        fit: BoxFit.cover,
                                        width: double.infinity,
                                        height: double.infinity,
                                      ),
                                    ),
                                    Positioned(
                                      bottom: 8,
                                      right: 8,
                                      child: Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color:
                                              Colors.black54,
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: const Text(
                                          'Ketuk untuk ganti',
                                          style: TextStyle(
                                              color: Colors.white,
                                              fontSize: 11),
                                        ),
                                      ),
                                    ),
                                  ],
                                )
                              : const Column(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.cloud_upload,
                                        size: 40, color: Colors.grey),
                                    SizedBox(height: 8),
                                    Text(
                                        'Ketuk untuk unggah foto (Surat Dokter, dll)',
                                        style: TextStyle(
                                            color: Colors.grey)),
                                  ],
                                ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed:
                          isSubmitting ? null : () => _submit(leaveTypes),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                      child: isSubmitting
                          ? const CircularProgressIndicator(
                              color: Colors.white)
                          : Text(
                              _isEditMode
                                  ? 'Simpan Perubahan'
                                  : 'Kirim Pengajuan',
                              style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white),
                            ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
