import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/availability_model.dart';
import 'package:mobile/models/menu_category_model.dart';
import 'package:mobile/models/reservation_model.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/table_model.dart';
import 'package:mobile/models/time_slot_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/booking/reservation_screen.dart';
import 'package:mobile/screens/restaurant/restaurant_details_screen.dart';
import 'package:mobile/services/api_service.dart';

class MockReservationApiService extends ApiService {
  final List<TableModel> mockTables;
  final AvailabilityModel mockAvailability;
  final bool shouldThrow;
  int reservationCallCount = 0;

  MockReservationApiService({
    this.mockTables = const [],
    this.mockAvailability = const AvailabilityModel(
      restaurantId: 'rest-001',
      partySize: 2,
      totalTables: 10,
      availableTablesCount: 8,
      occupiedTablesCount: 2,
      estimatedWaitTime: 0,
      crowdLevel: 'LOW',
    ),
    this.shouldThrow = false,
  });

  @override
  Future<List<TableModel>> getTablesByRestaurantId(String restaurantId) async {
    if (shouldThrow) throw Exception('Failed to load tables');
    return mockTables;
  }

  @override
  Future<AvailabilityModel> getWaitTimeAndAvailability(String restaurantId, {int partySize = 2}) async {
    if (shouldThrow) throw Exception('Failed to load wait time');
    return mockAvailability;
  }

  @override
  Future<ReservationModel> createReservation({
    required String restaurantId,
    required int guestCount,
    required String reservationDate,
    required String reservationTime,
    String? tableId,
    String? specialRequests,
    int? estimatedArrivalMinutes,
    List<Map<String, dynamic>>? preOrderItems,
    String? paymentMethod,
  }) async {
    reservationCallCount++;
    if (shouldThrow) throw Exception('Table reservation failed');
    return ReservationModel(
      id: 'res-test-999',
      restaurantId: restaurantId,
      restaurantName: 'Sangeetha Veg Gourmet',
      userId: 'usr-cust-001',
      tableId: tableId,
      tableNumber: tableId != null ? 'T-02' : 'Auto',
      guestCount: guestCount,
      reservationDate: reservationDate,
      reservationTime: reservationTime,
      specialRequests: specialRequests,
      status: 'PENDING',
    );
  }

  @override
  Future<RestaurantModel> getRestaurantById(String id, {double? lat, double? lng}) async {
    return sampleRestaurantForBooking;
  }

  @override
  Future<List<MenuCategoryModel>> getMenuByRestaurant(String restaurantId) async {
    return [];
  }
}

const sampleTable1 = TableModel(
  id: 'tbl-sng-t01',
  restaurantId: 'rest-001',
  tableNumber: 'T-01',
  capacity: 2,
  section: 'Main Dining',
  status: TableStatus.reserved,
);

const sampleTable2 = TableModel(
  id: 'tbl-sng-t02',
  restaurantId: 'rest-001',
  tableNumber: 'T-02',
  capacity: 4,
  section: 'Window Booth',
  status: TableStatus.available,
);

const sampleTable3 = TableModel(
  id: 'tbl-sng-t03',
  restaurantId: 'rest-001',
  tableNumber: 'T-03',
  capacity: 6,
  section: 'Family Zone',
  status: TableStatus.available,
);

const sampleRestaurantForBooking = RestaurantModel(
  id: 'rest-001',
  name: 'Sangeetha Veg Gourmet',
  description: 'Fine vegetarian dining with classic South Indian dishes.',
  cuisine: 'South Indian, Vegetarian',
  priceRange: '₹₹',
  rating: 4.8,
  ratingCount: 342,
  phone: '+91 44 2827 4444',
  email: 'sangeetha.gourmet@smarttable.com',
  isOpen: true,
  isVerified: true,
  verificationStatus: 'APPROVED',
  openingTime: '07:00',
  closingTime: '23:00',
  addressLine1: '12 Nungambakkam High Road',
  city: 'Chennai',
  state: 'Tamil Nadu',
  availableTablesCount: 8,
  crowdLevel: 'LOW',
);

