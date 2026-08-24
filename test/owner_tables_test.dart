import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/table_model.dart';
import 'package:mobile/screens/owner/tables/add_table_screen.dart';
import 'package:mobile/screens/owner/tables/edit_table_screen.dart';
import 'package:mobile/screens/owner/tables/owner_tables_screen.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/owner_api_service.dart';
import 'package:mobile/services/owner_auth_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockOwnerApiService extends OwnerApiService {
  final List<TableModel> mockTables;
  MockOwnerApiService({required this.mockTables});

  @override
  Future<List<TableModel>> getRestaurantTables(String restaurantId) async {
    return mockTables;
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  const sampleMockTables = [
    TableModel(
      id: 'tbl-001',
      restaurantId: 'rest-001',
      tableNumber: 'T-01',
      capacity: 2,
      section: 'Main Dining',
      status: TableStatus.available,
    ),
    TableModel(
      id: 'tbl-002',
      restaurantId: 'rest-001',
      tableNumber: 'T-02',
      capacity: 4,
      section: 'Main Dining',
      status: TableStatus.occupied,
    ),
    TableModel(
      id: 'tbl-003',
      restaurantId: 'rest-001',
      tableNumber: 'T-03',
      capacity: 6,
      section: 'Outdoor Patio',
      status: TableStatus.reserved,
    ),
    TableModel(
      id: 'tbl-004',
      restaurantId: 'rest-001',
      tableNumber: 'T-04',
      capacity: 4,
      section: 'VIP Lounge',
      status: TableStatus.cleaning,
    ),
    TableModel(
      id: 'tbl-005',
      restaurantId: 'rest-001',
      tableNumber: 'T-05',
      capacity: 8,
      section: 'VIP Lounge',
      status: TableStatus.maintenance,
    ),
    TableModel(
      id: 'tbl-006',
      restaurantId: 'rest-001',
      tableNumber: 'T-06',
      capacity: 2,
      section: 'Bar Area',
      status: TableStatus.blocked,
    ),
  ];

  const mockRestaurant = RestaurantModel(
    id: 'rest-001',
    ownerId: 'usr-owner-001',
    name: 'Sangeetha Veg Gourmet',
    description: 'Authentic South Indian Vegetarian',
    cuisine: 'South Indian',
    priceRange: '\$\$',
    rating: 4.8,
    ratingCount: 240,
    phone: '+91 98400 11223',
    email: 'contact@sangeethagourmet.com',
    imageUrl: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?w=800',
    coverImageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
    isOpen: true,
    verificationStatus: 'APPROVED',
    isVerified: true,
    openingTime: '07:00',
    closingTime: '23:00',
    crowdLevel: 'MEDIUM',
  );

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  group('DineTrack Step 15 — Owner Tables Widget & Flow Tests', () {
    testWidgets('1. OwnerTablesScreen renders restaurant name, metric chips, search bar, and table cards', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: OwnerTablesScreen(
            restaurant: mockRestaurant,
            apiService: MockOwnerApiService(mockTables: sampleMockTables),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Verify Header & Restaurant Name
      expect(find.text('Table Management'), findsOneWidget);
      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
      expect(find.byKey(const Key('add_table_header_btn')), findsOneWidget);

      // Verify Metrics
      expect(find.text('6 Total Tables'), findsOneWidget);
      expect(find.text('Available: '), findsOneWidget);
      expect(find.text('Occupied: '), findsOneWidget);
      expect(find.text('Reserved: '), findsOneWidget);
      expect(find.text('Cleaning: '), findsOneWidget);
      expect(find.text('Maintenance: '), findsOneWidget);
      expect(find.text('Blocked: '), findsOneWidget);

      // Verify Search Box & Filter Chips
      expect(find.byKey(const Key('table_search_input')), findsOneWidget);
      expect(find.byKey(const Key('filter_chip_ALL')), findsOneWidget);
      expect(find.byKey(const Key('filter_chip_AVAILABLE')), findsOneWidget);
      expect(find.byKey(const Key('filter_chip_OCCUPIED')), findsOneWidget);

      // Verify Table Cards
      expect(find.text('TABLE T-01'), findsOneWidget);
      expect(find.text('2 SEATS'), findsWidgets);
      expect(find.text('Main Dining'), findsWidgets);
      expect(find.text('AVAILABLE'), findsWidgets);
    });

    testWidgets('2. Search filtering filters tables by number, section, or capacity', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: OwnerTablesScreen(
            restaurant: mockRestaurant,
            apiService: MockOwnerApiService(mockTables: sampleMockTables),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Search for "Patio"
      await tester.enterText(find.byKey(const Key('table_search_input')), 'Patio');
      await tester.pump();

      expect(find.text('TABLE T-03'), findsOneWidget);
      expect(find.text('TABLE T-01'), findsNothing);
      expect(find.text('Floor Tables (1)'), findsOneWidget);

      // Clear search
      await tester.enterText(find.byKey(const Key('table_search_input')), '');
      await tester.pump();

      expect(find.text('Floor Tables (6)'), findsOneWidget);
    });

    testWidgets('3. Filter chips filter tables by status (e.g. OCCUPIED, CLEANING)', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: OwnerTablesScreen(
            restaurant: mockRestaurant,
            apiService: MockOwnerApiService(mockTables: sampleMockTables),
          ),
        ),
      );

      await tester.pump();
      await tester.pump(const Duration(milliseconds: 300));

      // Tap OCCUPIED filter
      await tester.tap(find.byKey(const Key('filter_chip_OCCUPIED')));
      await tester.pump();

      expect(find.text('TABLE T-02'), findsOneWidget);
      expect(find.text('TABLE T-01'), findsNothing);
      expect(find.text('Floor Tables (1)'), findsOneWidget);

      // Tap ALL filter
      await tester.tap(find.byKey(const Key('filter_chip_ALL')));
      await tester.pump();

      expect(find.text('Floor Tables (6)'), findsOneWidget);
    });

    testWidgets('4. AddTableScreen validates required fields and capacity range', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: AddTableScreen(
            restaurant: mockRestaurant,
          ),
        ),
      );

      // Verify form rendered
      expect(find.text('Add New Table'), findsOneWidget);
      expect(find.byKey(const Key('add_table_number_input')), findsOneWidget);
      expect(find.byKey(const Key('add_table_capacity_input')), findsOneWidget);
      expect(find.byKey(const Key('submit_add_table_btn')), findsOneWidget);

      // Submit empty
      await tester.enterText(find.byKey(const Key('add_table_number_input')), '');
      await tester.enterText(find.byKey(const Key('add_table_capacity_input')), '0');
      await tester.tap(find.byKey(const Key('submit_add_table_btn')));
      await tester.pump();

      // Expect validation errors
      expect(find.text('Please enter a table number'), findsOneWidget);
      expect(find.text('Capacity must be at least 1 guest'), findsOneWidget);
    });

    testWidgets('5. EditTableScreen loads initial values and validates input', (tester) async {
      final sampleTable = sampleMockTables.first;

      await tester.pumpWidget(
        MaterialApp(
          home: EditTableScreen(
            table: sampleTable,
          ),
        ),
      );

      // Verify initial fields
      expect(find.text('Edit Table'), findsOneWidget);
      expect(find.text('T-01'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);

      // Clear number and submit
      await tester.enterText(find.byKey(const Key('edit_table_number_input')), '');
      await tester.tap(find.byKey(const Key('submit_edit_table_btn')));
      await tester.pump();

      expect(find.text('Please enter a table number'), findsOneWidget);
    });
  });

  group('DineTrack Step 15 — Live SQLite Backend Table CRUD Integration Tests', () {
    late OwnerApiService ownerApiService;
    late OwnerAuthService ownerAuthService;
    late AuthService customerAuthService;

    setUp(() {
      HttpOverrides.global = null;
      SharedPreferences.setMockInitialValues({});
      ownerApiService = OwnerApiService();
      ownerAuthService = OwnerAuthService();
      customerAuthService = AuthService();
    });

    test('6. Real owner can fetch live restaurant tables from SQLite', () async {
      HttpOverrides.global = null;
      // 1. Authenticate owner
      final ownerUser = await ownerAuthService.login(email: 'owner@sangeetha.com', password: 'Password123!');
      expect(ownerUser.role, equals('OWNER'));
      expect(ownerUser.restaurantId, equals('rest-001'));

      // 2. Fetch tables for restaurant
      final tables = await ownerApiService.getRestaurantTables('rest-001');
      expect(tables, isNotEmpty);
      expect(tables.length, greaterThanOrEqualTo(5));

      final firstTbl = tables.first;
      expect(firstTbl.tableNumber, isNotEmpty);
      expect(firstTbl.capacity, greaterThan(0));
      expect(firstTbl.restaurantId, equals('rest-001'));

      debugPrint('✅ Real SQLite Tables loaded for rest-001: ${tables.length} tables found');
      for (final t in tables.take(3)) {
        debugPrint('   • Table #${t.tableNumber} | ${t.capacity} seats | Section: ${t.section} | Status: ${t.status.name.toUpperCase()}');
      }
    });

    test('7. Real owner can CREATE, UPDATE, CHANGE STATUS, and DELETE a table in SQLite', () async {
      HttpOverrides.global = null;
      // 1. Authenticate owner
      await ownerAuthService.login(email: 'owner@sangeetha.com', password: 'Password123!');

      // 2. Create a test table
      final testNumber = 'T-${DateTime.now().millisecondsSinceEpoch % 1000}';
      final createdTable = await ownerApiService.createTable(
        'rest-001',
        tableNumber: testNumber,
        capacity: 6,
        section: 'VIP Lounge',
      );

      expect(createdTable.id, isNotEmpty);
      expect(createdTable.tableNumber, equals(testNumber));
      expect(createdTable.capacity, equals(6));
      expect(createdTable.section, equals('VIP Lounge'));
      expect(createdTable.status, equals(TableStatus.available));
      debugPrint('✅ Real SQLite Table Created: #${createdTable.tableNumber} (ID: ${createdTable.id})');

      // 3. Update the created table
      final updatedTable = await ownerApiService.updateTable(
        createdTable.id,
        tableNumber: '$testNumber-B',
        capacity: 8,
        section: 'Rooftop',
      );

      expect(updatedTable.tableNumber, equals('$testNumber-B'));
      expect(updatedTable.capacity, equals(8));
      expect(updatedTable.section, equals('Rooftop'));
      debugPrint('✅ Real SQLite Table Modified: #${updatedTable.tableNumber} | ${updatedTable.capacity} seats | ${updatedTable.section}');

      // 4. Update Table Status to OCCUPIED
      final statusTable = await ownerApiService.updateTableStatus(
        createdTable.id,
        'OCCUPIED',
      );
      expect(statusTable.status, equals(TableStatus.occupied));
      debugPrint('✅ Real SQLite Table Status Updated: ${statusTable.status.name.toUpperCase()}');

      // 5. Delete the test table to preserve clean DB state
      final deleted = await ownerApiService.deleteTable(createdTable.id);
      expect(deleted, isTrue);
      debugPrint('✅ Real SQLite Table Successfully Cleaned Up: ${createdTable.id}');
    });

    test('8. Customer account attempting table CRUD is rejected by backend authorization middleware', () async {
      HttpOverrides.global = null;
      // Login as customer
      await customerAuthService.login(email: 'alex@smarttable.com', password: 'Password123!');

      // Attempting owner table creation without owner token throws exception
      expect(
        () async => await ownerApiService.createTable(
          'rest-001',
          tableNumber: 'HACK-01',
          capacity: 4,
        ),
        throwsA(isA<Exception>()),
      );

      debugPrint('✅ Customer correctly denied permission for Table CRUD');
    });
  });
}
