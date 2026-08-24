import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/menu_category_model.dart';
import 'package:mobile/models/menu_item_model.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/home/customer_home_screen.dart';
import 'package:mobile/screens/restaurant/restaurant_details_screen.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/widgets/menu_item_card.dart';

class MockApiService extends ApiService {
  final RestaurantModel? mockRestaurant;
  final List<MenuCategoryModel> mockCategories;
  final bool shouldThrow;

  MockApiService({
    this.mockRestaurant,
    this.mockCategories = const [],
    this.shouldThrow = false,
  });

  @override
  Future<List<RestaurantModel>> getRestaurants({
    double? lat,
    double? lng,
    double? radiusKm,
    String? search,
    String? cuisine,
    String? sortBy,
  }) async {
    if (shouldThrow) throw Exception('Failed to load restaurants');
    return mockRestaurant != null ? [mockRestaurant!] : [];
  }

  @override
  Future<RestaurantModel> getRestaurantById(String id, {double? lat, double? lng}) async {
    if (shouldThrow) throw Exception('Restaurant not found');
    if (mockRestaurant != null) return mockRestaurant!;
    throw Exception('Restaurant not found');
  }

  @override
  Future<List<MenuCategoryModel>> getMenuByRestaurant(String restaurantId) async {
    if (shouldThrow) throw Exception('Menu unavailable');
    return mockCategories;
  }
}

const sampleItem1 = MenuItemModel(
  id: 'itm-001',
  restaurantId: 'rest-001',
  categoryId: 'cat-001',
  name: 'Ghee Podi Masala Dosa',
  description: 'Crispy golden crepe with spicy gunpowder and pure butter',
  price: 160.0,
  prepTimeMinutes: 10,
  isVegetarian: true,
  isVegan: false,
  isGlutenFree: true,
  isAvailable: true,
  spicinessLevel: 'MEDIUM',
);

const sampleItem2 = MenuItemModel(
  id: 'itm-004',
  restaurantId: 'rest-001',
  categoryId: 'cat-001',
  name: 'Paneer Tikka Angare',
  description: 'Charcoal grilled cottage cheese cubes in spicy hung curd',
  price: 260.0,
  prepTimeMinutes: 18,
  isVegetarian: true,
  isVegan: false,
  isGlutenFree: true,
  isAvailable: true,
  spicinessLevel: 'SPICY',
);

const sampleItem3 = MenuItemModel(
  id: 'itm-010',
  restaurantId: 'rest-001',
  categoryId: 'cat-002',
  name: 'Hot Sizzling Brownie',
  description: 'Decadent brownie with vanilla ice cream',
  price: 180.0,
  prepTimeMinutes: 8,
  isVegetarian: true,
  isVegan: false,
  isGlutenFree: false,
  isAvailable: false, // Sold out
  spicinessLevel: 'NONE',
);

const sampleCategory1 = MenuCategoryModel(
  id: 'cat-001',
  restaurantId: 'rest-001',
  name: 'Starters & Dosas',
  description: 'Crispy dosas and starters',
  displayOrder: 1,
  items: [sampleItem1, sampleItem2],
);

const sampleCategory2 = MenuCategoryModel(
  id: 'cat-002',
  restaurantId: 'rest-001',
  name: 'Desserts',
  description: 'Sweet treats',
  displayOrder: 2,
  items: [sampleItem3],
);

