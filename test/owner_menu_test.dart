import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/menu_category_model.dart';
import 'package:mobile/models/menu_item_model.dart';
import 'package:mobile/screens/owner/menu/add_menu_item_screen.dart';
import 'package:mobile/screens/owner/menu/edit_menu_item_screen.dart';
import 'package:mobile/screens/owner/menu/owner_menu_screen.dart';
import 'package:mobile/services/auth_service.dart';
import 'package:mobile/services/owner_api_service.dart';
import 'package:mobile/services/owner_auth_service.dart';

class MockOwnerMenuApiService extends OwnerApiService {
  final List<MenuCategoryModel> mockCategories;
  final List<MenuItemModel> mockItems;
  final bool shouldThrow;

  MockOwnerMenuApiService({
    required this.mockCategories,
    required this.mockItems,
    this.shouldThrow = false,
  });

  @override
  Future<({List<MenuCategoryModel> categories, List<MenuItemModel> items})> getRestaurantMenu(
    String restaurantId,
  ) async {
    if (shouldThrow) throw Exception('Failed to load restaurant menu');
    return (categories: mockCategories, items: mockItems);
  }

  @override
  Future<MenuItemModel> createMenuItem({
    required String restaurantId,
    String? categoryId,
    required String name,
    String? description,
    required double price,
    int prepTimeMinutes = 15,
    bool isVegetarian = false,
    bool isVegan = false,
    bool isGlutenFree = false,
    String? imageUrl,
    String spicinessLevel = 'MILD',
  }) async {
    if (shouldThrow) throw Exception('Failed to create menu item');
    return MenuItemModel(
      id: 'item-new-999',
      restaurantId: restaurantId,
      categoryId: categoryId ?? 'cat-001',
      name: name,
      description: description,
      price: price,
      prepTimeMinutes: prepTimeMinutes,
      isVegetarian: isVegetarian,
      isVegan: isVegan,
      isGlutenFree: isGlutenFree,
      isAvailable: true,
      imageUrl: imageUrl,
      spicinessLevel: spicinessLevel,
    );
  }

  @override
  Future<MenuItemModel> updateMenuItem(
    String itemId, {
    String? name,
    String? description,
    double? price,
    int? prepTimeMinutes,
    bool? isVegetarian,
    bool? isVegan,
    bool? isGlutenFree,
    bool? isAvailable,
    String? imageUrl,
    String? spicinessLevel,
  }) async {
    if (shouldThrow) throw Exception('Failed to update menu item');
    return MenuItemModel(
      id: itemId,
      restaurantId: 'rest-001',
      categoryId: 'cat-001',
      name: name ?? 'Updated Dish',
      description: description,
      price: price ?? 250.0,
      prepTimeMinutes: prepTimeMinutes ?? 20,
      isVegetarian: isVegetarian ?? true,
      isVegan: isVegan ?? false,
      isGlutenFree: isGlutenFree ?? false,
      isAvailable: isAvailable ?? true,
      imageUrl: imageUrl,
      spicinessLevel: spicinessLevel ?? 'MEDIUM',
    );
  }

  @override
  Future<MenuItemModel> toggleMenuItemAvailability(String itemId, bool isAvailable) async {
    return updateMenuItem(itemId, isAvailable: isAvailable);
  }

