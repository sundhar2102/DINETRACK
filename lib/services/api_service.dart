import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_config.dart';
import '../models/availability_model.dart';
import '../models/menu_category_model.dart';
import '../models/menu_item_model.dart';
import '../models/reservation_model.dart';
import '../models/restaurant_model.dart';
import '../models/table_model.dart';

/// Clean API Service for communicating with DineTrack Backend
class ApiService {
  final Dio _dio;
  final SharedPreferences? prefs;

  ApiService({Dio? dio, this.prefs})
      : _dio = dio ??
            Dio(
              BaseOptions(
                baseUrl: ApiConfig.baseUrl,
                connectTimeout: const Duration(seconds: 10),
                receiveTimeout: const Duration(seconds: 10),
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
              ),
            ) {
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        logPrint: (obj) => developer.log(obj.toString(), name: 'DineTrackAPI'),
      ),
    );
  }

  Future<SharedPreferences> _getPrefs() async {
    final p = prefs;
    if (p != null) return p;
    return await SharedPreferences.getInstance();
  }

  Future<Options> _authOptions() async {
    final prefs = await _getPrefs();
    final token = prefs.getString('smarttable_token');
    return Options(
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      },
    );
  }

  /// Check backend server health status
  Future<bool> checkHealth() async {
    try {
      final host = ApiConfig.baseUrl.replaceAll('/api', '');
      final response = await _dio.get('$host/api/health');
      return response.statusCode == 200;
    } catch (e) {
      developer.log('Health check failed: $e', name: 'DineTrackAPI');
      return false;
    }
  }

  /// Perform Google Login
  Future<Map<String, dynamic>> googleLogin(String idToken, String role) async {
    try {
      final response = await _dio.post(
        '/auth/google',
        data: {'idToken': idToken, 'role': role},
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return data;
        }
      }
      throw Exception('Google login failed: Invalid response format');
    } on DioException catch (e) {
      String errorMessage = 'Google login failed';
      if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = (data is Map<String, dynamic>)
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Google login failed (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Google login error: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  /// Fetch real restaurant list from existing DineTrack backend
  Future<List<RestaurantModel>> getRestaurants({
    double? lat,
    double? lng,
    double? radiusKm,
    String? search,
    String? cuisine,
    String? sortBy,
  }) async {
    try {
      final queryParams = <String, dynamic>{};
      if (lat != null) queryParams['lat'] = lat;
      if (lng != null) queryParams['lng'] = lng;
      if (radiusKm != null) queryParams['radiusKm'] = radiusKm;
      if (search != null && search.isNotEmpty) queryParams['search'] = search;
      if (cuisine != null && cuisine.isNotEmpty && cuisine != 'All') queryParams['cuisine'] = cuisine;
      if (sortBy != null && sortBy.isNotEmpty) queryParams['sortBy'] = sortBy;

      final response = await _dio.get(
        ApiConfig.restaurantsNearby,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final List<dynamic> itemsList;
        if (body is Map<String, dynamic> && body['data'] is List) {
          itemsList = body['data'] as List<dynamic>;
        } else if (body is List) {
          itemsList = body;
        } else {
          itemsList = [];
        }

        return itemsList
            .map((json) => RestaurantModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }

      return [];
    } on DioException catch (e) {
      String errorMessage = 'Failed to load restaurants from server';
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Is the backend running on ${ApiConfig.baseUrl}?';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Cannot connect to Smart Table backend at ${ApiConfig.baseUrl}. Please check server status.';
      } else if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = data is Map<String, dynamic>
            ? (data['message'] ?? data['error'])
            : (data is String ? data : null);
        errorMessage = 'Server Error ${e.response?.statusCode}: ${serverMsg ?? e.message}';
      }
      developer.log(errorMessage, name: 'SmartTableAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Unexpected error: $e', name: 'SmartTableAPI', error: e);
      throw Exception('An unexpected error occurred: $e');
    }
  }

  /// Get single restaurant details by ID (including populated menu and table info)
  Future<RestaurantModel> getRestaurantById(String id, {double? lat, double? lng}) async {
    try {
      final queryParams = <String, dynamic>{};
      if (lat != null) queryParams['lat'] = lat;
      if (lng != null) queryParams['lng'] = lng;

      final response = await _dio.get(
        '${ApiConfig.restaurantDetail}/$id',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = body is Map<String, dynamic> ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return RestaurantModel.fromJson(data);
        }
      }
      throw Exception('Invalid restaurant data returned from server');
    } on DioException catch (e) {
      String errorMessage = 'Failed to load restaurant details';
      if (e.response?.statusCode == 404) {
        errorMessage = 'Restaurant not found';
      } else if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        errorMessage = 'Cannot connect to Smart Table backend. Please verify your connection.';
      } else if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = data is Map<String, dynamic>
            ? (data['message'] ?? data['error'])
            : (data is String ? data : null);
        errorMessage = serverMsg ?? 'Server Error (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Error fetching restaurant $id: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  /// Get Menu categories and items for a restaurant
  Future<List<MenuCategoryModel>> getMenuByRestaurant(String restaurantId) async {
    try {
      final response = await _dio.get('${ApiConfig.menu}/$restaurantId');

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = body is Map<String, dynamic> ? (body['data'] ?? body) : body;

        if (data is Map<String, dynamic>) {
          final categoriesData = data['categories'];
          final allItemsData = data['items'];

          final List<MenuItemModel> allItems = allItemsData is List
              ? allItemsData
                  .whereType<Map<String, dynamic>>()
                  .map((i) => MenuItemModel.fromJson(i))
                  .toList()
              : [];

          if (categoriesData is List && categoriesData.isNotEmpty) {
            return categoriesData
                .whereType<Map<String, dynamic>>()
                .map((catJson) => MenuCategoryModel.fromJson(catJson))
                .toList();
          } else if (allItems.isNotEmpty) {
            return [
              MenuCategoryModel(
                id: 'cat-all',
                restaurantId: restaurantId,
                name: 'All Dishes',
                description: 'Full restaurant menu',
                items: allItems,
              ),
            ];
          }
        }
      }
      return [];
    } on DioException catch (e) {
      String errorMessage = 'Failed to load menu';
      if (e.response?.statusCode == 404) {
        errorMessage = 'Menu not found for this restaurant';
      } else if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        errorMessage = 'Connection error while fetching menu';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Error fetching menu for $restaurantId: $e', name: 'DineTrackAPI');
      throw Exception('Failed to load menu');
    }
  }

  /// Get real tables for a restaurant from existing Table API
  Future<List<TableModel>> getTablesByRestaurantId(String restaurantId) async {
    try {
      final response = await _dio.get('${ApiConfig.tables}/$restaurantId');

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final dynamic rawList = (body is Map<String, dynamic>) ? body['data'] : body;

        if (rawList is List) {
          return rawList
              .whereType<Map<String, dynamic>>()
              .map((json) => TableModel.fromJson(json))
              .toList();
        }
      }
      return [];
    } on DioException catch (e) {
      String errorMessage = 'Failed to load restaurant tables';
      if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = data is Map<String, dynamic>
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Failed to load tables (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Error fetching tables for $restaurantId: $e', name: 'DineTrackAPI');
      throw Exception('Failed to load tables');
    }
  }

  /// Get wait time & live table availability metrics from existing Wait Time API
  Future<AvailabilityModel> getWaitTimeAndAvailability(String restaurantId, {int partySize = 2}) async {
    try {
      final response = await _dio.get(
        '${ApiConfig.waitTime}/$restaurantId',
        queryParameters: {'partySize': partySize},
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;

        if (data is Map<String, dynamic>) {
          return AvailabilityModel.fromJson(data);
        }
      }
      return AvailabilityModel(restaurantId: restaurantId, partySize: partySize);
    } on DioException catch (e) {
      developer.log('Wait time API error: ${e.message}', name: 'DineTrackAPI');
      return AvailabilityModel(restaurantId: restaurantId, partySize: partySize);
    } catch (e) {
      developer.log('Error calculating wait time for $restaurantId: $e', name: 'DineTrackAPI');
      return AvailabilityModel(restaurantId: restaurantId, partySize: partySize);
    }
  }

  /// Create a new reservation using existing DineTrack Reservation API
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
    try {
      final options = await _authOptions();
      final payload = {
        'restaurantId': restaurantId,
        'guestCount': guestCount,
        'reservationDate': reservationDate,
        'reservationTime': reservationTime,
        if (tableId != null && tableId.isNotEmpty) 'tableId': tableId,
        if (specialRequests != null && specialRequests.isNotEmpty) 'specialRequests': specialRequests,
        'estimatedArrivalMinutes': estimatedArrivalMinutes ?? 15,
        if (preOrderItems != null && preOrderItems.isNotEmpty) 'preOrderItems': preOrderItems,
        'paymentMethod': paymentMethod ?? 'RESERVE_PAY_AT_RESTAURANT',
      };

      final response = await _dio.post(
        ApiConfig.reservations,
        data: payload,
        options: options,
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return ReservationModel.fromJson(data);
        }
      }
      throw Exception('Failed to parse reservation response');
    } on DioException catch (e) {
      String errorMessage = 'Reservation request failed';
      if (e.response?.statusCode == 401) {
        errorMessage = 'Please log in to make a table reservation';
      } else if (e.response?.statusCode == 403) {
        final data = e.response?.data;
        errorMessage = (data is Map<String, dynamic>)
            ? (data['message'] ?? 'This restaurant is not currently accepting reservations')
            : 'Reservations not permitted';
      } else if (e.response?.statusCode == 409) {
        final data = e.response?.data;
        errorMessage = (data is Map<String, dynamic>)
            ? (data['message'] ?? 'Selected table/time is already booked. Please choose another.')
            : 'Table booking conflict';
      } else if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = (data is Map<String, dynamic>)
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Booking failed (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Create reservation error: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  /// Fetch authenticated customer's reservations
  Future<List<ReservationModel>> getUserReservations() async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(
        ApiConfig.myReservations,
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final dynamic rawList = (body is Map<String, dynamic>) ? body['data'] : body;

        if (rawList is List) {
          return rawList
              .whereType<Map<String, dynamic>>()
              .map((json) => ReservationModel.fromJson(json))
              .toList();
        }
      }
      return [];
    } on DioException catch (e) {
      developer.log('Failed to fetch user reservations: ${e.message}', name: 'DineTrackAPI');
      return [];
    } catch (e) {
      developer.log('Get user reservations error: $e', name: 'DineTrackAPI');
      return [];
    }
  }

  /// Fetch comprehensive single reservation details (including pre-order items & payment status)
  Future<ReservationModel> getReservationById(String reservationId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(
        '${ApiConfig.reservations}/$reservationId',
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return ReservationModel.fromJson(data);
        }
      }
      throw Exception('Reservation details not found');
    } on DioException catch (e) {
      String errorMessage = 'Failed to load reservation details';
      if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = (data is Map<String, dynamic>)
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Failed to load booking (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Get reservation details error: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  /// Create online payment order with authoritative backend calculation
  Future<Map<String, dynamic>> createPaymentOrder({
    required String reservationId,
    String? orderId,
  }) async {
    try {
      final options = await _authOptions();
      final Map<String, dynamic> payload = {
        'reservationId': reservationId,
      };
      if (orderId != null) payload['orderId'] = orderId;

      final response = await _dio.post(
        ApiConfig.paymentsCreateOrder,
        data: payload,
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return data;
        }
      }
      throw Exception('Failed to initialize payment gateway order');
    } on DioException catch (e) {
      String errorMessage = 'Failed to initialize payment';
      if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = (data is Map<String, dynamic>)
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Payment initialization failed (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Create payment order error: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  /// Verify online payment signature and update database status
  Future<Map<String, dynamic>> verifyPayment({
    required String reservationId,
    String? orderId,
    required String razorpayOrderId,
    required String razorpayPaymentId,
    String? razorpaySignature,
    String paymentMethod = 'ONLINE_UPI',
  }) async {
    try {
      final options = await _authOptions();
      final Map<String, dynamic> payload = {
        'reservationId': reservationId,
        'razorpayOrderId': razorpayOrderId,
        'razorpayPaymentId': razorpayPaymentId,
        'paymentMethod': paymentMethod,
      };
      if (orderId != null) payload['orderId'] = orderId;
      if (razorpaySignature != null) payload['razorpaySignature'] = razorpaySignature;

      final response = await _dio.post(
        ApiConfig.paymentsVerify,
        data: payload,
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return data;
        }
      }
      throw Exception('Payment verification failed on server');
    } on DioException catch (e) {
      String errorMessage = 'Payment verification failed';
      if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = (data is Map<String, dynamic>)
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Payment verification failed (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Verify payment error: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  /// Cancel an existing reservation
  Future<ReservationModel> cancelReservation(String reservationId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.patch(
        '${ApiConfig.reservations}/$reservationId/status',
        data: {'status': 'CANCELLED'},
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final body = response.data;
        final data = (body is Map<String, dynamic>) ? (body['data'] ?? body) : body;
        if (data is Map<String, dynamic>) {
          return ReservationModel.fromJson(data);
        }
      }
      throw Exception('Failed to cancel reservation');
    } on DioException catch (e) {
      String errorMessage = 'Failed to cancel reservation';
      if (e.response != null) {
        final data = e.response?.data;
        final serverMsg = (data is Map<String, dynamic>)
            ? (data['message'] ?? data['error'])
            : null;
        errorMessage = serverMsg ?? 'Cancellation failed (${e.response?.statusCode})';
      }
      developer.log(errorMessage, name: 'DineTrackAPI', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Cancel reservation error: $e', name: 'DineTrackAPI');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }
}

