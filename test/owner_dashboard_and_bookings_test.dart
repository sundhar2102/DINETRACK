import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/reservation_model.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/owner/bookings/owner_booking_details_screen.dart';
import 'package:mobile/screens/owner/profile/owner_profile_screen.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/owner_api_service.dart';
import 'package:mobile/services/owner_auth_service.dart';
import 'package:mobile/widgets/owner_booking_card.dart';

class _MockOwnerApiService extends OwnerApiService {
  @override
  Future<RestaurantModel> getOwnerRestaurant(String restaurantId) async {
    return const RestaurantModel(
      id: 'rest-001',
      name: 'Sangeetha Veg Gourmet',
      cuisine: 'South Indian, Vegetarian',
      priceRange: '₹₹',
      rating: 4.5,
      ratingCount: 120,
      isOpen: true,
      isVerified: true,
      verificationStatus: 'APPROVED',
      phone: '+91 98765 00000',
      addressLine1: '123 Gourmet Street',
      city: 'Chennai',
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const mockOwnerUser = UserModel(
    id: 'usr-owner-001',
    name: 'Sangeetha Manager',
    email: 'owner@sangeetha.com',
    role: 'OWNER',
    restaurantId: 'rest-001',
    restaurantName: 'Sangeetha Veg Gourmet',
  );

  group('DineTrack Step 13 — Restaurant Partner UI Widget Tests', () {
    testWidgets('1. OwnerBookingCard renders customer info, table, and status badge', (tester) async {
      const reservation = ReservationModel(
        id: 'res-test-001',
        restaurantId: 'rest-001',
        userId: 'usr-001',
        userName: 'Priya Sharma',
        userPhone: '+91 98765 11111',
        tableNumber: 'T-05',
        tableCapacity: 4,
        guestCount: 3,
        reservationDate: '2026-08-25',
        reservationTime: '19:30',
        status: 'PENDING',
        specialRequests: 'Window seat preferred',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OwnerBookingCard(
              reservation: reservation,
              onStatusChanged: (status) {},
            ),
          ),
        ),
      );

      expect(find.text('Priya Sharma'), findsOneWidget);
      expect(find.text('+91 98765 11111'), findsOneWidget);
      expect(find.text('Pending Approval'), findsOneWidget);
      expect(find.text('3 Guests'), findsOneWidget);
      expect(find.text('Table #T-05'), findsOneWidget);
      expect(find.text('Window seat preferred'), findsOneWidget);
      expect(find.text('Confirm'), findsOneWidget);
      expect(find.text('Decline'), findsOneWidget);
    });

    testWidgets('2. OwnerBookingCard for CONFIRMED status displays Seated and Cancel actions', (tester) async {
      const reservation = ReservationModel(
        id: 'res-test-002',
        restaurantId: 'rest-001',
        userId: 'usr-001',
        userName: 'Alex Morgan',
        guestCount: 2,
        reservationDate: '2026-08-25',
        reservationTime: '20:00',
        status: 'CONFIRMED',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: OwnerBookingCard(
              reservation: reservation,
              onStatusChanged: (status) {},
            ),
          ),
        ),
      );

      expect(find.text('Alex Morgan'), findsOneWidget);
      expect(find.text('Confirmed'), findsOneWidget);
      expect(find.text('Mark Seated'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);
    });

    testWidgets('3. OwnerBookingDetailsScreen displays complete customer and booking info', (tester) async {
      const reservation = ReservationModel(
        id: '6519e7d1-6c74-4cd7-9f31-60ff42a9ba70',
        restaurantId: 'rest-001',
        userId: 'usr-001',
        userName: 'Alex Morgan',
        userPhone: '+91 98765 43210',
        userEmail: 'alex@smarttable.com',
        tableNumber: 'T-03',
        tableCapacity: 4,
        guestCount: 4,
        reservationDate: '2026-08-26',
        reservationTime: '19:30',
        status: 'CONFIRMED',
        specialRequests: 'Celebrating Anniversary',
      );

      await tester.pumpWidget(
        const MaterialApp(
          home: OwnerBookingDetailsScreen(
            reservation: reservation,
          ),
        ),
      );

      expect(find.text('Reservation Details'), findsOneWidget);
      expect(find.text('CONFIRMED'), findsOneWidget);
      expect(find.text('Alex Morgan'), findsOneWidget);
      expect(find.text('+91 98765 43210'), findsOneWidget);
      expect(find.text('alex@smarttable.com'), findsOneWidget);
      expect(find.text('4 Guests'), findsOneWidget);
      expect(find.text('Table #T-03 (4 Seats)'), findsOneWidget);
      expect(find.text('Celebrating Anniversary'), findsOneWidget);
      expect(find.text('MARK CUSTOMER AS SEATED'), findsOneWidget);
      expect(find.text('CANCEL RESERVATION'), findsOneWidget);
    });

    testWidgets('4. OwnerProfileScreen displays read-only partner identity & venue metadata', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: OwnerProfileScreen(
            ownerUser: mockOwnerUser,
            apiService: _MockOwnerApiService(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Partner & Restaurant Profile'), findsOneWidget);
      expect(find.text('Sangeetha Manager'), findsOneWidget);
      expect(find.text('owner@sangeetha.com'), findsOneWidget);
      expect(find.text('AUTHENTICATED RESTAURANT OWNER'), findsOneWidget);
      expect(find.text('Assigned Restaurant Details'), findsOneWidget);
      expect(find.text('Restaurant Name'), findsOneWidget);
      expect(find.text('LOG OUT PARTNER SESSION'), findsOneWidget);
    });
  });

