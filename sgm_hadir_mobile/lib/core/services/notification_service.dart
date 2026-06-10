import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Top-level background message handler — must be a top-level function
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase already initialized by app startup
  debugPrint('[FCM] Background message: ${message.notification?.title}');
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const _channelId = 'sgm_hadir_channel';
  static const _channelName = 'SGM Hadir Notifikasi';

  /// Call this once after Firebase.initializeApp().
  Future<void> initialize(Dio dio) async {
    await _setupLocalNotifications();
    await _requestPermission();
    await _getAndSendToken(dio);
    _setupMessageHandlers();
  }

  Future<void> _setupLocalNotifications() async {
    const android = AndroidInitializationSettings('@mipmap/ic_launcher');
    const ios = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    await _localNotifications.initialize(
      const InitializationSettings(android: android, iOS: ios),
    );

    const androidChannel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: 'Notifikasi SGM Hadir untuk pengingat absensi dan approval',
      importance: Importance.high,
    );
    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);
  }

  Future<void> _requestPermission() async {
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
  }

  Future<void> _getAndSendToken(Dio dio) async {
    try {
      final token = await _messaging.getToken();
      if (token != null) {
        await _saveAndSendToken(token, dio);
      }

      // Refresh token listener
      _messaging.onTokenRefresh.listen((newToken) async {
        await _saveAndSendToken(newToken, dio);
      });
    } catch (e) {
      debugPrint('[FCM] Failed to get token: $e');
    }
  }

  Future<void> _saveAndSendToken(String token, Dio dio) async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('fcm_token');
    if (savedToken == token) return; // No change

    await prefs.setString('fcm_token', token);

    try {
      await dio.put('/profile/fcm-token', data: jsonEncode({'fcm_token': token}));
      debugPrint('[FCM] Token sent to backend');
    } catch (e) {
      debugPrint('[FCM] Failed to send token: $e');
    }
  }

  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('[FCM] Foreground: ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // App opened from background notification
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('[FCM] Opened from background: ${message.data}');
      _handleNotificationTap(message.data);
    });
  }

  /// Check if app was launched from a terminated-state notification.
  Future<void> checkInitialMessage() async {
    final message = await FirebaseMessaging.instance.getInitialMessage();
    if (message != null) {
      _handleNotificationTap(message.data);
    }
  }

  void _showLocalNotification(RemoteMessage message) {
    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channelId,
          _channelName,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
    );
  }

  void _handleNotificationTap(Map<String, dynamic> data) {
    final type = data['type'] as String?;
    debugPrint('[FCM] Handling tap, type=$type data=$data');
    // Navigation can be handled here using a global navigator key if needed
  }
}
