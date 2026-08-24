import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/reservation_model.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/table_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/owner/auth/owner_login_screen.dart';
import 'package:mobile/screens/owner/dashboard/owner_dashboard_screen.dart';
import 'package:mobile/screens/owner/owner_splash_screen.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/owner_api_service.dart';
import 'package:mobile/services/owner_auth_service.dart';

class MockOwnerApiService extends OwnerApiService {
  final RestaurantModel mockRestaurant;
  final bool shouldThrow;

  MockOwnerApiService({
    required this.mockRestaurant,
    this.shouldThrow = false,
  });

  @override
  Future<RestaurantModel> getOwnerRestaurant(String restaurantId) async {
    if (shouldThrow) throw Exception('Failed to load restaurant details');
    return mockRestaurant;
  }

  @override
  Future<List<ReservationModel>> getRestaurantReservations(String restaurantId, {String? status}) async {
    if (shouldThrow) throw Exception('Failed to load reservations');
    return [];
  }

  @override
  Future<List<TableModel>> getRestaurantTables(String restaurantId) async {
    if (shouldThrow) throw Exception('Failed to load tables');
    return [];
  }

  @override
  Future<Map<String, dynamic>> getRestaurantAnalytics(String restaurantId) async {
    if (shouldThrow) throw Exception('Failed to load analytics');
    return {
      'totalTables': 10,
      'availableTables': 8,
      'occupiedTables': 2,
      'reservedTables': 0,
      'activeReservations': 2,
      'todayRevenue': 12500,
      'todayOrders': 15,
    };
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  const sampleOwner = UserModel(
    id: 'usr-own-001',
    name: 'Sangeetha Ramanathan',
    email: 'owner@sangeetha.com',
    role: 'OWNER',
    restaurantId: 'rest-001',
    restaurantName: 'Sangeetha Veg Gourmet',
  );

  const sampleApprovedRestaurant = RestaurantModel(
    id: 'rest-001',
    name: 'Sangeetha Veg Gourmet',
    cuisine: 'South Indian, Vegetarian',
    priceRange: '₹₹',
    rating: 4.8,
    ratingCount: 340,
    isOpen: true,
    isVerified: true,
    verificationStatus: 'APPROVED',
    addressLine1: '12 Nungambakkam High Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    phone: '+91 44 2827 4444',
  );

  const samplePendingRestaurant = RestaurantModel(
    id: 'rest-007',
    name: 'New Spices Bistro',
    cuisine: 'North Indian',
    priceRange: '₹₹',
    rating: 4.0,
    ratingCount: 10,
    isOpen: false,
    isVerified: false,
    verificationStatus: 'PENDING',
    addressLine1: '45 Anna Salai',
    city: 'Chennai',
    state: 'Tamil Nadu',
  );

  group('DineTrack Step 11 — Restaurant Partner UI Widget Tests', () {
    testWidgets('1. OwnerLoginScreen renders branding, inputs, and validation', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: OwnerLoginScreen(),
        ),
      );

      expect(find.text('Smart Table Partner'), findsOneWidget);
      expect(find.text('Restaurant Owner & Manager Portal'), findsOneWidget);
      expect(find.text('Partner Email / Username'), findsOneWidget);
      expect(find.text('Partner Password'), findsOneWidget);
      expect(find.text('LOGIN TO PARTNER PORTAL'), findsOneWidget);

      // Attempt submit without filling fields
      await tester.tap(find.text('LOGIN TO PARTNER PORTAL'));
      await tester.pumpAndSettle();

      expect(find.text('Please enter your partner email'), findsOneWidget);
    });

