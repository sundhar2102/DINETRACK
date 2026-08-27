import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

/// Centralized API Configuration for DineTrack Flutter App
class ApiConfig {
  /// Default LAN IP for physical device testing or Android Emulator (Your Wi-Fi IP)
  static const String defaultLanIp = '10.248.32.127';

  /// Compile-time environment variable support: `--dart-define=API_HOST=10.225.208.127`
  static const String _envHost = String.fromEnvironment('API_HOST');

  /// Optional runtime override
  static String? customHost;

  /// Returns the active backend host
  static String get currentHost {
    if (customHost != null && customHost!.isNotEmpty) {
      return customHost!;
    }
    if (_envHost.isNotEmpty) {
      return _envHost;
    }
    if (kIsWeb) {
      return 'localhost';
    }
    if (Platform.isAndroid) {
      // Use computer LAN IP so physical Android phones on local Wi-Fi connect seamlessly
      return defaultLanIp;
    }
    return 'localhost';
  }

  /// Base Host URL determination
  static String get baseUrl => 'http://$currentHost:5000/api';

  /// Socket.IO Engine URL
  static String get socketUrl => 'http://$currentHost:5000';

  // Endpoints mapped to existing DineTrack Backend
  static const String authLogin = '/auth/login';
  static const String authRegister = '/auth/register';
  static const String authMe = '/auth/me';
  
  static const String restaurantsNearby = '/restaurants/nearby';
  static const String restaurantDetail = '/restaurants'; // + /:id
  
  static const String tables = '/tables/restaurant'; // + /:restaurantId
  static const String waitTime = '/wait-time'; // + /:restaurantId
  
  static const String reservations = '/reservations';
  static const String myReservations = '/reservations/my';
  
  static const String orders = '/orders';
  static const String myOrders = '/orders/my';
  
  static const String menu = '/menu'; // + /:restaurantId
  static const String offers = '/offers';
  static const String events = '/events';
  static const String reviews = '/reviews/restaurant'; // + /:restaurantId
  static const String waitlist = '/waitlist';
  
  static const String payments = '/payments';
  static const String paymentsCreateOrder = '/payments/create-order';
  static const String paymentsVerify = '/payments/verify';
  
  static const String notifications = '/notifications';
}
