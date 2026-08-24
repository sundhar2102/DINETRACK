import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/models/location_model.dart';
import 'package:mobile/models/restaurant_model.dart';
import 'package:mobile/models/user_model.dart';
import 'package:mobile/screens/home/customer_home_screen.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/services/location_service.dart';

class MockLocationService extends LocationService {
  final LocationResult resultToReturn;

  MockLocationService(this.resultToReturn);

  @override
  Future<bool> isServiceEnabled() async => true;

  @override
  Future<LocationResult> getCurrentLocation({bool requestIfNotGranted = true}) async {
    return resultToReturn;
  }
}

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

  group('GPS Location and Nearby Restaurant Tests', () {
    test('LocationModel formats locality, city, state and coordinates correctly', () {
      const loc1 = LocationModel(
        latitude: 13.0604,
        longitude: 80.2437,
        locality: 'Nungambakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
      );
      expect(loc1.displayName, 'Nungambakkam, Chennai');

      const loc2 = LocationModel(
        latitude: 12.9716,
        longitude: 77.5946,
        city: 'Bengaluru',
        state: 'Karnataka',
      );
      expect(loc2.displayName, 'Bengaluru, Karnataka');

      const loc3 = LocationModel(
        latitude: 17.3850,
        longitude: 78.4867,
      );
      expect(loc3.displayName, 'Lat: 17.385, Lng: 78.487');
    });

    test('Real backend Nearby API accepts latitude and longitude and returns distance', () async {
      HttpOverrides.global = null;
      final apiService = ApiService();
      final restaurants = await apiService.getRestaurants(
        lat: 13.0604,
        lng: 80.2437,
        radiusKm: 20,
      );

      expect(restaurants, isNotEmpty);
      expect(restaurants.first.name, isNotEmpty);
      expect(restaurants.first.distanceKm, isNotNull);
      debugPrint('✅ Nearby API returned ${restaurants.length} restaurants sorted by distance:');
      for (final r in restaurants) {
        debugPrint('   • ${r.name}: ${r.distanceKm?.toStringAsFixed(2)} km');
      }
    });

    testWidgets('CustomerHomeScreen displays detected GPS location in top header', (WidgetTester tester) async {
      const detectedLoc = LocationModel(
        latitude: 13.0604,
        longitude: 80.2437,
        locality: 'Nungambakkam',
        city: 'Chennai',
        state: 'Tamil Nadu',
      );

      final mockLocation = MockLocationService(
        const LocationResult(
          state: LocationPermissionState.granted,
          location: detectedLoc,
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: CustomerHomeScreen(
            currentUser: testUser,
            locationService: mockLocation,
            apiService: MockApiService([sampleRestaurant]),
            autoRequestLocation: true,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('CURRENT LOCATION'), findsOneWidget);
      expect(find.text('Nungambakkam, Chennai'), findsOneWidget);
      expect(find.text('Restaurants Near You'), findsOneWidget);
    });

    testWidgets('CustomerHomeScreen shows Location Disabled banner when permission is denied', (WidgetTester tester) async {
      final mockLocation = MockLocationService(
        const LocationResult(
          state: LocationPermissionState.denied,
          errorMessage: 'Location permission is required to show nearby restaurants.',
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: CustomerHomeScreen(
            currentUser: testUser,
            locationService: mockLocation,
            apiService: MockApiService([sampleRestaurant]),
            autoRequestLocation: true,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Location permission required for nearby ranking.'), findsOneWidget);
      expect(find.text('Allow Location'), findsWidgets);
    });

    testWidgets('CustomerHomeScreen shows GPS disabled banner when location service is turned off', (WidgetTester tester) async {
      final mockLocation = MockLocationService(
        const LocationResult(
          state: LocationPermissionState.serviceDisabled,
          errorMessage: 'Location services are turned off.',
        ),
      );

      await tester.pumpWidget(
        MaterialApp(
          home: CustomerHomeScreen(
            currentUser: testUser,
            locationService: mockLocation,
            apiService: MockApiService([sampleRestaurant]),
            autoRequestLocation: true,
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Location services are turned off.'), findsOneWidget);
      expect(find.text('Enable Location'), findsOneWidget);
    });
  });
}

