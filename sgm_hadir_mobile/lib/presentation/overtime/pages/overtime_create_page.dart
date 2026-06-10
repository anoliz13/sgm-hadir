import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../data/models/overtime_model.dart';
import '../bloc/overtime_bloc.dart';
import '../bloc/overtime_event.dart';
import '../bloc/overtime_state.dart';

class OvertimeCreatePage extends StatefulWidget {
  final OvertimeModel? initialOvertime;

  const OvertimeCreatePage({super.key, this.initialOvertime});

  @override
  State<OvertimeCreatePage> createState() => _OvertimeCreatePageState();
}

class _OvertimeCreatePageState extends State<OvertimeCreatePage> {
  final _formKey = GlobalKey<FormState>();
  final _reasonController = TextEditingController();

  DateTime? _selectedDate;
  TimeOfDay? _startTime;
  TimeOfDay? _endTime;

  bool get _isEditMode => widget.initialOvertime != null;

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      final ot = widget.initialOvertime!;
      _reasonController.text = ot.reason ?? '';
      try {
        _selectedDate = DateTime.parse(ot.date);
        final startParts = ot.estimatedStart.split(':');
        final endParts = ot.estimatedEnd.split(':');
        _startTime = TimeOfDay(
          hour: int.parse(startParts[0]),
          minute: int.parse(startParts[1]),
        );
        _endTime = TimeOfDay(
          hour: int.parse(endParts[0]),
          minute: int.parse(endParts[1]),
        );
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? DateTime.now(),
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime(2101),
    );
    if (picked != null) setState(() => _selectedDate = picked);
  }

  Future<void> _selectTime(BuildContext context, bool isStart) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime:
          isStart ? (_startTime ?? TimeOfDay.now()) : (_endTime ?? TimeOfDay.now()),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startTime = picked;
        } else {
          _endTime = picked;
        }
      });
    }
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      if (_selectedDate == null || _startTime == null || _endTime == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Pilih tanggal dan jam estimasi')),
        );
        return;
      }

      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate!);
      final startStr =
          '${_startTime!.hour.toString().padLeft(2, '0')}:${_startTime!.minute.toString().padLeft(2, '0')}';
      final endStr =
          '${_endTime!.hour.toString().padLeft(2, '0')}:${_endTime!.minute.toString().padLeft(2, '0')}';

      if (_isEditMode) {
        context.read<OvertimeBloc>().add(EditOvertimeRequest(
              overtimeId: widget.initialOvertime!.id,
              date: dateStr,
              estimatedStart: startStr,
              estimatedEnd: endStr,
              reason: _reasonController.text,
            ));
      } else {
        context.read<OvertimeBloc>().add(SubmitOvertimeRequest(
              date: dateStr,
              estimatedStart: startStr,
              estimatedEnd: endStr,
              reason: _reasonController.text,
            ));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<OvertimeBloc, OvertimeState>(
      listener: (context, state) {
        if (state is OvertimeSubmitSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.success),
          );
          Navigator.pop(context, true);
        } else if (state is OvertimeEditSuccess) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.success),
          );
          Navigator.pop(context, true);
        } else if (state is OvertimeSubmitError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.danger),
          );
        } else if (state is OvertimeEditError) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(state.message),
                backgroundColor: AppColors.danger),
          );
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: Text(
            _isEditMode ? 'Edit Ajuan Lembur' : 'Buat Ajuan Lembur',
            style: const TextStyle(
                color: Colors.white, fontWeight: FontWeight.bold),
          ),
          backgroundColor: AppColors.primary,
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Tanggal Lembur',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () => _selectDate(context),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedDate == null
                              ? 'Pilih Tanggal'
                              : DateFormat('dd MMM yyyy')
                                  .format(_selectedDate!),
                          style: TextStyle(
                            color: _selectedDate == null
                                ? Colors.grey
                                : Colors.black87,
                            fontSize: 16,
                          ),
                        ),
                        const Icon(Icons.calendar_today, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Jam Mulai',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: () => _selectTime(context, true),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border:
                                    Border.all(color: Colors.grey.shade300),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _startTime == null
                                        ? '--:--'
                                        : _startTime!.format(context),
                                    style: TextStyle(
                                      color: _startTime == null
                                          ? Colors.grey
                                          : Colors.black87,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const Icon(Icons.access_time,
                                      color: Colors.grey),
                                ],
                              ),
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
                          const Text(
                            'Jam Selesai',
                            style: TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          InkWell(
                            onTap: () => _selectTime(context, false),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 14),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                                border:
                                    Border.all(color: Colors.grey.shade300),
                              ),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _endTime == null
                                        ? '--:--'
                                        : _endTime!.format(context),
                                    style: TextStyle(
                                      color: _endTime == null
                                          ? Colors.grey
                                          : Colors.black87,
                                      fontSize: 16,
                                    ),
                                  ),
                                  const Icon(Icons.access_time,
                                      color: Colors.grey),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                const Text(
                  'Alasan Lembur',
                  style:
                      TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _reasonController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Jelaskan alasan lembur...',
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide:
                          BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                      borderSide:
                          BorderSide(color: Colors.grey.shade300),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Alasan tidak boleh kosong';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 40),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: BlocBuilder<OvertimeBloc, OvertimeState>(
                    builder: (context, state) {
                      final isLoading = state is OvertimeSubmitLoading;
                      return ElevatedButton(
                        onPressed: isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: isLoading
                            ? const CircularProgressIndicator(
                                color: Colors.white)
                            : Text(
                                _isEditMode
                                    ? 'Simpan Perubahan'
                                    : 'Ajukan Lembur',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                      );
                    },
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