    testWidgets('2. OwnerDashboardScreen renders restaurant overview and verified partner banner', (WidgetTester tester) async {
      final mockApi = MockOwnerApiService(mockRestaurant: sampleApprovedRestaurant);

      await tester.pumpWidget(
        MaterialApp(
          home: OwnerDashboardScreen(
            ownerUser: sampleOwner,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Sangeetha Veg Gourmet'), findsWidgets);
      expect(find.text('Partner: Sangeetha Ramanathan'), findsOneWidget);
      expect(find.text('Verified Partner Restaurant'), findsOneWidget);
      expect(find.text('Real-Time Analytics'), findsOneWidget);
      expect(find.text('Active Bookings'), findsOneWidget);
      expect(find.text('Available Tables'), findsOneWidget);
      expect(find.text('Floor Status'), findsOneWidget);
    });

    testWidgets('3. OwnerDashboardScreen displays pending verification warning when unapproved', (WidgetTester tester) async {
      final mockApi = MockOwnerApiService(mockRestaurant: samplePendingRestaurant);

      await tester.pumpWidget(
        MaterialApp(
          home: OwnerDashboardScreen(
            ownerUser: sampleOwner,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Pending Verification'), findsOneWidget);
    });

    testWidgets('4. OwnerDashboardScreen tab switching navigates smoothly across tabs', (WidgetTester tester) async {
      final mockApi = MockOwnerApiService(mockRestaurant: sampleApprovedRestaurant);

      await tester.pumpWidget(
        MaterialApp(
          home: OwnerDashboardScreen(
            ownerUser: sampleOwner,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Reservations Tab
      await tester.tap(find.text('Reservations'));
      await tester.pumpAndSettle();

      expect(find.text('Reservation Manager'), findsOneWidget);

      // Tap Tables Tab
      await tester.tap(find.text('Tables'));
      await tester.pumpAndSettle();

      expect(find.text('Floor & Table Overview'), findsOneWidget);

      // Return to Dashboard
      await tester.tap(find.text('Dashboard'));
      await tester.pumpAndSettle();

      expect(find.text('Real-Time Analytics'), findsOneWidget);
    });

    testWidgets('5. OwnerSplashScreen routes to login screen when unauthenticated', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: OwnerSplashScreen(),
        ),
      );

      expect(find.text('Smart Table Partner'), findsOneWidget);
      await tester.pumpAndSettle(const Duration(seconds: 1));

      expect(find.text('LOGIN TO PARTNER PORTAL'), findsOneWidget);
    });
  });

  group('DineTrack Step 11 — Real SQLite Backend Live Integration Tests', () {
    test('6. Valid restaurant owner login succeeds with real SQLite account (owner@sangeetha.com)', () async {
      HttpOverrides.global = null;
      final ownerAuth = OwnerAuthService();

      final user = await ownerAuth.login(
        email: 'owner@sangeetha.com',
        password: 'Password123!',
      );

      expect(user.id, 'usr-own-001');
      expect(user.name, 'Sangeetha Ramanathan');
      expect(user.role, 'OWNER');
      expect(user.isOwner, isTrue);
      expect(user.isCustomer, isFalse);
      expect(user.restaurantId, 'rest-001');
      expect(user.restaurantName, 'Sangeetha Veg Gourmet');
      expect(ownerAuth.isAuthenticated, isTrue);
      expect(ownerAuth.currentToken, isNotNull);

      // ignore: avoid_print
      print('✅ Real Owner Login Succeeded: ${user.name} -> Restaurant: ${user.restaurantName} (ID: ${user.restaurantId})');
    });

    test('7. Customer account attempting owner login is strictly rejected with unauthorized role error', () async {
      HttpOverrides.global = null;
      final ownerAuth = OwnerAuthService();

      try {
        await ownerAuth.login(
          email: 'alex@smarttable.com',
          password: 'Password123!',
        );
        fail('Customer account should not be permitted in owner portal');
      } catch (e) {
        expect(e.toString(), contains('This account does not have restaurant-owner access.'));
        // ignore: avoid_print
        print('✅ Customer account correctly blocked from Owner portal: $e');
      }
    });

    test('8. Invalid owner password throws descriptive error without crash', () async {
      HttpOverrides.global = null;
      final ownerAuth = OwnerAuthService();

      try {
        await ownerAuth.login(
          email: 'owner@sangeetha.com',
          password: 'WrongPassword999!',
        );
        fail('Expected login failure exception');
      } catch (e) {
        expect(e.toString(), contains('Invalid email or password'));
        // ignore: avoid_print
        print('✅ Invalid Owner Login properly rejected: $e');
      }
    });

    test('9. Owner session restoration reads stored token and keeps owner authenticated', () async {
      HttpOverrides.global = null;
      final ownerAuth = OwnerAuthService();

      // Login to establish session
      await ownerAuth.login(
        email: 'owner@sangeetha.com',
        password: 'Password123!',
      );

      // Restore session
      final restoredUser = await ownerAuth.restoreSession();
      expect(restoredUser, isNotNull);
      expect(restoredUser!.id, 'usr-own-001');
      expect(restoredUser.role, 'OWNER');
      expect(ownerAuth.isAuthenticated, isTrue);

      // ignore: avoid_print
      print('✅ Owner Session Restoration Verified: ${restoredUser.email}');
    });

    test('10. Owner logout clears owner session and does not affect customer session', () async {
      HttpOverrides.global = null;
      final ownerAuth = OwnerAuthService();
      final customerAuth = AuthService();

      // Login customer
      await customerAuth.login(
        email: 'alex@smarttable.com',
        password: 'Password123!',
      );
      expect(customerAuth.isAuthenticated, isTrue);

      // Login owner
      await ownerAuth.login(
        email: 'owner@sangeetha.com',
        password: 'Password123!',
      );
      expect(ownerAuth.isAuthenticated, isTrue);

      // Logout Owner only
      await ownerAuth.logout();
      expect(ownerAuth.isAuthenticated, isFalse);

      // Verify Customer session is completely intact
      expect(customerAuth.isAuthenticated, isTrue);
      expect(customerAuth.currentUser?.id, 'usr-cust-001');

      // ignore: avoid_print
      print('✅ Verified Owner Logout leaves Customer Session intact');
    });

    test('11. OwnerApiService fetches real owner restaurant details with verification status', () async {
      HttpOverrides.global = null;
      final ownerAuth = OwnerAuthService();
      final ownerApi = OwnerApiService();

      await ownerAuth.login(
        email: 'owner@sangeetha.com',
        password: 'Password123!',
      );

      final restaurant = await ownerApi.getOwnerRestaurant('rest-001');
      expect(restaurant.id, 'rest-001');
      expect(restaurant.name, 'Sangeetha Veg Gourmet');
      expect(restaurant.verificationStatus, 'APPROVED');
      expect(restaurant.isApproved, isTrue);
      expect(restaurant.isPending, isFalse);

      // ignore: avoid_print
      print('✅ Real Owner Restaurant Loaded: ${restaurant.name} (Status: ${restaurant.verificationStatus})');
    });
  });
}
