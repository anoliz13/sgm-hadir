import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/network/dio_client.dart';
import '../../../data/datasources/admin_remote_datasource.dart';
import '../../../data/repositories/auth_repository.dart';
import '../../auth/pages/login_page.dart';
import '../../profile/pages/profile_page.dart';
import 'admin_dashboard_page.dart';
import 'admin_approval_page.dart';
import 'admin_attendance_today_page.dart';

class AdminHomePage extends StatefulWidget {
  const AdminHomePage({super.key});

  @override
  State<AdminHomePage> createState() => _AdminHomePageState();
}

class _AdminHomePageState extends State<AdminHomePage> {
  int _currentIndex = 0;

  // Tabs refresh tracking for approval badge
  late AdminRemoteDataSource _adminDs;

  @override
  void initState() {
    super.initState();
    _adminDs = AdminRemoteDataSource(context.read<DioClient>());
  }

  void _onTabTap(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final pages = [
      AdminDashboardPage(dataSource: _adminDs),
      AdminApprovalPage(dataSource: _adminDs),
      AdminAttendanceTodayPage(dataSource: _adminDs),
      const ProfilePage(),
    ];

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: _buildAppBar(),
      body: SafeArea(
        child: IndexedStack(
          index: _currentIndex,
          children: pages,
        ),
      ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          BottomNavigationBar(
            currentIndex: _currentIndex,
            onTap: _onTabTap,
            type: BottomNavigationBarType.fixed,
            selectedItemColor: AppColors.primary,
            unselectedItemColor: Colors.grey,
            items: const [
              BottomNavigationBarItem(icon: Icon(Icons.dashboard_rounded), label: 'Dashboard'),
              BottomNavigationBarItem(icon: Icon(Icons.approval_rounded), label: 'Persetujuan'),
              BottomNavigationBarItem(icon: Icon(Icons.today_rounded), label: 'Absensi'),
              BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Profil'),
            ],
          ),
          Container(
            color: Colors.white,
            padding: const EdgeInsets.only(top: 2, bottom: 5),
            child: Text(AppStrings.copyright, textAlign: TextAlign.center, style: TextStyle(fontSize: 9, color: Colors.grey[400])),
          ),
        ],
      ),
    );
  }

  AppBar _buildAppBar() {
    final titles = ['Dashboard Admin', 'Persetujuan', 'Absensi Hari Ini', 'Profil'];
    return AppBar(
      backgroundColor: AppColors.primary,
      elevation: 0,
      title: Text(
        titles[_currentIndex],
        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
      ),
      actions: [
        if (_currentIndex != 3)
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                children: [
                  Icon(Icons.admin_panel_settings_rounded, color: Colors.white, size: 14),
                  SizedBox(width: 4),
                  Text('Admin', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ),
        IconButton(
          icon: const Icon(Icons.logout_rounded, color: Colors.white),
          tooltip: 'Keluar',
          onPressed: () => _confirmLogout(),
        ),
      ],
    );
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Keluar', style: TextStyle(fontWeight: FontWeight.bold)),
        content: const Text('Apakah Anda yakin ingin keluar?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthRepository>().logout();
              if (mounted) {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (_) => const LoginPage()),
                  (_) => false,
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.danger),
            child: const Text('Keluar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}
