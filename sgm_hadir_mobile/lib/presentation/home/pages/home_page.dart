import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';
import '../bloc/attendance_bloc.dart';
import '../bloc/attendance_event.dart';
import '../bloc/attendance_state.dart';
import '../../leave/pages/leave_page.dart';
import '../../qr/qr_scanner_screen.dart';
import '../../leave/bloc/leave_bloc.dart';
import '../../leave/bloc/leave_event.dart';
import '../../overtime/pages/overtime_page.dart';
import '../../overtime/bloc/overtime_bloc.dart';
import '../../overtime/bloc/overtime_event.dart';
import '../../history/pages/history_page.dart';
import '../../profile/pages/profile_page.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../../data/repositories/attendance_repository.dart';
import '../../../data/models/shift_model.dart';
import '../../../data/datasources/shift_remote_datasource.dart';

/// Home Page - Halaman utama dengan tombol CHECK-IN besar
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> with TickerProviderStateMixin, WidgetsBindingObserver {
  int _currentIndex = 0;
  bool _isCheckedIn = false;
  bool _isVisitActive = false; // true = visit_in sudah dilakukan, visit_out belum
  bool _isFetchingLocation = false;
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  Map<String, dynamic>? _user;
  Map<String, dynamic>? _stats;
  ShiftModel? _shift;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.08).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Fetch today's status
    context.read<AttendanceBloc>().add(FetchTodayStatus());
    _fetchDashboardData();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      context.read<AttendanceBloc>().add(FetchTodayStatus());
      if (_currentIndex == 2) {
        context.read<LeaveBloc>().add(FetchLeaves());
      } else if (_currentIndex == 3) {
        context.read<OvertimeBloc>().add(LoadOvertimes());
      }
    }
  }

  Future<void> _fetchDashboardData() async {
    try {
      final authRepo = context.read<AuthRepository>();
      final attendanceRepo = context.read<AttendanceRepository>();
      final user = await authRepo.getProfile();
      final stats = await attendanceRepo.getDashboardStats();
      if (mounted) {
        setState(() {
          _user = user;
          _stats = stats;
        });
      }
    } catch (e) {
      // ignore
    }
    try {
      final shift = await ShiftRemoteDataSource.fetchMyShift();
      if (mounted) setState(() => _shift = shift);
    } catch (_) {}
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: [
            _buildHomeTab(),
            const HistoryPage(),
            _buildLeaveTab(),
            const OvertimePage(),
            _buildProfileTab(),
          ],
        ),
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            decoration: BoxDecoration(
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) {
                if (index == 2 && _currentIndex != 2) {
                  context.read<LeaveBloc>().add(FetchLeaves());
                } else if (index == 3 && _currentIndex != 3) {
                  context.read<OvertimeBloc>().add(LoadOvertimes());
                }
                setState(() => _currentIndex = index);
              },
              items: const [
                BottomNavigationBarItem(
                  icon: Icon(Icons.home_rounded),
                  label: 'Beranda',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.calendar_month_rounded),
                  label: 'Riwayat',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.description_rounded),
                  label: 'Izin',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.access_time_filled),
                  label: 'Lembur',
                ),
                BottomNavigationBarItem(
                  icon: Icon(Icons.person_rounded),
                  label: 'Profil',
                ),
              ],
            ),
          ),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.only(top: 3, bottom: 6),
            child: Text(
              'copyright Imam Nur v.01',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 9,
                color: Colors.grey[400],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeTab() {
    return SingleChildScrollView(
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
            decoration: const BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(28),
                bottomRight: Radius.circular(28),
              ),
            ),
            child: Column(
              children: [
                // User info row
                Row(
                  children: [
                    // Avatar
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                        color: Colors.white.withValues(alpha: 0.15),
                      ),
                      child: Center(
                        child: Text(
                          _user != null && _user!['name'] != null && _user!['name'].toString().isNotEmpty
                              ? _user!['name'].toString().substring(0, 1).toUpperCase()
                              : '-',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    // Name & position
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Selamat Pagi! 👋',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            _user?['name'] ?? 'Loading...',
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            '${_user?['position'] ?? 'Posisi'} • ${_user?['branch']?['name'] ?? 'Cabang'}',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Notification bell
                    IconButton(
                      onPressed: () {},
                      icon: const Icon(
                        Icons.notifications_outlined,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Today's status card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Status Hari Ini',
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.7),
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: _isCheckedIn
                                        ? AppColors.success.withValues(alpha: 0.2)
                                        : Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    _isCheckedIn ? '✅ Sudah Check-in' : '⏳ Belum Check-in',
                                    style: TextStyle(
                                      color: _isCheckedIn
                                          ? AppColors.accentLight
                                          : Colors.white70,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            'Sisa Cuti',
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 11,
                            ),
                          ),
                          Text(
                            '${_stats?['leave_quota'] ?? 0} hari',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // CHECK-IN Button (BESAR, MENONJOL, DI TENGAH)
          Center(
            child: Column(
              children: [
                Text(
                  _isCheckedIn ? 'Jam Masuk: 07:55 WIB' : 'Tap untuk check-in',
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                
                ScaleTransition(
                  scale: _isCheckedIn ? const AlwaysStoppedAnimation(1.0) : _pulseAnimation,
                  child: BlocConsumer<AttendanceBloc, AttendanceState>(
                    listener: (context, state) {
                      if (state is AttendanceStatusLoaded) {
                        setState(() {
                          _isCheckedIn = state.statusData['is_checked_in'] == true && state.statusData['is_checked_out'] == false;
                          _isVisitActive = state.statusData['is_visit_active'] == true;
                        });
                      } else if (state is AttendanceSuccess) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(state.isCheckIn
                                ? 'Check-in berhasil!'
                                : 'Check-out berhasil!'),
                            backgroundColor: AppColors.success,
                          ),
                        );
                        // Refresh status dari server agar tombol mencerminkan
                        // kondisi nyata, bukan asumsi dari tipe event.
                        // Ini mencegah visit_in secara salah mengubah tombol
                        // utama menjadi CHECK-OUT.
                        context.read<AttendanceBloc>().add(FetchTodayStatus());
                        _fetchDashboardData();
                      } else if (state is AttendanceError) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(state.message),
                            backgroundColor: AppColors.danger,
                          ),
                        );
                      }
                    },
                    builder: (context, state) {
                      final isLoading = state is AttendanceLoading || _isFetchingLocation;

                      // Also disable if already checked out
                      bool isAlreadyCheckedOut = false;
                      if (state is AttendanceStatusLoaded) {
                        isAlreadyCheckedOut = state.statusData['is_checked_out'] == true;
                      }

                      return GestureDetector(
                        onTap: (isLoading || isAlreadyCheckedOut) ? null : () => _handleAttendance(context),
                        child: Container(
                          width: 160,
                          height: 160,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: _isCheckedIn
                                ? const LinearGradient(
                                    colors: [Color(0xFF3B82F6), Color(0xFF2563EB)],
                                  )
                                : AppColors.checkInGradient,
                            boxShadow: [
                              BoxShadow(
                                color: (_isCheckedIn ? AppColors.primary : AppColors.accent)
                                    .withValues(alpha: 0.35),
                                blurRadius: 25,
                                offset: const Offset(0, 8),
                              ),
                            ],
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              isLoading
                                  ? const CircularProgressIndicator(color: Colors.white)
                                  : isAlreadyCheckedOut
                                      ? const Icon(Icons.check_circle, color: Colors.white, size: 48)
                                      : Column(
                                          children: [
                                            Icon(
                                              _isCheckedIn
                                                  ? Icons.logout_rounded
                                                  : Icons.fingerprint_rounded,
                                              color: Colors.white,
                                              size: 48,
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              _isCheckedIn ? 'CHECK-OUT' : 'CHECK-IN',
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.bold,
                                                fontSize: 18,
                                                letterSpacing: 1.5,
                                              ),
                                            ),
                                          ],
                                        ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                
                const SizedBox(height: 16),
                Text(
                  DateTime.now().toString().substring(0, 16),
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                  ),
                ),

                const SizedBox(height: 12),
                // QR Scan alternative
                TextButton.icon(
                  onPressed: _handleQRCheckIn,
                  icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
                  label: const Text('Scan QR untuk absen alternatif'),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    textStyle: const TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Shift Info Banner
          if (_shift != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withValues(alpha: 0.15)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.schedule, color: AppColors.primary, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      _shift!.name,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                    const Spacer(),
                    Text(
                      '${_shift!.startTime} – ${_shift!.endTime}',
                      style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ),

          const SizedBox(height: 24),

          // Menu Cepat (Quick Actions)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Menu Cepat',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildQuickAction(
                      icon: Icons.map_outlined,
                      label: 'Kunjungan',
                      color: Colors.blue,
                      onTap: () => _showVisitBottomSheet(context),
                    ),
                    _buildQuickAction(
                      icon: Icons.description_outlined,
                      label: 'Ajukan Izin',
                      color: AppColors.statusIzin,
                      onTap: () => setState(() => _currentIndex = 2),
                    ),
                    _buildQuickAction(
                      icon: Icons.access_time,
                      label: 'Lembur',
                      color: AppColors.statusLembur,
                      onTap: () => setState(() => _currentIndex = 3),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),

          // Quick Stats
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildQuickStat('Hadir', '${_stats?['hadir'] ?? 0}', AppColors.statusHadir),
                const SizedBox(width: 12),
                _buildQuickStat('Terlambat', '${_stats?['terlambat'] ?? 0}', AppColors.statusTerlambat),
                const SizedBox(width: 12),
                _buildQuickStat('Izin', '${_stats?['izin'] ?? 0}', AppColors.statusIzin),
                const SizedBox(width: 12),
                _buildQuickStat('Lembur', '${_stats?['lembur'] ?? 0}', AppColors.statusLembur),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // Leaderboard
          _buildLeaderboard(),

          const SizedBox(height: 24),

          // Recent Activity
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Aktivitas Terakhir',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                _buildActivityItem(
                  'Check-in',
                  'Hari ini, 07:55 WIB',
                  Icons.login_rounded,
                  AppColors.success,
                ),
                _buildActivityItem(
                  'Check-out',
                  'Kemarin, 17:05 WIB',
                  Icons.logout_rounded,
                  AppColors.info,
                ),
                _buildActivityItem(
                  'Check-in',
                  'Kemarin, 08:02 WIB',
                  Icons.login_rounded,
                  AppColors.warning,
                  subtitle: 'Terlambat 2 menit',
                ),
              ],
            ),
          ),

          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildQuickStat(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: AppColors.textSecondary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(
    String title,
    String time,
    IconData icon,
    Color color, {
    String? subtitle,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                    color: AppColors.textPrimary,
                  ),
                ),
                if (subtitle != null)
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 11,
                      color: color,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
              ],
            ),
          ),
          Text(
            time,
            style: const TextStyle(
              fontSize: 11,
              color: AppColors.textMuted,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboard() {
    final ontime = (_stats?['leaderboard_ontime'] as List<dynamic>?) ?? [];
    final late = (_stats?['leaderboard_late'] as List<dynamic>?) ?? [];

    if (ontime.isEmpty && late.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Peringkat',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary),
          ),
          const SizedBox(height: 12),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildLeaderboardCard('Paling Tepat Waktu', ontime, AppColors.success, 'on_time_count')),
              const SizedBox(width: 12),
              Expanded(child: _buildLeaderboardCard('Paling Terlambat', late, AppColors.danger, 'late_count')),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLeaderboardCard(String title, List<dynamic> items, Color color, String countKey) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Text(title,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
            ),
          ),
          const SizedBox(height: 10),
          if (items.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Center(child: Text('Belum ada data', style: TextStyle(fontSize: 11, color: AppColors.textMuted))),
            )
          else
            ...List.generate(items.length > 5 ? 5 : items.length, (i) {
              final item = items[i] as Map<String, dynamic>;
              final isFirst = i == 0;
              return Padding(
                padding: EdgeInsets.only(top: i == 0 ? 0 : 8),
                child: Row(
                  children: [
                    Container(
                      width: 22, height: 22,
                      decoration: BoxDecoration(
                        color: isFirst ? color.withValues(alpha: 0.15) : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Center(
                        child: Text('${i + 1}', style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.bold,
                          color: isFirst ? color : AppColors.textSecondary,
                        )),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('${item['name'] ?? '-'}', style: const TextStyle(
                        fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textPrimary,
                      ), overflow: TextOverflow.ellipsis),
                    ),
                    Text('${item[countKey] ?? 0}x', style: TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w700, color: color,
                    )),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _buildLeaveTab() {
    return const LeavePage();
  }

  Widget _buildProfileTab() {
    return const ProfilePage();
  }

  Future<void> _handleAttendance(BuildContext context) async {
    if (_isFetchingLocation) return;
    
    setState(() {
      _isFetchingLocation = true;
    });

    try {
      debugPrint('[CHECK-IN] Starting attendance flow...');

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Aktifkan GPS (Location Services) terlebih dahulu.')),
          );
        }
        setState(() => _isFetchingLocation = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Izin lokasi ditolak.')),
            );
          }
          setState(() => _isFetchingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Izin lokasi diblokir permanen. Silakan atur di Pengaturan HP.')),
          );
        }
        setState(() => _isFetchingLocation = false);
        return;
      }

      debugPrint('[CHECK-IN] Getting GPS position...');
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: Duration(seconds: 8),
          ),
        );
      } catch (_) {
        position = await Geolocator.getLastKnownPosition();
      }
      if (position == null) {
        throw Exception('Tidak dapat mendapatkan lokasi GPS. Pastikan GPS aktif.');
      }
      debugPrint('[CHECK-IN] Got position: ${position.latitude}, ${position.longitude}');

      setState(() => _isFetchingLocation = false);

      if (!context.mounted) return;

      if (_isCheckedIn) {
        debugPrint('[CHECK-OUT] Dispatching check-out event...');
        context.read<AttendanceBloc>().add(SubmitCheckOut(
              latitude: position.latitude,
              longitude: position.longitude,
            ));
      } else {
        debugPrint('[CHECK-IN] Opening camera for selfie...');
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(
          source: ImageSource.camera,
          preferredCameraDevice: CameraDevice.front,
          imageQuality: 25,
          maxWidth: 800,
          maxHeight: 800,
        );

        if (image == null) {
          debugPrint('[CHECK-IN] User cancelled selfie.');
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Anda harus mengambil foto selfie untuk check-in.')),
            );
          }
          return;
        }

        debugPrint('[CHECK-IN] Selfie captured: ${image.path}');
        if (!context.mounted) return;

        context.read<AttendanceBloc>().add(SubmitCheckIn(
              latitude: position.latitude,
              longitude: position.longitude,
              imagePath: image.path,
            ));
      }
    } catch (e, stackTrace) {
      setState(() => _isFetchingLocation = false);
      debugPrint('[CHECK-IN] ERROR: $e');
      debugPrint('[CHECK-IN] STACK: $stackTrace');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  color.withValues(alpha: 0.2),
                  color.withValues(alpha: 0.05),
                ],
              ),
              shape: BoxShape.circle,
              border: Border.all(color: color.withValues(alpha: 0.3), width: 1.5),
              boxShadow: [
                BoxShadow(
                  color: color.withValues(alpha: 0.15),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  void _showVisitBottomSheet(BuildContext context) {
    final notesController = TextEditingController();
    final isVisitActive = _isVisitActive;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
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
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      isVisitActive ? Icons.location_off_outlined : Icons.map_outlined,
                      color: isVisitActive ? Colors.orange : Colors.blue,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Kunjungan Marketing',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        isVisitActive ? '🟠 Kunjungan sedang berlangsung' : '⚪ Belum ada kunjungan aktif',
                        style: TextStyle(
                          fontSize: 12,
                          color: isVisitActive ? Colors.orange : AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                isVisitActive ? 'Catatan Selesai Kunjungan' : 'Catatan / Tujuan Kunjungan',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notesController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: isVisitActive
                      ? 'Cth: Kunjungan selesai, kontrak ditandatangani...'
                      : 'Cth: Bertemu Klien A di Sudirman...',
                  hintStyle: TextStyle(color: Colors.grey.shade400),
                  filled: true,
                  fillColor: Colors.grey.shade50,
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(color: Colors.grey.shade200, width: 1.5),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide(
                      color: isVisitActive ? Colors.orange : AppColors.primary,
                      width: 2,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              // Tampilkan tombol sesuai status kunjungan:
              // - Belum ada kunjungan aktif → hanya "Mulai Kunjungan"
              // - Kunjungan sedang aktif → hanya "Selesai Kunjungan"
              SizedBox(
                width: double.infinity,
                child: isVisitActive
                    ? ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        icon: const Icon(Icons.stop_circle_outlined, color: Colors.white),
                        label: const Text(
                          'Selesai Kunjungan',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _handleVisitAttendance(context, isCheckIn: false, notes: notesController.text);
                        },
                      )
                    : ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                        ),
                        icon: const Icon(Icons.play_circle_outline, color: Colors.white),
                        label: const Text(
                          'Mulai Kunjungan',
                          style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          _handleVisitAttendance(context, isCheckIn: true, notes: notesController.text);
                        },
                      ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleVisitAttendance(BuildContext context, {required bool isCheckIn, required String notes}) async {
    try {
      if (notes.trim().isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Catatan kunjungan wajib diisi!')),
        );
        return;
      }

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Aktifkan GPS terlebih dahulu.')),
          );
        }
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) return;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
      );

      if (!context.mounted) return;

      if (!isCheckIn) {
        context.read<AttendanceBloc>().add(SubmitCheckOut(
              latitude: position.latitude,
              longitude: position.longitude,
              type: 'visit_out',
              notes: notes,
            ));
      } else {
        final ImagePicker picker = ImagePicker();
        final XFile? image = await picker.pickImage(
          source: ImageSource.camera,
          preferredCameraDevice: CameraDevice.front,
          imageQuality: 25,
          maxWidth: 800,
          maxHeight: 800,
        );

        if (image == null) return;
        if (!context.mounted) return;

        context.read<AttendanceBloc>().add(SubmitCheckIn(
              latitude: position.latitude,
              longitude: position.longitude,
              imagePath: image.path,
              type: 'visit_in',
              notes: notes,
            ));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  Future<void> _handleQRCheckIn() async {
    final navigator = Navigator.of(context);
    final scaffold = ScaffoldMessenger.of(context);
    final attendanceBloc = context.read<AttendanceBloc>();

    final result = await navigator.push<Map<String, String>>(
      MaterialPageRoute(builder: (_) => const QRScannerScreen()),
    );
    if (result == null || !mounted) return;

    final branchId = result['branch_id'] ?? '';

    if (mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (_) => const Center(child: CircularProgressIndicator()),
      );
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: Duration(seconds: 8),
        ),
      );

      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
        imageQuality: 25,
        maxWidth: 800,
        maxHeight: 800,
      );

      if (!mounted) return;
      Navigator.of(context, rootNavigator: true).pop();

      if (image == null) {
        scaffold.showSnackBar(
          const SnackBar(content: Text('Anda harus mengambil foto selfie untuk check-in.')),
        );
        return;
      }

      if (!mounted) return;
      attendanceBloc.add(SubmitCheckIn(
        latitude: position.latitude,
        longitude: position.longitude,
        imagePath: image.path,
        type: 'qr_check_in',
        notes: 'QR: $branchId',
      ));
    } catch (e) {
      if (mounted) Navigator.of(context, rootNavigator: true).pop();
      if (mounted) {
        scaffold.showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }
}
