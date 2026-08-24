import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/home/customer_home_screen.dart';
import 'package:mobile/widgets/restaurant_card.dart';

import 'package:mobile/services/api_service.dart';

class MockApiService extends ApiService {
  final List<RestaurantModel> mockList;
  MockApiService([this.mockList = const []]);

  @override
  Future<List<RestaurantModel>> getRestaurants({
    double? lat,
    double? lng,
    double? radiusKm,
    String? search,
    String? cuisine,
    String? sortBy,
  }) async {
    return mockList;
  }
}

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

  const sampleRestaurant = RestaurantModel(
    id: 'rest-001',
    name: 'Sangeetha Veg Gourmet',
    cuisine: 'South Indian, Vegetarian',
    priceRange: '₹₹',
    rating: 4.8,
    ratingCount: 342,
    isOpen: true,
    isVerified: true,
    verificationStatus: 'APPROVED',
    addressLine1: '12 Nungambakkam High Road',
    city: 'Chennai',
    state: 'Tamil Nadu',
    distanceKm: 1.2,
    availableTablesCount: 5,
  );

  testWidgets('RestaurantCard renders all real restaurant details accurately', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: RestaurantCard(restaurant: sampleRestaurant),
        ),
      ),
    );

    // Verify fields
    expect(find.text('Sangeetha Veg Gourmet'), findsOneWidget);
    expect(find.text('South Indian, Vegetarian'), findsOneWidget);
    expect(find.text('4.8'), findsOneWidget);
    expect(find.text('(342)'), findsOneWidget);
    expect(find.text('OPEN NOW'), findsOneWidget);
    expect(find.text('₹₹'), findsOneWidget);
    expect(find.text('1.2 km'), findsOneWidget);
    expect(find.text('5 Tables Available'), findsOneWidget);
  });

  testWidgets('CustomerHomeScreen renders header, search, categories, and bottom nav', (WidgetTester tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: CustomerHomeScreen(
          currentUser: testUser,
          apiService: MockApiService([sampleRestaurant]),
          autoRequestLocation: false,
        ),
      ),
    );

    // Header & Search
    expect(find.text('CURRENT LOCATION'), findsOneWidget);
    expect(find.text('Search restaurants, cuisines or dishes...'), findsOneWidget);

    // Categories (visible in viewport)
    expect(find.text('All'), findsOneWidget);
    expect(find.text('South Indian'), findsOneWidget);
    expect(find.text('North Indian'), findsOneWidget);

    // Bottom Navigation Bar tabs
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Explore'), findsOneWidget);
    expect(find.text('Bookings'), findsOneWidget);
    expect(find.text('Favorites'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // Switch to Profile Tab
    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();

    expect(find.text('Alex Morgan'), findsOneWidget);
    expect(find.text('alex@smarttable.com'), findsOneWidget);
    expect(find.text('ROLE: CUSTOMER'), findsOneWidget);
    expect(find.text('LOGOUT OF SMART TABLE'), findsOneWidget);
  });
}
