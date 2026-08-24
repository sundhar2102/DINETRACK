import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_config.dart';
import '../models/menu_category_model.dart';
import '../models/menu_item_model.dart';
import '../models/reservation_model.dart';
import '../models/restaurant_model.dart';
import '../models/table_model.dart';
import '../models/user_model.dart';

/// API Service dedicated to DineTrack Restaurant Owner Operations
class OwnerApiService {
  final Dio _dio;
  final SharedPreferences? prefs;

  OwnerApiService({Dio? dio, this.prefs})
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
        logPrint: (obj) => developer.log(obj.toString(), name: 'DineTrackOwnerAPI'),
      ),
    );
  }

  Future<SharedPreferences> _getPrefs() async {
    final p = prefs;
    if (p != null) return p;
    return await SharedPreferences.getInstance();
  }

  Future<Options> _authOptions() async {
    final p = await _getPrefs();
    final token = p.getString('smarttable_owner_token') ?? p.getString('smarttable_auth_token');
    return Options(
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      },
    );
  }

  /// Fetch Authenticated Owner Profile & Associated Restaurant
  Future<UserModel> getMe() async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(ApiConfig.authMe, options: options);

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return UserModel.fromJson(data);
      }

      throw Exception('Failed to fetch owner profile');
    } on DioException catch (e) {
      String msg = 'Failed to load owner profile';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      throw Exception(msg);
    }
  }

  /// Fetch Full Restaurant Details for the Owner's assigned Restaurant
  Future<RestaurantModel> getOwnerRestaurant(String restaurantId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(
        '${ApiConfig.restaurantDetail}/$restaurantId',
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return RestaurantModel.fromJson(data);
      }

      throw Exception('Restaurant data not found for ID: $restaurantId');
    } on DioException catch (e) {
      String msg = 'Failed to load restaurant details';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      throw Exception(msg);
    }
  }

  /// Fetch Reservations for Restaurant
  Future<List<ReservationModel>> getRestaurantReservations(
    String restaurantId, {
    String? status,
  }) async {
    try {
      final options = await _authOptions();
      final queryParams = <String, dynamic>{};
      if (status != null && status.isNotEmpty && status != 'ALL') {
        queryParams['status'] = status;
      }

      final response = await _dio.get(
        '${ApiConfig.reservations}/restaurant/$restaurantId',
        queryParameters: queryParams,
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawList = body['data'] ?? [];

        if (rawList is List) {
          return rawList
              .whereType<Map<String, dynamic>>()
              .map((json) => ReservationModel.fromJson(json))
              .toList();
        }
        return [];
      }

      return [];
    } on DioException catch (e) {
      String msg = 'Failed to load restaurant reservations';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error fetching reservations: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Fetch Tables for Restaurant
  Future<List<TableModel>> getRestaurantTables(String restaurantId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(
        '${ApiConfig.tables}/$restaurantId',
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawList = body['data'] ?? [];

        if (rawList is List) {
          return rawList
              .whereType<Map<String, dynamic>>()
              .map((json) => TableModel.fromJson(json))
              .toList();
        }
        return [];
      }

      return [];
    } on DioException catch (e) {
      String msg = 'Failed to load tables';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error fetching tables: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Fetch Real-Time Analytics / Statistics for Restaurant
  Future<Map<String, dynamic>> getRestaurantAnalytics(String restaurantId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(
        '/analytics/restaurant/$restaurantId',
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        return (rawData is Map) ? Map<String, dynamic>.from(rawData) : <String, dynamic>{};
      }

      return {};
    } on DioException catch (e) {
      String msg = 'Failed to load analytics';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error fetching analytics: $msg', name: 'DineTrackOwnerAPI', error: e);
      return {};
    }
  }

  /// Update Reservation Status (e.g. PENDING -> CONFIRMED, REJECTED, SEATED, COMPLETED, CANCELLED)
  Future<ReservationModel> updateReservationStatus(
    String reservationId,
    String status,
  ) async {
    try {
      final options = await _authOptions();
      final response = await _dio.patch(
        '${ApiConfig.reservations}/$reservationId/status',
        data: {'status': status.toUpperCase()},
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return ReservationModel.fromJson(data);
      }

      throw Exception('Failed to update reservation status');
    } on DioException catch (e) {
      String msg = 'Failed to update reservation';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error updating reservation: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Create a New Table in Restaurant Floor
  Future<TableModel> createTable(
    String restaurantId, {
    required String tableNumber,
    required int capacity,
    String? section,
  }) async {
    try {
      final options = await _authOptions();
      final response = await _dio.post(
        '${ApiConfig.tables}/$restaurantId',
        data: {
          'table_number': tableNumber.trim(),
          'capacity': capacity,
          'section': (section != null && section.trim().isNotEmpty) ? section.trim() : 'Main Dining',
        },
        options: options,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return TableModel.fromJson(data);
      }

      throw Exception('Failed to create table');
    } on DioException catch (e) {
      String msg = 'Failed to create table';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error creating table: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Update Existing Table (number, capacity, section)
  Future<TableModel> updateTable(
    String tableId, {
    String? tableNumber,
    int? capacity,
    String? section,
  }) async {
    try {
      final options = await _authOptions();
      final body = <String, dynamic>{};
      if (tableNumber != null && tableNumber.trim().isNotEmpty) {
        body['table_number'] = tableNumber.trim();
      }
      if (capacity != null && capacity > 0) {
        body['capacity'] = capacity;
      }
      if (section != null && section.trim().isNotEmpty) {
        body['section'] = section.trim();
      }

      final response = await _dio.patch(
        '/tables/$tableId',
        data: body,
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return TableModel.fromJson(data);
      }

      throw Exception('Failed to update table');
    } on DioException catch (e) {
      String msg = 'Failed to update table';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error updating table: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Delete Table from Floor Plan
  Future<bool> deleteTable(String tableId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.delete(
        '/tables/$tableId',
        options: options,
      );

      if (response.statusCode == 200) {
        return true;
      }
      throw Exception('Failed to delete table');
    } on DioException catch (e) {
      String msg = 'Failed to delete table';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error deleting table: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Update Live Table Status (e.g. AVAILABLE, OCCUPIED, RESERVED, CLEANING, BLOCKED, MAINTENANCE)
  Future<TableModel> updateTableStatus(
    String tableId,
    String status,
  ) async {
    try {
      final options = await _authOptions();
      final response = await _dio.patch(
        '/tables/$tableId/status',
        data: {'status': status.toUpperCase()},
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return TableModel.fromJson(data);
      }

      throw Exception('Failed to update table status');
    } on DioException catch (e) {
      String msg = 'Failed to update table status';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error updating table status: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Fetch Menu (Categories and Items) for Restaurant
  Future<({List<MenuCategoryModel> categories, List<MenuItemModel> items})> getRestaurantMenu(
    String restaurantId,
  ) async {
    try {
      final options = await _authOptions();
      final response = await _dio.get(
        '${ApiConfig.menu}/$restaurantId',
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> body = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = body['data'] ?? body;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        List<MenuCategoryModel> categories = [];
        if (data['categories'] is List) {
          categories = (data['categories'] as List)
              .whereType<Map<String, dynamic>>()
              .map((json) => MenuCategoryModel.fromJson(json))
              .toList();
        }

        List<MenuItemModel> items = [];
        if (data['items'] is List) {
          items = (data['items'] as List)
              .whereType<Map<String, dynamic>>()
              .map((json) => MenuItemModel.fromJson(json))
              .toList();
        }

        return (categories: categories, items: items);
      }

      return (categories: <MenuCategoryModel>[], items: <MenuItemModel>[]);
    } on DioException catch (e) {
      String msg = 'Failed to load restaurant menu';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error fetching menu: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Create a New Menu Item for Restaurant
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
    try {
      final options = await _authOptions();
      final body = <String, dynamic>{
        'restaurant_id': restaurantId,
        'category_id': (categoryId != null && categoryId.isNotEmpty) ? categoryId : null,
        'name': name.trim(),
        'description': description?.trim() ?? '',
        'price': price,
        'prep_time_minutes': prepTimeMinutes,
        'is_vegetarian': isVegetarian ? 1 : 0,
        'is_vegan': isVegan ? 1 : 0,
        'is_gluten_free': isGlutenFree ? 1 : 0,
        'image_url': (imageUrl != null && imageUrl.trim().isNotEmpty)
            ? imageUrl.trim()
            : 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600',
        'spiciness_level': spicinessLevel.toUpperCase(),
      };

      final response = await _dio.post(
        '${ApiConfig.menu}/items',
        data: body,
        options: options,
      );

      if ((response.statusCode == 200 || response.statusCode == 201) && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> resMap = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = resMap['data'] ?? resMap;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return MenuItemModel.fromJson(data);
      }

      throw Exception('Failed to create menu item');
    } on DioException catch (e) {
      String msg = 'Failed to create menu item';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error creating menu item: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Update Existing Menu Item
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
    try {
      final options = await _authOptions();
      final body = <String, dynamic>{};
      if (name != null && name.trim().isNotEmpty) body['name'] = name.trim();
      if (description != null) body['description'] = description.trim();
      if (price != null) body['price'] = price;
      if (prepTimeMinutes != null) body['prep_time_minutes'] = prepTimeMinutes;
      if (isVegetarian != null) body['is_vegetarian'] = isVegetarian ? 1 : 0;
      if (isVegan != null) body['is_vegan'] = isVegan ? 1 : 0;
      if (isGlutenFree != null) body['is_gluten_free'] = isGlutenFree ? 1 : 0;
      if (isAvailable != null) body['is_available'] = isAvailable ? 1 : 0;
      if (imageUrl != null && imageUrl.trim().isNotEmpty) body['image_url'] = imageUrl.trim();
      if (spicinessLevel != null) body['spiciness_level'] = spicinessLevel.toUpperCase();

      final response = await _dio.patch(
        '${ApiConfig.menu}/items/$itemId',
        data: body,
        options: options,
      );

      if (response.statusCode == 200 && response.data != null) {
        final dynamic rawBody = response.data;
        final Map<String, dynamic> resMap = (rawBody is Map)
            ? Map<String, dynamic>.from(rawBody)
            : <String, dynamic>{};
        final dynamic rawData = resMap['data'] ?? resMap;
        final Map<String, dynamic> data = (rawData is Map)
            ? Map<String, dynamic>.from(rawData)
            : <String, dynamic>{};

        return MenuItemModel.fromJson(data);
      }

      throw Exception('Failed to update menu item');
    } on DioException catch (e) {
      String msg = 'Failed to update menu item';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error updating menu item: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }

  /// Toggle Menu Item Availability (Available <-> Sold Out)
  Future<MenuItemModel> toggleMenuItemAvailability(
    String itemId,
    bool isAvailable,
  ) async {
    return updateMenuItem(itemId, isAvailable: isAvailable);
  }

  /// Delete Menu Item
  Future<bool> deleteMenuItem(String itemId) async {
    try {
      final options = await _authOptions();
      final response = await _dio.delete(
        '${ApiConfig.menu}/items/$itemId',
        options: options,
      );

      if (response.statusCode == 200) {
        return true;
      }
      throw Exception('Failed to delete menu item');
    } on DioException catch (e) {
      String msg = 'Failed to delete menu item';
      if (e.response?.data is Map) {
        final map = Map<String, dynamic>.from(e.response!.data);
        msg = map['message']?.toString() ?? msg;
      }
      developer.log('Error deleting menu item: $msg', name: 'DineTrackOwnerAPI', error: e);
      throw Exception(msg);
    }
  }
}
