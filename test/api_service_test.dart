import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/services/api_service.dart';

void main() {
  test('ApiService connects to existing backend and retrieves real SQLite restaurants', () async {
    final apiService = ApiService();
    
    // Test health
    final isHealthy = await apiService.checkHealth();
    expect(isHealthy, isTrue, reason: 'Existing DineTrack backend should be running on localhost:5000');

    // Test real restaurants query
    final restaurants = await apiService.getRestaurants();
    expect(restaurants, isNotEmpty, reason: 'Database should contain restaurants');
    
    // Verify first restaurant fields
    final first = restaurants.first;
    expect(first.name, isNotEmpty);
    expect(first.cuisine, isNotEmpty);
    expect(first.rating, greaterThan(0));
    expect(first.fullAddress, isNotEmpty);
    
    // ignore: avoid_print
    print('✅ Verified Flutter ApiService retrieved ${restaurants.length} real restaurants from SQLite DB!');
    for (final r in restaurants) {
      // ignore: avoid_print
      print('   • ${r.name} (${r.cuisine}) - Rating: ${r.formattedRating} ⭐, ${r.fullAddress}');
    }
  });
}
