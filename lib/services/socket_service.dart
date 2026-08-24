import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import '../core/api_config.dart';

/// Real-Time Socket.IO Synchronization Service for DineTrack
/// Interconnects Web & Mobile apps with the live backend events
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  io.Socket? _socket;
  bool _isConnected = false;

  bool get isConnected => _isConnected;

  // Stream Controllers for live event broadcasts
  final _tableStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _reservationCreatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _reservationUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _orderStatusController = StreamController<Map<String, dynamic>>.broadcast();
  final _menuItemUpdatedController = StreamController<Map<String, dynamic>>.broadcast();
  final _waitlistUpdatedController = StreamController<Map<String, dynamic>>.broadcast();

  Stream<Map<String, dynamic>> get onTableStatusChanged => _tableStatusController.stream;
  Stream<Map<String, dynamic>> get onReservationCreated => _reservationCreatedController.stream;
  Stream<Map<String, dynamic>> get onReservationUpdated => _reservationUpdatedController.stream;
  Stream<Map<String, dynamic>> get onOrderStatusChanged => _orderStatusController.stream;
  Stream<Map<String, dynamic>> get onMenuItemUpdated => _menuItemUpdatedController.stream;
  Stream<Map<String, dynamic>> get onWaitlistUpdated => _waitlistUpdatedController.stream;

  /// Initialize and connect to the backend Socket.IO engine
  void initSocket({String? userId, String? restaurantId}) {
    if (_socket != null && _isConnected) {
      _joinRooms(userId: userId, restaurantId: restaurantId);
      return;
    }

    try {
      final socketUrl = ApiConfig.socketUrl;
      _socket = io.io(
        socketUrl,
        io.OptionBuilder()
            .setTransports(['websocket', 'polling'])
            .enableAutoConnect()
            .enableReconnection()
            .setReconnectionAttempts(10)
            .build(),
      );

      _socket?.onConnect((_) {
        debugPrint('⚡ Socket.IO Connected to Server: ${_socket?.id}');
        _isConnected = true;
        _socket?.emit('join_discovery');
        _joinRooms(userId: userId, restaurantId: restaurantId);
      });

      _socket?.onDisconnect((_) {
        debugPrint('🔌 Socket.IO Disconnected');
        _isConnected = false;
      });

      // Register Event Listeners matching Web Frontend
      _socket?.on('table_status_changed', (data) {
        if (data is Map) {
          _tableStatusController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket?.on('reservation_created', (data) {
        if (data is Map) {
          _reservationCreatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket?.on('reservation_updated', (data) {
        if (data is Map) {
          _reservationUpdatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket?.on('order_status_changed', (data) {
        if (data is Map) {
          _orderStatusController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket?.on('menu_item_updated', (data) {
        if (data is Map) {
          _menuItemUpdatedController.add(Map<String, dynamic>.from(data));
        }
      });

      _socket?.on('waitlist_updated', (data) {
        if (data is Map) {
          _waitlistUpdatedController.add(Map<String, dynamic>.from(data));
        }
      });

    } catch (e) {
      debugPrint('Socket.IO initialization error: $e');
    }
  }

  void _joinRooms({String? userId, String? restaurantId}) {
    if (userId != null && userId.isNotEmpty) {
      _socket?.emit('join_user', userId);
    }
    if (restaurantId != null && restaurantId.isNotEmpty) {
      _socket?.emit('join_restaurant', restaurantId);
    }
  }

  void joinRestaurant(String restaurantId) {
    if (restaurantId.isNotEmpty) {
      _socket?.emit('join_restaurant', restaurantId);
    }
  }

  void leaveRestaurant(String restaurantId) {
    if (restaurantId.isNotEmpty) {
      _socket?.emit('leave_restaurant', restaurantId);
    }
  }

  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
    _isConnected = false;
  }
}