const sampleFullRestaurant = RestaurantModel(
  id: 'rest-001',
  name: 'Sangeetha Veg Gourmet',
  description: 'Fine vegetarian dining with classic South Indian and Tandoori dishes.',
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
  distanceKm: 1.2,
  estimatedTravelTimeMinutes: 10,
  availableTablesCount: 9,
  crowdLevel: 'LOW',
  menuCategories: [sampleCategory1, sampleCategory2],
  menuItems: [sampleItem1, sampleItem2, sampleItem3],
);


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

  group('MenuItem and MenuCategory Model Tests', () {
    test('MenuItemModel formats price, prep time, and parses fields', () {
      expect(sampleItem1.formattedPrice, '₹160');
      expect(sampleItem1.formattedPrepTime, '10 mins');
      expect(sampleItem1.isVegetarian, isTrue);

      final jsonMap = {
        'id': 'itm-999',
        'restaurant_id': 'rest-001',
        'category_id': 'cat-001',
        'name': 'Filter Coffee',
        'price': 65.5,
        'prep_time_minutes': 5,
        'is_vegetarian': 1,
        'is_available': 1,
      };
      final item = MenuItemModel.fromJson(jsonMap);
      expect(item.name, 'Filter Coffee');
      expect(item.formattedPrice, '₹65.50');
      expect(item.prepTimeMinutes, 5);
      expect(item.isVegetarian, isTrue);
      expect(item.isAvailable, isTrue);
    });

    test('MenuCategoryModel parses category with items list', () {
      final jsonCat = {
        'id': 'cat-001',
        'restaurant_id': 'rest-001',
        'name': 'Hot Beverages',
        'items': [
          {
            'id': 'itm-008',
            'restaurant_id': 'rest-001',
            'category_id': 'cat-001',
            'name': 'Degree Coffee',
            'price': 60,
            'is_vegetarian': 1,
          }
        ]
      };
      final cat = MenuCategoryModel.fromJson(jsonCat);
      expect(cat.name, 'Hot Beverages');
      expect(cat.items.length, 1);
      expect(cat.items.first.name, 'Degree Coffee');
      expect(cat.items.first.formattedPrice, '₹60');
    });
  });

  group('Live SQLite Backend Restaurant Details & Menu Integration', () {
    test('ApiService.getRestaurantById retrieves real SQLite restaurant with populated menu', () async {
      HttpOverrides.global = null;
      final apiService = ApiService();
      final restaurant = await apiService.getRestaurantById('rest-001', lat: 13.0604, lng: 80.2437);

      expect(restaurant.id, 'rest-001');
      expect(restaurant.name, 'Sangeetha Veg Gourmet');
      expect(restaurant.rating, 4.8);
      expect(restaurant.fullAddress, contains('Nungambakkam'));
      expect(restaurant.menuCategories, isNotNull);
      expect(restaurant.menuCategories, isNotEmpty);
      expect(restaurant.menuItems, isNotNull);
      expect(restaurant.menuItems, isNotEmpty);

      debugPrint('✅ Verified Real Restaurant Details from SQLite: ${restaurant.name}');
      debugPrint('   • Cuisines: ${restaurant.cuisine}');
      debugPrint('   • Hours: ${restaurant.formattedHours}');
      debugPrint('   • Categories: ${restaurant.menuCategories?.length} categories');
      debugPrint('   • Total Dishes: ${restaurant.menuItems?.length} items');
      for (final cat in restaurant.menuCategories!) {
        debugPrint('     - [${cat.name}]: ${cat.items.length} items');
      }
    });

    test('ApiService.getMenuByRestaurant retrieves real menu categories and dishes', () async {
      HttpOverrides.global = null;
      final apiService = ApiService();
      final categories = await apiService.getMenuByRestaurant('rest-001');

      expect(categories, isNotEmpty);
      final firstCat = categories.first;
      expect(firstCat.name, isNotEmpty);
      expect(firstCat.items, isNotEmpty);
      expect(firstCat.items.first.price, greaterThan(0));

      debugPrint('✅ Verified Real Menu Endpoint (/api/menu/rest-001): ${categories.length} categories');
      for (final item in firstCat.items) {
        debugPrint('   • ${item.name} (${item.formattedPrice}) - ${item.isVegetarian ? "VEG" : "NON-VEG"}');
      }
    });
  });

  group('MenuItemCard and RestaurantDetailsScreen Widget Tests', () {
    testWidgets('MenuItemCard renders item details, price, diet tag, and sold-out badge', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                MenuItemCard(item: sampleItem1),
                MenuItemCard(item: sampleItem3), // Sold out item
              ],
            ),
          ),
        ),
      );

      // Verify item 1 details
      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);
      expect(find.text('₹160'), findsOneWidget);
      expect(find.text('10 mins'), findsOneWidget);
      expect(find.text('GLUTEN FREE'), findsOneWidget);

      // Verify item 3 sold out badge
      expect(find.text('Hot Sizzling Brownie'), findsOneWidget);
      expect(find.text('₹180'), findsOneWidget);
      expect(find.text('SOLD OUT'), findsOneWidget);
    });

    testWidgets('RestaurantDetailsScreen renders header, info, categories, search, and dishes', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockApi = MockApiService(
        mockRestaurant: sampleFullRestaurant,
        mockCategories: [sampleCategory1, sampleCategory2],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: RestaurantDetailsScreen(
            restaurantId: 'rest-001',
            initialRestaurant: sampleFullRestaurant,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Verify Restaurant Header Info
      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
      expect(find.text('South Indian, Vegetarian'), findsOneWidget);
      expect(find.text('4.8'), findsOneWidget);
      expect(find.text('(342)'), findsOneWidget);
      expect(find.text('OPEN NOW'), findsOneWidget);
      expect(find.text('07:00 - 23:00'), findsOneWidget);
      expect(find.text('1.2 km away • ~10 mins drive'), findsOneWidget);
      expect(find.text('12 Nungambakkam High Road, Chennai, Tamil Nadu'), findsOneWidget);
      expect(find.text('9 Tables Available'), findsWidgets);
      expect(find.text('LOW CROWD'), findsOneWidget);

      // Verify Actions
      expect(find.text('Call'), findsOneWidget);
      expect(find.text('Directions'), findsOneWidget);

      // Verify Menu Header & Category Chips
      expect(find.text('Restaurant Menu'), findsOneWidget);
      expect(find.text('3 Dishes'), findsOneWidget);
      expect(find.text('All Dishes'), findsOneWidget);
      expect(find.text('Starters & Dosas'), findsOneWidget);
      expect(find.text('Desserts'), findsOneWidget);

      // Verify Menu Items rendered
      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);
      expect(find.text('Paneer Tikka Angare'), findsOneWidget);
      expect(find.text('Hot Sizzling Brownie'), findsOneWidget);

      // Filter by category: Desserts
      await tester.tap(find.text('Desserts'));
      await tester.pumpAndSettle();

      expect(find.text('Hot Sizzling Brownie'), findsOneWidget);
      expect(find.text('Ghee Podi Masala Dosa'), findsNothing);

      // Switch back to All Dishes
      await tester.tap(find.text('All Dishes'));
      await tester.pumpAndSettle();
      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);

      // Search in menu
      await tester.enterText(find.byType(TextField), 'Paneer');
      await tester.pumpAndSettle();

      expect(find.text('Paneer Tikka Angare'), findsOneWidget);
      expect(find.text('Ghee Podi Masala Dosa'), findsNothing);
    });

    testWidgets('Tapping restaurant card on CustomerHomeScreen navigates to RestaurantDetailsScreen', (WidgetTester tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.resetPhysicalSize);

      final mockApi = MockApiService(
        mockRestaurant: sampleFullRestaurant,
        mockCategories: [sampleCategory1, sampleCategory2],
      );

      await tester.pumpWidget(
        MaterialApp(
          home: CustomerHomeScreen(
            currentUser: testUser,
            apiService: mockApi,
            autoRequestLocation: false,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Find restaurant card and tap it
      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
      await tester.tap(find.text('Sangeetha Veg Gourmet'));
      await tester.pumpAndSettle();

      // Verify we navigated to RestaurantDetailsScreen
      expect(find.text('Restaurant Menu'), findsOneWidget);
      expect(find.text('Starters & Dosas'), findsOneWidget);
      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);

      // Verify back navigation works
      await tester.tap(find.byIcon(Icons.arrow_back));
      await tester.pumpAndSettle();

      // Back on Home Screen
      expect(find.text('CURRENT LOCATION'), findsOneWidget);
    });


    testWidgets('RestaurantDetailsScreen displays user-friendly error with Retry on failure', (WidgetTester tester) async {
      final mockApi = MockApiService(shouldThrow: true);

      await tester.pumpWidget(
        MaterialApp(
          home: RestaurantDetailsScreen(
            restaurantId: 'invalid-id-999',
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Unable to Load Restaurant'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });
  });
}
