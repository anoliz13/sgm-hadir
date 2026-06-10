import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/theme/theme_cubit.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../../data/datasources/leave_remote_datasource.dart';
import '../../auth/pages/login_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _leaveQuota;
  bool _isLoading = true;
  String _error = '';

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final repo = context.read<AuthRepository>();
      final profile = await repo.getProfile();
      if (mounted) {
        setState(() {
          _user = profile;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
    _fetchLeaveQuota();
  }

  Future<void> _fetchLeaveQuota() async {
    try {
      final datasource = context.read<LeaveRemoteDataSource>();
      final quota = await datasource.getLeaveQuota();
      if (mounted) {
        setState(() => _leaveQuota = quota);
      }
    } catch (_) {}
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Konfirmasi Logout'),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Batal'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.danger),
            child: const Text('Keluar'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      final repo = context.read<AuthRepository>();
      await repo.logout();
      if (!mounted) return;
      Navigator.pushAndRemoveUntil(
        context,
        MaterialPageRoute(builder: (context) => const LoginPage()),
        (route) => false,
      );
    }
  }

  void _showEditProfileSheet() {
    final nameCtrl = TextEditingController(text: _user?['name'] ?? '');
    final phoneCtrl = TextEditingController(text: _user?['phone'] ?? '');
    bool isSaving = false;
    String? uploadedPhotoUrl;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            left: 24,
            right: 24,
            top: 12,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Edit Profil', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              // Foto profil
              Center(
                child: GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final image = await picker.pickImage(
                      source: ImageSource.gallery,
                      imageQuality: 60,
                      maxWidth: 600,
                    );
                    if (image == null) return;
                    if (!ctx.mounted) return;
                    final repo = ctx.read<AuthRepository>();
                    try {
                      setSheetState(() => isSaving = true);
                      final url = await repo.uploadProfilePhoto(image.path);
                      setSheetState(() {
                        uploadedPhotoUrl = url;
                        isSaving = false;
                      });
                    } catch (e) {
                      setSheetState(() => isSaving = false);
                      if (ctx.mounted) {
                        ScaffoldMessenger.of(ctx).showSnackBar(
                          SnackBar(content: Text('Gagal upload foto: $e'), backgroundColor: AppColors.danger),
                        );
                      }
                    }
                  },
                  child: Stack(
                    children: [
                      CircleAvatar(
                        radius: 44,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                        backgroundImage: uploadedPhotoUrl != null
                            ? NetworkImage(uploadedPhotoUrl!)
                            : (_user?['photo_url'] != null
                                ? CachedNetworkImageProvider(_user!['photo_url'])
                                : null) as ImageProvider?,
                        child: (uploadedPhotoUrl == null && _user?['photo_url'] == null)
                            ? Text(
                                (_user?['name'] ?? 'K').substring(0, 1).toUpperCase(),
                                style: const TextStyle(fontSize: 32, color: AppColors.primary, fontWeight: FontWeight.bold),
                              )
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                          ),
                          child: isSaving
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                              : const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Nama Lengkap',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Nomor HP',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          setSheetState(() => isSaving = true);
                          try {
                            final repo = context.read<AuthRepository>();
                            await repo.updateProfile(
                              name: nameCtrl.text.trim(),
                              phone: phoneCtrl.text.trim(),
                              photoUrl: uploadedPhotoUrl,
                            );
                            await _fetchProfile();
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Profil berhasil diperbarui ✅'), backgroundColor: AppColors.success),
                              );
                            }
                          } catch (e) {
                            setSheetState(() => isSaving = false);
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: AppColors.danger),
                              );
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Simpan Perubahan', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showChangePasswordSheet() {
    final currentCtrl = TextEditingController();
    final newCtrl = TextEditingController();
    final confirmCtrl = TextEditingController();
    bool isSaving = false;
    bool showCurrent = false;
    bool showNew = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            left: 24,
            right: 24,
            top: 12,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                ),
              ),
              const SizedBox(height: 20),
              const Text('Ubah Password', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              TextField(
                controller: currentCtrl,
                obscureText: !showCurrent,
                decoration: InputDecoration(
                  labelText: 'Password Lama',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(showCurrent ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setSheetState(() => showCurrent = !showCurrent),
                  ),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: newCtrl,
                obscureText: !showNew,
                decoration: InputDecoration(
                  labelText: 'Password Baru (min. 6 karakter)',
                  prefixIcon: const Icon(Icons.lock_reset_outlined),
                  suffixIcon: IconButton(
                    icon: Icon(showNew ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setSheetState(() => showNew = !showNew),
                  ),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: confirmCtrl,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Konfirmasi Password Baru',
                  prefixIcon: const Icon(Icons.check_circle_outline),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: isSaving
                      ? null
                      : () async {
                          if (newCtrl.text != confirmCtrl.text) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(content: Text('Konfirmasi password tidak cocok'), backgroundColor: AppColors.danger),
                            );
                            return;
                          }
                          if (newCtrl.text.length < 6) {
                            ScaffoldMessenger.of(ctx).showSnackBar(
                              const SnackBar(content: Text('Password baru minimal 6 karakter'), backgroundColor: AppColors.danger),
                            );
                            return;
                          }
                          setSheetState(() => isSaving = true);
                          try {
                            final repo = context.read<AuthRepository>();
                            await repo.changePassword(currentCtrl.text, newCtrl.text);
                            if (ctx.mounted) Navigator.pop(ctx);
                            if (mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Password berhasil diubah ✅'), backgroundColor: AppColors.success),
                              );
                            }
                          } catch (e) {
                            setSheetState(() => isSaving = false);
                            if (ctx.mounted) {
                              ScaffoldMessenger.of(ctx).showSnackBar(
                                SnackBar(content: Text(e.toString().replaceAll('Exception: ', '')), backgroundColor: AppColors.danger),
                              );
                            }
                          }
                        },
                  child: isSaving
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Ubah Password', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_error.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: AppColors.danger),
            const SizedBox(height: 16),
            Text(_error, style: const TextStyle(color: AppColors.danger)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => setState(() { _isLoading = true; _error = ''; _fetchProfile(); }),
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      );
    }

    final photoUrl = _user?['photo_url'];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Profil Saya', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: AppColors.primary,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.edit, color: Colors.white),
            tooltip: 'Edit Profil',
            onPressed: _showEditProfileSheet,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const SizedBox(height: 20),
            // Avatar
            GestureDetector(
              onTap: _showEditProfileSheet,
              child: CircleAvatar(
                radius: 52,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                backgroundImage: photoUrl != null
                    ? CachedNetworkImageProvider(photoUrl) as ImageProvider
                    : null,
                child: photoUrl == null
                    ? Text(
                        (_user?['name'] ?? 'K').substring(0, 1).toUpperCase(),
                        style: const TextStyle(fontSize: 40, color: AppColors.primary, fontWeight: FontWeight.bold),
                      )
                    : null,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _user?['name'] ?? '-',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
            ),
            const SizedBox(height: 4),
            Text(_user?['nik'] ?? '-', style: const TextStyle(fontSize: 14, color: AppColors.textSecondary)),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                (_user?['role'] ?? '').toString().replaceAll('_', ' ').toUpperCase(),
                style: const TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 28),
            // Info Card
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                children: [
                  _buildItem(Icons.email_outlined, 'Email', _user?['email'] ?? '-'),
                  const Divider(height: 1, indent: 56),
                  _buildItem(Icons.work_outline, 'Posisi', _user?['position'] ?? '-'),
                  const Divider(height: 1, indent: 56),
                  _buildItem(Icons.business_outlined, 'Cabang', _user?['branch']?['name'] ?? '-'),
                  const Divider(height: 1, indent: 56),
                  _buildItem(Icons.phone_outlined, 'No. HP', _user?['phone'] ?? '-'),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Leave Quota Card
            if (_leaveQuota != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primary, AppColors.primary.withValues(alpha: 0.8)],
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [BoxShadow(color: AppColors.primary.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.event_note, color: Colors.white, size: 20),
                          SizedBox(width: 8),
                          Text('Sisa Cuti Tahunan', style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          _buildQuotaStat('Kuota', '${_leaveQuota!['annual_quota'] ?? 0}', Colors.white70),
                          const SizedBox(width: 16),
                          _buildQuotaStat('Terpakai', '${_leaveQuota!['used_days'] ?? 0}', Colors.orangeAccent),
                          const SizedBox(width: 16),
                          _buildQuotaStat('Sisa', '${_leaveQuota!['remaining_days'] ?? 0}', Colors.white),
                        ],
                      ),
                      if ((_leaveQuota!['year'] ?? 0) != 0)
                        Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Text('Tahun ${_leaveQuota!['year']}', style: const TextStyle(color: Colors.white60, fontSize: 11)),
                        ),
                    ],
                  ),
                ),
              ),
            // Action buttons
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                children: [
                  _buildActionItem(Icons.edit_outlined, 'Edit Profil', 'Ubah nama, no HP, dan foto', AppColors.primary, _showEditProfileSheet),
                  const Divider(height: 1, indent: 56),
                  _buildActionItem(Icons.lock_outline, 'Ubah Password', 'Ganti password akun kamu', AppColors.warning, _showChangePasswordSheet),
                  const Divider(height: 1, indent: 56),
                  _buildDarkModeToggle(),
                ],
              ),
            ),
            const SizedBox(height: 28),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: _handleLogout,
                icon: const Icon(Icons.logout, color: Colors.white),
                label: const Text('Keluar Aplikasi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.danger,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildItem(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: AppColors.primary, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDarkModeToggle() {
    final themeCubit = context.read<ThemeCubit>();
    final isDark = themeCubit.value == ThemeMode.dark;

    return InkWell(
      onTap: themeCubit.toggle,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.textSecondary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isDark ? Icons.light_mode : Icons.dark_mode,
                color: AppColors.textSecondary,
                size: 18,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isDark ? 'Mode Terang' : 'Mode Gelap',
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                  ),
                  Text(
                    isDark ? 'Ganti ke tampilan terang' : 'Ganti ke tampilan gelap',
                    style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Switch(
              value: isDark,
              onChanged: (_) => themeCubit.toggle(),
              activeTrackColor: AppColors.primary.withValues(alpha: 0.5),
              activeThumbColor: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuotaStat(String label, String value, Color color) {
    return Expanded(
      child: Column(
        children: [
          Text(value, style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.bold)),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(color: color.withValues(alpha: 0.7), fontSize: 11)),
        ],
      ),
    );
  }

  Widget _buildActionItem(IconData icon, String title, String subtitle, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                  Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: Colors.grey.shade400, size: 20),
          ],
        ),
      ),
    );
  }
}