const testCustomerUser = UserModel(
  id: 'usr-cust-001',
  name: 'Alex Morgan',
  email: 'alex@smarttable.com',
  role: 'CUSTOMER',
);

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({
      'smarttable_token': 'test_mock_jwt_token',
      'smarttable_user': '{"id":"usr-cust-001","name":"Alex Morgan","email":"alex@smarttable.com","role":"CUSTOMER"}',
    });
  });

  group('Table, Availability, and Reservation Model Tests', () {
    test('TableModel parses statuses, colors, and capabilities accurately', () {
      expect(sampleTable1.isAvailable, isFalse);
      expect(sampleTable1.status.label, 'Reserved');
      expect(sampleTable2.isAvailable, isTrue);
      expect(sampleTable2.status.label, 'Available');
      expect(sampleTable2.capacity, 4);

      final jsonMap = {
        'id': 'tbl-100',
        'restaurant_id': 'rest-001',
        'table_number': 'T-09',
        'capacity': 8,
        'section': 'Terrace Lounge',
        'status': 'AVAILABLE',
      };
      final tbl = TableModel.fromJson(jsonMap);
      expect(tbl.tableNumber, 'T-09');
      expect(tbl.capacity, 8);
      expect(tbl.section, 'Terrace Lounge');
      expect(tbl.status, TableStatus.available);
      expect(tbl.isAvailable, isTrue);
    });

    test('AvailabilityModel parses capacity metrics and formats wait times', () {
      const avail = AvailabilityModel(
        restaurantId: 'rest-001',
        partySize: 4,
        totalTables: 12,
        availableTablesCount: 9,
        occupiedTablesCount: 3,
        estimatedWaitTime: 0,
        crowdLevel: 'LOW',
      );

      expect(avail.hasImmediateTable, isTrue);
      expect(avail.isClosed, isFalse);
      expect(avail.formattedStatus, 'Immediate Seating Available');

      const closedAvail = AvailabilityModel(
        restaurantId: 'rest-001',
        partySize: 2,
        confidence: 'CLOSED',
        crowdLevel: 'CLOSED',
      );
      expect(closedAvail.isClosed, isTrue);
      expect(closedAvail.formattedStatus, 'Restaurant Closed');
    });

    test('TimeSlotModel formats AM/PM times correctly for Lunch and Dinner', () {
      const lunchSlot = TimeSlotModel(time: '12:30', period: SlotPeriod.lunch);
      expect(lunchSlot.formattedDisplay, '12:30 PM');
      expect(lunchSlot.period.label, 'Lunch Slots');

      const dinnerSlot = TimeSlotModel(time: '20:00', period: SlotPeriod.dinner);
      expect(dinnerSlot.formattedDisplay, '8:00 PM');
      expect(dinnerSlot.period.label, 'Dinner Slots');

      final allSlots = TimeSlotModel.getStandardSlots();
      expect(allSlots.length, 13);
      expect(allSlots.where((s) => s.period == SlotPeriod.lunch).length, 6);
      expect(allSlots.where((s) => s.period == SlotPeriod.dinner).length, 7);
    });

    test('ReservationModel handles serialization and status helpers', () {
      const res = ReservationModel(
        id: 'res-001',
        restaurantId: 'rest-001',
        restaurantName: 'Sangeetha Veg Gourmet',
        userId: 'usr-cust-001',
        guestCount: 4,
        reservationDate: '2026-08-24',
        reservationTime: '19:30',
        status: 'PENDING',
      );

      expect(res.isPending, isTrue);
      expect(res.isConfirmed, isFalse);
      expect(res.isCancelled, isFalse);

      final json = res.toJson();
      expect(json['guest_count'], 4);
      expect(json['reservation_time'], '19:30');
    });
  });

  group('Live SQLite Backend Table & Availability Integration', () {
    test('ApiService.getTablesByRestaurantId fetches real SQLite tables for rest-001', () async {
      HttpOverrides.global = null;
      final apiService = ApiService();
      final tables = await apiService.getTablesByRestaurantId('rest-001');

      expect(tables, isNotEmpty);
      expect(tables.length, greaterThanOrEqualTo(6));
      final firstTable = tables.first;
      expect(firstTable.restaurantId, 'rest-001');
      expect(firstTable.tableNumber, isNotEmpty);
      expect(firstTable.capacity, greaterThan(0));

      debugPrint('✅ Verified Real Tables from SQLite DB (${tables.length} tables found):');
      for (final t in tables.take(5)) {
        debugPrint('   • Table #${t.tableNumber} (${t.capacity} seats, ${t.section}) - Status: ${t.status.label}');
      }
    });

    test('ApiService.getWaitTimeAndAvailability fetches real algorithmic wait time & tables', () async {
      HttpOverrides.global = null;
      final apiService = ApiService();
      final avail = await apiService.getWaitTimeAndAvailability('rest-001', partySize: 2);

      expect(avail.restaurantId, 'rest-001');
      expect(avail.totalTables, greaterThan(0));
      expect(avail.availableTablesCount, greaterThan(0));

      debugPrint('✅ Verified Real Wait Time & Availability for rest-001:');
      debugPrint('   • Available Tables: ${avail.availableTablesCount} / ${avail.totalTables}');
      debugPrint('   • Estimated Wait: ${avail.estimatedWaitTime} mins (Crowd: ${avail.crowdLevel})');
    });
  });

  group('ReservationScreen Widget Tests', () {
    testWidgets('ReservationScreen renders restaurant summary, party selector, slots, and tables', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockApi = MockReservationApiService(
        mockTables: [sampleTable1, sampleTable2, sampleTable3],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ReservationScreen(
            restaurant: sampleRestaurantForBooking,
            apiService: mockApi,
            currentUser: testCustomerUser,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Header & Summary
      expect(find.text('Reserve a Table'), findsWidgets);
      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
      expect(find.text('8 Tables Available Right Now'), findsOneWidget);

      // Verify Step 1: Party Size
      expect(find.text('Step 1: Party Size (Guests)'), findsOneWidget);
      expect(find.text('Adults (12+ yrs)'), findsOneWidget);
      expect(find.text('2 Guests'), findsOneWidget);

      // Increase adults count by 1 (2 -> 3)
      await tester.tap(find.byIcon(Icons.add).first);
      await tester.pumpAndSettle();
      expect(find.text('3 Guests'), findsOneWidget);

      // Verify Step 2: Date Selector
      expect(find.text('Step 2: Booking Date'), findsOneWidget);

      // Verify Step 3: Time Slot Selector
      expect(find.text('Step 3: Time Slot'), findsOneWidget);
      expect(find.text('Lunch Time Slots'), findsOneWidget);
      expect(find.text('Dinner Time Slots'), findsOneWidget);
      expect(find.text('12:30 PM'), findsOneWidget);
      expect(find.text('7:30 PM'), findsOneWidget);

      // Select dinner slot 8:00 PM
      await tester.tap(find.text('8:00 PM'));
      await tester.pumpAndSettle();

      // Verify Step 4: Table Allocation
      expect(find.text('Step 4: Table Allocation'), findsOneWidget);
      expect(find.text('Auto-Assign Table'), findsOneWidget);
      expect(find.text('Select Floor Table'), findsOneWidget);

      // Switch to floor table selection
      await tester.tap(find.text('Select Floor Table'));
      await tester.pumpAndSettle();

      expect(find.text('Table #T-01'), findsOneWidget);
      expect(find.text('Table #T-02'), findsOneWidget);
      expect(find.text('Table #T-03'), findsOneWidget);

      // Select Table T-02 (available 4 seats >= 3 guests)
      await tester.tap(find.text('Table #T-02'));
      await tester.pumpAndSettle();

      // Verify Step 5: Special Occasions
      expect(find.text('Step 5: Occasion & Special Requests'), findsOneWidget);
      expect(find.text('🎂 Birthday Celebration'), findsOneWidget);
      expect(find.text('🪟 Window Table'), findsOneWidget);

      // Select Birthday preset
      await tester.tap(find.text('🎂 Birthday Celebration'));
      await tester.pumpAndSettle();

      // Bottom Bar displays selection
      expect(find.text('3 Guests • 20:00'), findsOneWidget);

      // Tapping Reserve Table navigates to ReservationReviewScreen
      await tester.tap(find.text('Reserve Table'));
      await tester.pumpAndSettle();

      expect(find.text('Review Reservation'), findsOneWidget);
      expect(find.text('Confirm Reservation'), findsOneWidget);

      // Confirm Reservation on review screen
      await tester.tap(find.text('Confirm Reservation'));
      await tester.pumpAndSettle();

      expect(find.text('Reservation Requested!'), findsOneWidget);
      expect(mockApi.reservationCallCount, 1);
    });


    testWidgets('Tapping Reserve a Table from RestaurantDetailsScreen navigates to ReservationScreen', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockApi = MockReservationApiService(
        mockTables: [sampleTable1, sampleTable2, sampleTable3],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: RestaurantDetailsScreen(
            restaurantId: 'rest-001',
            initialRestaurant: sampleRestaurantForBooking,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Reserve Table button on Details Screen
      expect(find.text('Reserve Table'), findsWidgets);
      await tester.tap(find.text('Reserve Table').first);
      await tester.pumpAndSettle();

      // We are now on ReservationScreen
      expect(find.text('Step 1: Party Size (Guests)'), findsOneWidget);
      expect(find.text('Step 2: Booking Date'), findsOneWidget);
      expect(find.text('Step 3: Time Slot'), findsOneWidget);
    });

    testWidgets('ReservationScreen handles under-verification restaurants gracefully', (WidgetTester tester) async {
      final unverifiedRestaurant = RestaurantModel(
        id: 'rest-unverified',
        name: 'The Secret Spice Bistro',
        description: 'New bistro undergoing verification.',
        cuisine: 'Fusion',
        priceRange: '₹₹',
        rating: 4.5,
        ratingCount: 10,
        isOpen: true,
        isVerified: false,
        verificationStatus: 'UNDER_VERIFICATION',
        openingTime: '10:00',
        closingTime: '22:00',
        addressLine1: 'Test St',
        city: 'Chennai',
        state: 'Tamil Nadu',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: ReservationScreen(
            restaurant: unverifiedRestaurant,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Under Verification'), findsOneWidget);
      expect(find.text('Back to Details'), findsOneWidget);
    });
  });
}
