import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/services/notification_service.dart';
import 'core/theme/app_theme.dart';
import 'core/theme/theme_cubit.dart';
import 'core/utils/app_navigator.dart';
import 'presentation/splash/splash_page.dart';
import 'presentation/auth/pages/login_page.dart';
import 'data/repositories/auth_repository.dart';
import 'presentation/auth/bloc/auth_bloc.dart';
import 'core/network/dio_client.dart';
import 'data/datasources/auth_remote_datasource.dart';
import 'data/datasources/attendance_remote_datasource.dart';
import 'data/repositories/attendance_repository.dart';
import 'presentation/home/bloc/attendance_bloc.dart';
import 'data/datasources/leave_remote_datasource.dart';
import 'presentation/leave/bloc/leave_bloc.dart';
import 'data/datasources/overtime_remote_datasource.dart';
import 'presentation/overtime/bloc/overtime_bloc.dart';
import 'data/datasources/admin_remote_datasource.dart';

class SGMHadirApp extends StatefulWidget {
  const SGMHadirApp({super.key});

  @override
  State<SGMHadirApp> createState() => _SGMHadirAppState();
}

class _SGMHadirAppState extends State<SGMHadirApp> {
  final DioClient _dioClient = DioClient();
  final ThemeCubit _themeCubit = ThemeCubit();

  @override
  void initState() {
    super.initState();
    _themeCubit.load();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      NotificationService().initialize(_dioClient.dio);
      NotificationService().checkInitialMessage();
    });
  }

  @override
  void dispose() {
    _themeCubit.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        RepositoryProvider<DioClient>(
          create: (context) => _dioClient,
        ),
        RepositoryProvider<AuthRemoteDataSource>(
          create: (context) => AuthRemoteDataSource(context.read<DioClient>()),
        ),
        RepositoryProvider<AuthRepository>(
          create: (context) => AuthRepository(context.read<AuthRemoteDataSource>()),
        ),
        RepositoryProvider<AttendanceRemoteDataSource>(
          create: (context) => AttendanceRemoteDataSource(context.read<DioClient>()),
        ),
        RepositoryProvider<AttendanceRepository>(
          create: (context) => AttendanceRepository(context.read<AttendanceRemoteDataSource>()),
        ),
        RepositoryProvider<LeaveRemoteDataSource>(
          create: (context) => LeaveRemoteDataSource(context.read<DioClient>()),
        ),
        RepositoryProvider<OvertimeRemoteDataSource>(
          create: (context) => OvertimeRemoteDataSource(context.read<DioClient>()),
        ),
        RepositoryProvider<AdminRemoteDataSource>(
          create: (context) => AdminRemoteDataSource(context.read<DioClient>()),
        ),
        RepositoryProvider<ThemeCubit>(
          create: (context) => _themeCubit,
        ),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider<AuthBloc>(
            create: (context) => AuthBloc(context.read<AuthRepository>()),
          ),
          BlocProvider<AttendanceBloc>(
            create: (context) => AttendanceBloc(context.read<AttendanceRepository>()),
          ),
          BlocProvider<LeaveBloc>(
            create: (context) => LeaveBloc(context.read<LeaveRemoteDataSource>()),
          ),
          BlocProvider<OvertimeBloc>(
            create: (context) => OvertimeBloc(dataSource: context.read<OvertimeRemoteDataSource>()),
          ),
        ],
        child: ValueListenableBuilder<ThemeMode>(
          valueListenable: _themeCubit,
          builder: (context, themeMode, _) {
            return MaterialApp(
              title: 'SGM Hadir',
              debugShowCheckedModeBanner: false,
              theme: AppTheme.lightTheme,
              darkTheme: AppTheme.darkTheme,
              themeMode: themeMode,
              navigatorKey: navigatorKey,
              home: const SplashPage(),
              routes: {
                '/login': (context) => const LoginPage(),
              },
            );
          },
        ),
      ),
    );
  }
}
