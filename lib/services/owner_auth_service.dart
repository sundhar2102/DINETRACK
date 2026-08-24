import 'dart:convert';
import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_config.dart';
import '../models/restaurant_model.dart';
import '../models/user_model.dart';

/// Authentication Service dedicated to DineTrack Restaurant Partners & Owners
class OwnerAuthService {
  static const String _keyOwnerToken = 'smarttable_owner_token';
  static const String _keyOwnerUser = 'smarttable_owner_user';
  static const String _keyOwnerRestaurant = 'smarttable_owner_restaurant';

  static final OwnerAuthService _instance = OwnerAuthService._internal();
  factory OwnerAuthService({Dio? dio, SharedPreferences? prefs}) {
    if (dio != null) _instance._dio = dio;
    if (prefs != null) _instance._prefs = prefs;
    return _instance;
  }

  OwnerAuthService._internal()
      : _dio = Dio(
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
        logPrint: (obj) => developer.log(obj.toString(), name: 'DineTrackOwnerAuth'),
      ),
    );
  }

  Dio _dio;
  SharedPreferences? _prefs;

  UserModel? _currentUser;
  String? _token;
  RestaurantModel? _restaurant;

  UserModel? get currentUser => _currentUser;
  String? get currentToken => _token;
  RestaurantModel? get restaurant => _restaurant;

  /// True if owner is logged in and possesses a valid OWNER role
  bool get isAuthenticated =>
      _token != null && _currentUser != null && _currentUser!.isOwner;

  Future<SharedPreferences> _getPrefs() async {
    final p = _prefs;
    if (p != null) return p;
    return await SharedPreferences.getInstance();
  }

  /// 1. Restaurant Owner Login with Strict Role Validation
  Future<UserModel> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.authLogin,
        data: {
          'email': email.trim(),
          'password': password,
        },
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

        final dynamic rawUser = data['user'];
        final Map<String, dynamic> userJson = (rawUser is Map)
            ? Map<String, dynamic>.from(rawUser)
            : <String, dynamic>{};
        final token = (data['token'] ?? '').toString();

        final user = UserModel.fromJson(userJson);

        // Strict Role Validation: Must be OWNER or RESTAURANT_OWNER
        if (!user.isOwner && !user.isAdmin) {
          developer.log(
            'Unauthorized role login attempt: ${user.email} (Role: ${user.role})',
            name: 'DineTrackOwnerAuth',
          );
          throw Exception('This account does not have restaurant-owner access.');
        }

        // Persist Owner Session
        _token = token;
        _currentUser = user;

        final prefs = await _getPrefs();
        await prefs.setString(_keyOwnerToken, token);
        await prefs.setString(_keyOwnerUser, jsonEncode(user.toJson()));

        developer.log('Restaurant Owner logged in: ${user.email}', name: 'DineTrackOwnerAuth');
        return user;
      }

      throw Exception('Login failed. Please check your credentials.');
    } on DioException catch (e) {
      String errorMessage = 'Login failed';
      if (e.response != null && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          final msg = map['message']?.toString() ?? map['error']?.toString();
          if (msg != null && msg.trim().isNotEmpty) {
            errorMessage = msg;
          } else {
            errorMessage = 'Invalid email or password';
          }
        } else if (data is String && data.trim().isNotEmpty) {
          errorMessage = data;
        }
      } else if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        errorMessage = 'Connection timeout. Is the server running?';
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Unable to connect to server at ${ApiConfig.baseUrl}';
      }
      developer.log('Owner Login error: $errorMessage', name: 'DineTrackOwnerAuth', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Unexpected Owner login error: $e', name: 'DineTrackOwnerAuth', error: e);
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }
  }

  /// 2. Restore Stored Owner Session on App Startup
  Future<UserModel?> restoreSession() async {
    try {
      final prefs = await _getPrefs();
      final token = prefs.getString(_keyOwnerToken);
      final userJsonStr = prefs.getString(_keyOwnerUser);

      if (token == null || userJsonStr == null) {
        _token = null;
        _currentUser = null;
        return null;
      }

      final Map<String, dynamic> userMap = jsonDecode(userJsonStr);
      final user = UserModel.fromJson(userMap);

      if (!user.isOwner && !user.isAdmin) {
        await logout();
        return null;
      }

      _token = token;
      _currentUser = user;

      developer.log('Owner session restored: ${user.email} (Role: ${user.role})', name: 'DineTrackOwnerAuth');
      return user;
    } catch (e) {
      developer.log('Failed to restore owner session: $e', name: 'DineTrackOwnerAuth', error: e);
      _token = null;
      _currentUser = null;
      return null;
    }
  }

  /// 3. Owner Logout (Clears only Owner session storage)
  Future<void> logout() async {
    try {
      if (_token != null) {
        await _dio.post(
          '/auth/logout',
          options: Options(headers: {'Authorization': 'Bearer $_token'}),
        );
      }
    } catch (e) {
      developer.log('Owner backend logout warning: $e', name: 'DineTrackOwnerAuth');
    } finally {
      _token = null;
      _currentUser = null;
      _restaurant = null;

      final prefs = await _getPrefs();
      await prefs.remove(_keyOwnerToken);
      await prefs.remove(_keyOwnerUser);
      await prefs.remove(_keyOwnerRestaurant);
      developer.log('Owner logged out and session cleared', name: 'DineTrackOwnerAuth');
    }
  }
}