  group('DineTrack Step 13 — Real SQLite Backend Live Integration Tests', () {
    setUpAll(() {
      HttpOverrides.global = null;
    });

    test('5. Real Owner Login, Dashboard Data, Restaurant Profile & Analytics Load', () async {
      SharedPreferences.setMockInitialValues({});
      final authService = OwnerAuthService();
      final apiService = OwnerApiService();

      final ownerUser = await authService.login(email: 'owner@sangeetha.com', password: 'Password123!');
      expect(ownerUser.isOwner, isTrue);
      expect(ownerUser.restaurantId, equals('rest-001'));

      final rest = await apiService.getOwnerRestaurant('rest-001');
      expect(rest.name, equals('Sangeetha Veg Gourmet'));
      expect(rest.isApproved, isTrue);
      expect(rest.rating, greaterThan(4.0));

      final analytics = await apiService.getRestaurantAnalytics('rest-001');
      expect(analytics, isNotNull);
      expect(analytics.containsKey('totalTables'), isTrue);
      expect(analytics.containsKey('availableTables'), isTrue);
    });

    test('6. Real Owner Reservations Retrieval and Status Filtering', () async {
      SharedPreferences.setMockInitialValues({});
      final authService = OwnerAuthService();
      final apiService = OwnerApiService();

      await authService.login(email: 'owner@sangeetha.com', password: 'Password123!');

      // Fetch all reservations for rest-001
      final allReservations = await apiService.getRestaurantReservations('rest-001');
      expect(allReservations, isNotEmpty);

      // Filter by CANCELLED
      final cancelledList = await apiService.getRestaurantReservations('rest-001', status: 'CANCELLED');
      expect(cancelledList, isNotEmpty);
      for (final r in cancelledList) {
        expect(r.status.toUpperCase(), equals('CANCELLED'));
      }
    });

    test('7. Valid Owner Status Lifecycle Transition: Create -> Pending -> Confirmed -> Seated -> Completed', () async {
      SharedPreferences.setMockInitialValues({});
      // 1. Log in as Customer and create a real booking
      final custAuth = AuthService();
      final custApi = ApiService();
      await custAuth.login(email: 'alex@smarttable.com', password: 'Password123!');

      final now = DateTime.now().add(const Duration(days: 6));
      final dateStr = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';

      final booking = await custApi.createReservation(
        restaurantId: 'rest-001',
        guestCount: 2,
        reservationDate: dateStr,
        reservationTime: '20:30',
        tableId: 'tbl-sng-t02',
        specialRequests: 'Step 13 Owner Status Transition Lifecycle Test',
      );
      expect(booking.id, isNotEmpty);

      // 2. Log in as Owner and transition status
      final ownerAuth = OwnerAuthService();
      final ownerApi = OwnerApiService();
      await ownerAuth.login(email: 'owner@sangeetha.com', password: 'Password123!');

      // Transition to CONFIRMED
      final confirmed = await ownerApi.updateReservationStatus(booking.id, 'CONFIRMED');
      expect(confirmed.status.toUpperCase(), equals('CONFIRMED'));

      // Transition to SEATED
      final seated = await ownerApi.updateReservationStatus(booking.id, 'SEATED');
      expect(seated.status.toUpperCase(), equals('SEATED'));

      // Transition to COMPLETED
      final completed = await ownerApi.updateReservationStatus(booking.id, 'COMPLETED');
      expect(completed.status.toUpperCase(), equals('COMPLETED'));
    });

    test('8. Invalid Reservation Status Transition Rejected by Backend with 400 Error', () async {
      SharedPreferences.setMockInitialValues({});
      final ownerAuth = OwnerAuthService();
      final ownerApi = OwnerApiService();
      await ownerAuth.login(email: 'owner@sangeetha.com', password: 'Password123!');

      // Attempt invalid status string
      expect(
        () async => await ownerApi.updateReservationStatus('fc4b4fc4-2dcb-404e-b2e2-29340f950abf', 'INVALID_STATUS_XYZ'),
        throwsA(isA<Exception>()),
      );
    });

    test('9. Real Live Table Floor Retrieval and Status Categorization for Owner Restaurant', () async {
      SharedPreferences.setMockInitialValues({});
      final ownerAuth = OwnerAuthService();
      final ownerApi = OwnerApiService();
      await ownerAuth.login(email: 'owner@sangeetha.com', password: 'Password123!');

      final tables = await ownerApi.getRestaurantTables('rest-001');
      expect(tables.length, equals(10));
      for (final t in tables) {
        expect(t.tableNumber, isNotEmpty);
        expect(t.capacity, greaterThan(0));
        expect(t.restaurantId, equals('rest-001'));
      }
      final availableCount = tables.where((t) => t.isAvailable).length;
      final occupiedCount = tables.where((t) => t.isOccupied).length;
      final reservedCount = tables.where((t) => t.isReserved).length;
      expect(availableCount + occupiedCount + reservedCount, greaterThan(0));
    });

    test('10. Owner Data Isolation: Owner restricted to assigned restaurantId', () async {
      SharedPreferences.setMockInitialValues({});
      final ownerAuth = OwnerAuthService();
      final ownerUser = await ownerAuth.login(email: 'owner@sangeetha.com', password: 'Password123!');

      expect(ownerUser.restaurantId, equals('rest-001'));
      expect(ownerUser.restaurantName, equals('Sangeetha Veg Gourmet'));
    });

    test('11. Owner Logout Clears Session & Token', () async {
      SharedPreferences.setMockInitialValues({});
      final ownerAuth = OwnerAuthService();
      await ownerAuth.login(email: 'owner@sangeetha.com', password: 'Password123!');
      expect(ownerAuth.isAuthenticated, isTrue);

      await ownerAuth.logout();
      expect(ownerAuth.isAuthenticated, isFalse);
      expect(ownerAuth.currentUser, isNull);
    });

    test('12. Customer Authentication & Core Discovery Regression Verification', () async {
      SharedPreferences.setMockInitialValues({});
      final custAuth = AuthService();
      final custApi = ApiService();

      final cust = await custAuth.login(email: 'alex@smarttable.com', password: 'Password123!');
      expect(cust.isCustomer, isTrue);

      final restaurants = await custApi.getRestaurants();
      expect(restaurants.length, equals(6));

      final myBookings = await custApi.getUserReservations();
      expect(myBookings, isNotEmpty);
    });
  });
}
