import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/services/auth_service.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('DineTrack Customer Authentication Integration Tests', () {
    test('1. Valid customer login with real SQLite account (alex@smarttable.com)', () async {
      final authService = AuthService();
      final user = await authService.login(
        email: 'alex@smarttable.com',
        password: 'Password123!',
      );

      expect(user.id, 'usr-cust-001');
      expect(user.name, 'Alex Morgan');
      expect(user.email, 'alex@smarttable.com');
      expect(user.role, 'CUSTOMER');
      expect(user.isCustomer, isTrue);
      expect(authService.isAuthenticated, isTrue);
      expect(authService.currentToken, isNotNull);

      // ignore: avoid_print
      print('✅ Real Customer Login Succeeded: ${user.name} (${user.email}) - Role: ${user.role}');
    });

    test('2. Invalid customer login throws descriptive error without crash', () async {
      final authService = AuthService();
      expect(
        () async => await authService.login(
          email: 'invalid_user@smarttable.com',
          password: 'WrongPassword999!',
        ),
        throwsA(isA<Exception>()),
      );
      expect(authService.isAuthenticated, isFalse);
      // ignore: avoid_print
      print('✅ Invalid Login properly rejected by SQLite backend');
    });

    test('3. New customer signup registers cleanly in real backend', () async {
      final authService = AuthService();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final testEmail = 'diner_$timestamp@testdinetrack.com';

      final user = await authService.signup(
        name: 'Test Diner',
        email: testEmail,
        phone: '+91 9988776655',
        password: 'Password123!',
      );

      expect(user.name, 'Test Diner');
      expect(user.email, testEmail);
      expect(user.role, 'CUSTOMER');
      expect(authService.isAuthenticated, isTrue);

      // ignore: avoid_print
      print('✅ New Customer Registered: ${user.name} (${user.email})');
    });

    test('4. Session restoration reads stored token & user data', () async {
      final authService = AuthService();
      
      // Perform login to populate storage
      await authService.login(
        email: 'priya@smarttable.com',
        password: 'Password123!',
      );

      // Restore in fresh instance with same storage
      final restoredService = AuthService();
      final restoredUser = await restoredService.restoreSession();

      expect(restoredUser, isNotNull);
      expect(restoredUser!.email, 'priya@smarttable.com');
      expect(restoredUser.name, 'Priya Sharma');
      expect(restoredService.isAuthenticated, isTrue);

      // ignore: avoid_print
      print('✅ Session Restoration Verified for ${restoredUser.name}');
    });

    test('5. Logout properly clears session and tokens', () async {
      final authService = AuthService();
      await authService.login(
        email: 'alex@smarttable.com',
        password: 'Password123!',
      );
      expect(authService.isAuthenticated, isTrue);

      await authService.logout();
      expect(authService.isAuthenticated, isFalse);
      expect(authService.currentToken, isNull);
      expect(authService.currentUser, isNull);

      // ignore: avoid_print
      print('✅ Logout Cleared Session Verified');
    });
  });
}
