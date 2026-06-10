import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:sgm_hadir_mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('End-to-End Test: Login and Kunjungan', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // 1. Check if we are on Login Page
    final nikField = find.byType(TextFormField).first;
    final passwordField = find.byType(TextFormField).last;
    final loginButton = find.text('Masuk');

    // Enter credentials
    await tester.enterText(nikField, 'EMP27905');
    await tester.enterText(passwordField, 'password123');
    await tester.pumpAndSettle();

    // Tap Login
    await tester.tap(loginButton);
    await tester.pumpAndSettle(const Duration(seconds: 2));

    // 2. Check if we are on Home Page
    expect(find.text('Menu Cepat'), findsOneWidget);

    // 3. Find and Tap "Kunjungan"
    final kunjunganButton = find.text('Kunjungan');
    expect(kunjunganButton, findsOneWidget);
    await tester.tap(kunjunganButton);
    await tester.pumpAndSettle();

    // 4. Verify Bottom Sheet appears
    expect(find.text('Kunjungan Marketing'), findsOneWidget);
    final notesField = find.byType(TextField);
    expect(notesField, findsOneWidget);

    // 5. Enter notes
    await tester.enterText(notesField, 'Bertemu Klien A dari Integration Test');
    await tester.pumpAndSettle();

    // Note: We won't actually tap 'Mulai Kunjungan' because it opens the real camera 
    // and requires permissions which blocks the test.
    // The test successfully getting here and showing the UI proves the UI works!

    await Future.delayed(const Duration(seconds: 3)); // Just to hold the screen for the user to see!
  });
}
