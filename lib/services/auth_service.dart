import 'dart:convert';
import 'dart:developer' as developer;
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/api_config.dart';
import '../models/user_model.dart';

/// Clean Authentication Service communicating with existing DineTrack Auth APIs
class AuthService {
  static const String _keyToken = 'smarttable_token';
  static const String _keyUser = 'smarttable_user';

  static final AuthService _instance = AuthService._internal();
  factory AuthService({Dio? dio, SharedPreferences? prefs}) {
    if (dio != null) _instance._dio = dio;
    if (prefs != null) _instance._prefs = prefs;
    return _instance;
  }

  AuthService._internal()
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
        logPrint: (obj) => developer.log(obj.toString(), name: 'DineTrackAuth'),
      ),
    );
  }

  Dio _dio;
  SharedPreferences? _prefs;

  UserModel? _currentUser;
  String? _token;

  UserModel? get currentUser => _currentUser;
  String? get currentToken => _token;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty && _currentUser != null;

  Future<SharedPreferences> _getPrefs() async {
    final p = _prefs;
    if (p != null) return p;
    return await SharedPreferences.getInstance();
  }


  /// 1. Customer Login
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

        // Persist session
        _token = token;
        _currentUser = user;

        final prefs = await _getPrefs();
        await prefs.setString(_keyToken, token);
        await prefs.setString(_keyUser, jsonEncode(user.toJson()));

        if (user.isOwner) {
          await prefs.setString('smarttable_owner_token', token);
          await prefs.setString('smarttable_owner_user', jsonEncode(user.toJson()));
          if (user.restaurantId != null) {
            await prefs.setString('smarttable_owner_restaurant', jsonEncode(user.toJson()));
          }
        }

        developer.log('User logged in: ${user.email} (Role: ${user.role})', name: 'SmartTableAuth');
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
      developer.log('Login error: $errorMessage', name: 'DineTrackAuth', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Unexpected login error: $e', name: 'DineTrackAuth', error: e);
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }


  }

  /// 2. Customer Signup / Register
  Future<UserModel> signup({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConfig.authRegister,
        data: {
          'name': name.trim(),
          'email': email.trim(),
          'phone': phone.trim(),
          'password': password,
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
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

        // Persist session
        _token = token;
        _currentUser = user;

        final prefs = await _getPrefs();
        await prefs.setString(_keyToken, token);
        await prefs.setString(_keyUser, jsonEncode(user.toJson()));

        developer.log('New customer registered: ${user.email}', name: 'DineTrackAuth');
        return user;
      }

      throw Exception('Registration failed.');
    } on DioException catch (e) {
      String errorMessage = 'Registration failed';
      if (e.response != null && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map) {
          final map = Map<String, dynamic>.from(data);
          errorMessage = map['message']?.toString() ?? map['error']?.toString() ?? 'Email may already be registered';
        } else if (data is String) {
          errorMessage = data;
        }
      } else if (e.type == DioExceptionType.connectionError) {
        errorMessage = 'Unable to connect to server at ${ApiConfig.baseUrl}';
      }
      developer.log('Signup error: $errorMessage', name: 'DineTrackAuth', error: e);
      throw Exception(errorMessage);
    } catch (e) {
      developer.log('Unexpected signup error: $e', name: 'DineTrackAuth', error: e);
      throw Exception(e.toString().replaceFirst('Exception: ', ''));
    }

  }

  /// 3. Restore Stored Session on App Launch
  Future<UserModel?> restoreSession() async {
    try {
      final prefs = await _getPrefs();
      final storedToken = prefs.getString(_keyToken);
      final storedUserJson = prefs.getString(_keyUser);

      if (storedToken == null || storedToken.isEmpty) {
        return null;
      }

      _token = storedToken;

      if (storedUserJson != null && storedUserJson.isNotEmpty) {
        _currentUser = UserModel.fromJson(jsonDecode(storedUserJson) as Map<String, dynamic>);
      }

      // Verify token with backend /auth/me
      try {
        final meResponse = await _dio.get(
          ApiConfig.authMe,
          options: Options(
            headers: {'Authorization': 'Bearer $storedToken'},
          ),
        );

        if (meResponse.statusCode == 200 && meResponse.data != null) {
          final userJson = meResponse.data['data'] as Map<String, dynamic>;
          final freshUser = UserModel.fromJson(userJson);
          _currentUser = freshUser;
          await prefs.setString(_keyUser, jsonEncode(freshUser.toJson()));
          if (freshUser.isOwner) {
            await prefs.setString('smarttable_owner_token', storedToken);
            await prefs.setString('smarttable_owner_user', jsonEncode(freshUser.toJson()));
          }
          return freshUser;
        }
      } catch (e) {
        developer.log('Token validation offline/fallback: using cached user', name: 'SmartTableAuth');
        // Return cached user if offline or keep active
        if (_currentUser != null) {
          if (_currentUser!.isOwner) {
            await prefs.setString('smarttable_owner_token', storedToken);
            await prefs.setString('smarttable_owner_user', jsonEncode(_currentUser!.toJson()));
          }
          return _currentUser;
        }
      }

      return _currentUser;
    } catch (e) {
      developer.log('Session restore error: $e', name: 'SmartTableAuth');
      await logout();
      return null;
    }
  }

  /// 4. Logout & Clear Stored Credentials
  Future<void> logout() async {
    try {
      if (_token != null) {
        try {
          await _dio.post(
            '/auth/logout',
            options: Options(headers: {'Authorization': 'Bearer $_token'}),
          );
        } catch (_) {}
      }

      _token = null;
      _currentUser = null;

      final prefs = await _getPrefs();
      await prefs.remove(_keyToken);
      await prefs.remove(_keyUser);
      await prefs.remove('smarttable_owner_token');
      await prefs.remove('smarttable_owner_user');
      await prefs.remove('smarttable_owner_restaurant');
      developer.log('Session cleared', name: 'SmartTableAuth');
    } catch (e) {
      developer.log('Logout error: $e', name: 'SmartTableAuth');
    }
  }
}