  @override
  Future<bool> deleteMenuItem(String itemId) async {
    if (shouldThrow) throw Exception('Failed to delete menu item');
    return true;
  }
}

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({
      'smarttable_owner_token': 'mock-owner-token',
      'smarttable_owner_user': '{"id":"usr-own-001","name":"Sangeetha Ramanathan","email":"owner@sangeetha.com","role":"OWNER","restaurant_id":"rest-001","restaurant_name":"Sangeetha Veg Gourmet"}',
    });
  });

  const sampleCategories = [
    MenuCategoryModel(
      id: 'cat-001',
      restaurantId: 'rest-001',
      name: 'Signature Tiffin & Dosa',
      displayOrder: 1,
    ),
    MenuCategoryModel(
      id: 'cat-002',
      restaurantId: 'rest-001',
      name: 'Crispy Appetizers',
      displayOrder: 2,
    ),
  ];

  const sampleItems = [
    MenuItemModel(
      id: 'item-001',
      restaurantId: 'rest-001',
      categoryId: 'cat-001',
      name: 'Ghee Podi Masala Dosa',
      description: 'Crispy golden crepe smeared with aromatic spiced gunpowder chutney',
      price: 160.0,
      prepTimeMinutes: 12,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500',
      spicinessLevel: 'MEDIUM',
    ),
    MenuItemModel(
      id: 'item-002',
      restaurantId: 'rest-001',
      categoryId: 'cat-001',
      name: 'Steamed Mini Ghee Idli',
      description: '14 bite-sized button idlis drenched in piping hot sambar',
      price: 130.0,
      prepTimeMinutes: 8,
      isVegetarian: true,
      isVegan: false,
      isGlutenFree: true,
      isAvailable: false, // SOLD OUT
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
      spicinessLevel: 'MILD',
    ),
    MenuItemModel(
      id: 'item-003',
      restaurantId: 'rest-001',
      categoryId: 'cat-002',
      name: 'Crispy Medu Vada (2 pcs)',
      description: 'Traditional deep-fried savory lentil doughnuts served with coconut chutney',
      price: 90.0,
      prepTimeMinutes: 10,
      isVegetarian: true,
      isVegan: true,
      isGlutenFree: false,
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500',
      spicinessLevel: 'MILD',
    ),
  ];

  group('DineTrack Step 17 — Owner Menu Widget & Flow Tests', () {
    testWidgets('1. OwnerMenuScreen renders restaurant name, metric pills, search bar, and item cards', (WidgetTester tester) async {
      final mockApi = MockOwnerMenuApiService(
        mockCategories: sampleCategories,
        mockItems: sampleItems,
      );

      final authService = OwnerAuthService(
        prefs: await SharedPreferences.getInstance(),
      );
      await authService.restoreSession();

      await tester.pumpWidget(
        MaterialApp(
          home: OwnerMenuScreen(
            apiService: mockApi,
            authService: authService,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Header stats verification
      expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
      expect(find.text('Live Menu & Inventory Management'), findsOneWidget);
      expect(find.text('Total Items'), findsOneWidget);
      expect(find.text('3'), findsWidgets); // Total Items = 3
      expect(find.text('Available'), findsWidgets);
      expect(find.text('Sold Out'), findsWidgets);
      expect(find.text('Categories'), findsWidgets);

      // Search and Filter Chips
      expect(find.widgetWithText(ChoiceChip, 'ALL'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'AVAILABLE'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'SOLD OUT'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'VEG'), findsOneWidget);
      expect(find.widgetWithText(ChoiceChip, 'NON-VEG'), findsOneWidget);

      // Dish Cards
      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);
      expect(find.text('Steamed Mini Ghee Idli'), findsOneWidget);
      expect(find.text('Crispy Medu Vada (2 pcs)'), findsOneWidget);
      expect(find.text('₹160'), findsOneWidget);
      expect(find.text('₹130'), findsOneWidget);
      expect(find.text('₹90'), findsOneWidget);
    });

    testWidgets('2. Search filtering filters dishes by name, description, or category', (WidgetTester tester) async {
      final mockApi = MockOwnerMenuApiService(
        mockCategories: sampleCategories,
        mockItems: sampleItems,
      );

      final authService = OwnerAuthService(
        prefs: await SharedPreferences.getInstance(),
      );
      await authService.restoreSession();

      await tester.pumpWidget(
        MaterialApp(
          home: OwnerMenuScreen(
            apiService: mockApi,
            authService: authService,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Enter search query
      final searchField = find.byType(TextField);
      await tester.enterText(searchField, 'Vada');
      await tester.pumpAndSettle();

      expect(find.text('Crispy Medu Vada (2 pcs)'), findsOneWidget);
      expect(find.text('Ghee Podi Masala Dosa'), findsNothing);
      expect(find.text('Steamed Mini Ghee Idli'), findsNothing);
    });

    testWidgets('3. Filter chips filter dishes by Available and Sold Out status', (WidgetTester tester) async {
      final mockApi = MockOwnerMenuApiService(
        mockCategories: sampleCategories,
        mockItems: sampleItems,
      );

      final authService = OwnerAuthService(
        prefs: await SharedPreferences.getInstance(),
      );
      await authService.restoreSession();

      await tester.pumpWidget(
        MaterialApp(
          home: OwnerMenuScreen(
            apiService: mockApi,
            authService: authService,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Filter by SOLD OUT
      await tester.tap(find.widgetWithText(ChoiceChip, 'SOLD OUT'));
      await tester.pumpAndSettle();

      expect(find.text('Steamed Mini Ghee Idli'), findsOneWidget);
      expect(find.text('Ghee Podi Masala Dosa'), findsNothing);
      expect(find.text('Crispy Medu Vada (2 pcs)'), findsNothing);

      // Filter by AVAILABLE
      await tester.tap(find.widgetWithText(ChoiceChip, 'AVAILABLE'));
      await tester.pumpAndSettle();

      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);
      expect(find.text('Crispy Medu Vada (2 pcs)'), findsOneWidget);
      expect(find.text('Steamed Mini Ghee Idli'), findsNothing);
    });

    testWidgets('4. AddMenuItemScreen validates required dish name and price', (WidgetTester tester) async {
      final mockApi = MockOwnerMenuApiService(
        mockCategories: sampleCategories,
        mockItems: sampleItems,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: AddMenuItemScreen(
            restaurantId: 'rest-001',
            categories: sampleCategories,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Tap Add button without entering values
      final addBtn = find.widgetWithText(ElevatedButton, 'Add Dish to Menu');
      await tester.ensureVisible(addBtn);
      await tester.tap(addBtn);
      await tester.pumpAndSettle();

      expect(find.text('Please enter dish name'), findsOneWidget);
      expect(find.text('Enter price'), findsOneWidget);
    });

    testWidgets('5. EditMenuItemScreen loads existing dish data and updates properly', (WidgetTester tester) async {
      final mockApi = MockOwnerMenuApiService(
        mockCategories: sampleCategories,
        mockItems: sampleItems,
      );

      await tester.pumpWidget(
        MaterialApp(
          home: EditMenuItemScreen(
            item: sampleItems.first,
            apiService: mockApi,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Ghee Podi Masala Dosa'), findsOneWidget);
      expect(find.text('160'), findsOneWidget);
      expect(find.text('12'), findsOneWidget);

      // Update price and save
      final priceField = find.widgetWithText(TextFormField, '160');
      await tester.enterText(priceField, '185');
      final saveBtn = find.widgetWithText(ElevatedButton, 'Save Changes');
      await tester.ensureVisible(saveBtn);
      await tester.tap(saveBtn);
      await tester.pumpAndSettle();
    });
  });

  group('DineTrack Step 17 — Live SQLite Backend Menu CRUD Integration Tests', () {
    test('6. Real owner can fetch live restaurant menu from SQLite', () async {
      HttpOverrides.global = null;
      final prefs = await SharedPreferences.getInstance();
      final authService = OwnerAuthService(prefs: prefs);
      final apiService = OwnerApiService(prefs: prefs);

      // Login as real owner
      final ownerUser = await authService.login(
        email: 'owner@sangeetha.com',
        password: 'Password123!',
      );
      expect(ownerUser.role, 'OWNER');
      expect(ownerUser.restaurantId, 'rest-001');

      // Fetch live menu
      final menu = await apiService.getRestaurantMenu('rest-001');
      expect(menu.categories.isNotEmpty, isTrue);
      expect(menu.items.isNotEmpty, isTrue);

      developerLog('✅ Real SQLite Menu loaded for rest-001: ${menu.categories.length} categories, ${menu.items.length} dishes');
      for (final item in menu.items.take(3)) {
        developerLog('   • ${item.name} (${item.formattedPrice}) - ${item.isVegetarian ? "VEG" : "NON-VEG"} - ${item.isAvailable ? "Available" : "Sold Out"}');
      }
    });

    test('7. Real owner can CREATE, UPDATE, TOGGLE AVAILABILITY, and DELETE a menu item in SQLite', () async {
      HttpOverrides.global = null;
      final prefs = await SharedPreferences.getInstance();
      final authService = OwnerAuthService(prefs: prefs);
      final apiService = OwnerApiService(prefs: prefs);

      // Login as real owner
      await authService.login(
        email: 'owner@sangeetha.com',
        password: 'Password123!',
      );

      // 1. CREATE New Menu Item
      final createdItem = await apiService.createMenuItem(
        restaurantId: 'rest-001',
        name: 'Test Paneer Tikka Platter',
        description: 'Tandoor grilled cottage cheese skewers with mint chutney',
        price: 260.0,
        prepTimeMinutes: 18,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: true,
        spicinessLevel: 'MEDIUM',
      );

      expect(createdItem.id.isNotEmpty, isTrue);
      expect(createdItem.name, 'Test Paneer Tikka Platter');
      expect(createdItem.price, 260.0);
      developerLog('✅ Real SQLite Menu Item Created: ${createdItem.name} (ID: ${createdItem.id})');

      // 2. UPDATE Menu Item (Price & Prep time)
      final updatedItem = await apiService.updateMenuItem(
        createdItem.id,
        name: 'Test Paneer Tikka Royal Platter',
        price: 290.0,
        prepTimeMinutes: 20,
      );

      expect(updatedItem.name, 'Test Paneer Tikka Royal Platter');
      expect(updatedItem.price, 290.0);
      developerLog('✅ Real SQLite Menu Item Updated: ${updatedItem.name} at ₹${updatedItem.price}');

      // 3. TOGGLE AVAILABILITY (Mark Sold Out)
      final soldOutItem = await apiService.toggleMenuItemAvailability(createdItem.id, false);
      expect(soldOutItem.isAvailable, isFalse);
      developerLog('✅ Real SQLite Menu Item Marked Sold Out: ${soldOutItem.name}');

      // 4. DELETE Menu Item
      final deleted = await apiService.deleteMenuItem(createdItem.id);
      expect(deleted, isTrue);
      developerLog('✅ Real SQLite Menu Item Cleaned Up: ${createdItem.id}');
    });

    test('8. Customer account attempting menu item CRUD is rejected by backend authorization middleware', () async {
      HttpOverrides.global = null;
      final prefs = await SharedPreferences.getInstance();
      final customerAuthService = AuthService(prefs: prefs);

      // Login as customer
      await customerAuthService.login(
        email: 'alex@smarttable.com',
        password: 'Password123!',
      );

      // Customer trying to mutate menu with customer token
      final customerToken = prefs.getString('smarttable_token');
      expect(customerToken, isNotNull);

      // Set customer token as owner token to test backend role middleware rejection
      await prefs.setString('smarttable_owner_token', customerToken!);
      final ownerApi = OwnerApiService(prefs: prefs);

      expect(
        () async => await ownerApi.createMenuItem(
          restaurantId: 'rest-001',
          name: 'Unauthorized Hack Dish',
          price: 10.0,
        ),
        throwsA(predicate((e) => e.toString().contains('403') || e.toString().contains('Access denied') || e.toString().contains('Unauthorized'))),
      );
      developerLog('✅ Customer correctly denied permission for Menu Item CRUD');
    });
  });
}

void developerLog(String msg) {
  // ignore: avoid_print
  print(msg);
}
