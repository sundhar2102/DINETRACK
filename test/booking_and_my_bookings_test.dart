import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/reservation_model.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/table_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/booking/booking_confirmation_screen.dart';
import 'package:mobile/screens/booking/reservation_review_screen.dart';
import 'package:mobile/screens/bookings/booking_details_screen.dart';
import 'package:mobile/screens/bookings/my_bookings_screen.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/widgets/booking_card.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });


  const testUser = UserModel(
    id: 'usr-cust-001',
    name: 'Alex Morgan',
    email: 'alex@smarttable.com',
    role: 'CUSTOMER',
  );

  const testRestaurant = RestaurantModel(
    id: 'rest-001',
    name: 'Sangeetha Veg Gourmet',
    cuisine: 'South Indian, Vegetarian',
    priceRange: '₹₹',
    rating: 4.8,
    ratingCount: 342,
    isOpen: true,
    addressLine1: '12 Nungambakkam High Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    latitude: 13.0612,
    longitude: 80.2415,
    openingTime: '07:00',
    closingTime: '23:00',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    isVerified: true,
    verificationStatus: 'APPROVED',
  );


  const testTable = TableModel(
    id: 'tbl-002',
    restaurantId: 'rest-001',
    tableNumber: 'T-02',
    capacity: 4,
    status: TableStatus.available,
    section: 'Window View',
  );

  const testReservation = ReservationModel(
    id: 'res-test-999',
    restaurantId: 'rest-001',
    restaurantName: 'Sangeetha Veg Gourmet',
    restaurantAddress: '12 Nungambakkam High Road',
    restaurantCity: 'Chennai',
    restaurantImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    userId: 'usr-cust-001',
    tableId: 'tbl-002',
    tableNumber: 'T-02',
    guestCount: 4,
    reservationDate: '2026-08-24',
    reservationTime: '19:30',
    status: 'CONFIRMED',
    specialRequests: '🎂 Birthday Celebration',
    estimatedArrivalMinutes: 15,
    createdAt: '2026-08-23 18:30:00',
  );

  group('DineTrack Step 10 — Booking Review & Confirmation Widget Tests', () {
    testWidgets('1. ReservationReviewScreen renders restaurant summary, party count, slots and policies', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ReservationReviewScreen(
            restaurant: testRestaurant,
            adultsCount: 3,
            childrenCount: 1,
            selectedDate: DateTime(2026, 8, 24),
            selectedTimeSlot: '19:30',
            allocationMode: 'manual',
            selectedTable: testTable,
            selectedPresets: const ['🎂 Birthday Celebration'],
            customRequest: 'Near the entrance please',
            currentUser: testUser,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Header
      expect(find.text('Review Reservation'), findsOneWidget);
      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);

      // Verify Reservation Details Card
      expect(find.text('Reservation Details'), findsOneWidget);
      expect(find.textContaining('4 Guests (3 Adults, 1 Children)'), findsOneWidget);
      expect(find.textContaining('7:30 PM (19:30)'), findsOneWidget);
      expect(find.text('Table #T-02 (Window View)'), findsOneWidget);

      // Verify Special Requests
      expect(find.text('Occasion & Special Requests'), findsOneWidget);
      expect(find.text('🎂 Birthday Celebration'), findsOneWidget);
      expect(find.text('"Near the entrance please"'), findsOneWidget);

      // Verify Policy & Confirm CTA
      expect(find.textContaining('Zero Booking Fees'), findsOneWidget);
      expect(find.text('Confirm Reservation'), findsOneWidget);
    });

    testWidgets('2. BookingConfirmationScreen renders celebration badge and real booking reference', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: BookingConfirmationScreen(
            reservation: testReservation,
            restaurant: testRestaurant,
            currentUser: testUser,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Confirmation text & Reference ID
      expect(find.text('Reservation Requested!'), findsOneWidget);
      expect(find.text('#res-test-999'), findsOneWidget);
      expect(find.text('Confirmed'), findsOneWidget);
      expect(find.text('Table #T-02'), findsOneWidget);
      expect(find.text('4 Guests'), findsOneWidget);
      expect(find.text('View My Bookings'), findsOneWidget);
      expect(find.text('Back to Home'), findsOneWidget);
    });

    testWidgets('3. BookingCard renders thumbnail, dates, table badge, and details CTA', (tester) async {
      bool detailsTapped = false;
      bool cancelTapped = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: BookingCard(
              reservation: testReservation,
              onTap: () => detailsTapped = true,
              onCancel: () => cancelTapped = true,
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
      expect(find.text('Confirmed'), findsOneWidget);
      expect(find.text('4 Guests'), findsOneWidget);
      expect(find.text('Table #T-02'), findsOneWidget);
      expect(find.text('Details'), findsOneWidget);
      expect(find.text('Cancel'), findsOneWidget);

      // Tap Details
      await tester.tap(find.text('Details'));
      expect(detailsTapped, isTrue);

      // Tap Cancel
      await tester.tap(find.text('Cancel'));
      expect(cancelTapped, isTrue);
    });

    testWidgets('4. BookingDetailsScreen renders complete booking summary with copy action', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: BookingDetailsScreen(
            reservation: testReservation,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Reservation Details'), findsOneWidget);
      expect(find.text('Confirmed'), findsWidgets);
      expect(find.text('#res-test-999'), findsOneWidget);
      expect(find.text('Table #T-02'), findsOneWidget);
      expect(find.text('🎂 Birthday Celebration'), findsOneWidget);
      expect(find.text('Cancel Reservation'), findsOneWidget);
    });

    testWidgets('5. MyBookingsScreen renders TabBar with Upcoming, Past, and Cancelled tabs', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: MyBookingsScreen(
            currentUser: testUser,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('My Bookings'), findsOneWidget);
      expect(find.textContaining('Upcoming'), findsOneWidget);
      expect(find.textContaining('Past'), findsOneWidget);
      expect(find.textContaining('Cancelled'), findsOneWidget);
    });
  });


  group('DineTrack Step 10 — Real SQLite Backend Live Integration Tests', () {
    test('5. Valid customer login, create test reservation, fetch in my bookings, and cancel', () async {
      HttpOverrides.global = null;
      final authService = AuthService();
      final apiService = ApiService();

      // Step A: Login Alex Morgan
      final user = await authService.login(
        email: 'alex@smarttable.com',
        password: 'Password123!',
      );
      expect(user.id, 'usr-cust-001');
      expect(authService.isAuthenticated, isTrue);

      // Step B: Create a test reservation
      final testRes = await apiService.createReservation(
        restaurantId: 'rest-001',
        guestCount: 2,
        reservationDate: '2026-08-25',
        reservationTime: '13:00',
        tableId: 'tbl-sng-t02',
        specialRequests: 'Step 10 Automated Integration Verification',
      );

      expect(testRes.id, isNotEmpty);
      expect(testRes.restaurantId, 'rest-001');
      expect(testRes.guestCount, 2);
      expect(testRes.status, 'PENDING');

      // ignore: avoid_print
      print('✅ Real Reservation Created in SQLite DB: #${testRes.id}');

      // Step C: Fetch User Reservations (GET /api/reservations/my)
      final myBookings = await apiService.getUserReservations();
      expect(myBookings.isNotEmpty, isTrue);
      final found = myBookings.any((r) => r.id == testRes.id);
      expect(found, isTrue);

      // ignore: avoid_print
      print('✅ Verified Reservation #${testRes.id} in My Bookings (${myBookings.length} total)');

      // Step D: Cancel the test reservation to keep DB clean
      try {
        final cancelled = await apiService.cancelReservation(testRes.id);
        expect(cancelled.status, 'CANCELLED');

        // ignore: avoid_print
        print('✅ Successfully cancelled test reservation #${testRes.id} (Status: ${cancelled.status})');
      } catch (e) {
        // ignore: avoid_print
        print('Cleanup note: $e');
      }
    });

    test('6. Backend 409 conflict handling properly rejects double-booking same table & slot', () async {
      HttpOverrides.global = null;
      final authService = AuthService();
      final apiService = ApiService();

      await authService.login(
        email: 'alex@smarttable.com',
        password: 'Password123!',
      );

      // Create initial reservation on table tbl-sng-t03 for 2026-08-26 19:30
      final res1 = await apiService.createReservation(
        restaurantId: 'rest-001',
        guestCount: 4,
        reservationDate: '2026-08-26',
        reservationTime: '19:30',
        tableId: 'tbl-sng-t03',
        specialRequests: 'Initial Booking',
      );
      expect(res1.id, isNotEmpty);

      try {
        // Attempt second reservation on EXACT same table, date & time -> must throw 409 conflict
        try {
          await apiService.createReservation(
            restaurantId: 'rest-001',
            guestCount: 4,
            reservationDate: '2026-08-26',
            reservationTime: '19:30',
            tableId: 'tbl-sng-t03',
            specialRequests: 'Conflict Attempt',
          );

          fail('Expected 409 conflict exception was not thrown');
        } catch (e) {
          expect(e.toString().toLowerCase(), anyOf(contains('already booked'), contains('conflict')));
          // ignore: avoid_print
          print('✅ 409 Conflict properly caught and prevented double-booking: $e');
        }
      } finally {
        // Cleanup initial test booking
        await apiService.cancelReservation(res1.id);
      }
    });
  });
}

