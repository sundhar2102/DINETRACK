import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import '../../../models/reservation_model.dart';
import '../../../services/owner_api_service.dart';
import '../../../services/owner_auth_service.dart';
import '../../../services/socket_service.dart';
import '../../../widgets/owner_booking_card.dart';
import 'owner_booking_details_screen.dart';

/// Restaurant Owner Reservation Management Screen
class OwnerBookingsScreen extends StatefulWidget {
  final OwnerApiService? apiService;
  final OwnerAuthService? authService;
  final String? initialFilter;

  const OwnerBookingsScreen({
    super.key,
    this.apiService,
    this.authService,
    this.initialFilter,
  });

  @override
  State<OwnerBookingsScreen> createState() => _OwnerBookingsScreenState();
}

class _OwnerBookingsScreenState extends State<OwnerBookingsScreen> {
  late final OwnerApiService _apiService;
  late final OwnerAuthService _authService;

  List<ReservationModel> _allReservations = [];
  bool _isLoading = true;
  String? _errorMessage;
  String _selectedFilter = 'ALL';
  String? _updatingReservationId;
  StreamSubscription? _reservationCreatedSub;
  StreamSubscription? _reservationUpdatedSub;

  final List<Map<String, String>> _filterTabs = [
    {'label': 'All', 'status': 'ALL'},
    {'label': 'Pending', 'status': 'PENDING'},
    {'label': 'Confirmed', 'status': 'CONFIRMED'},
    {'label': 'Seated', 'status': 'SEATED'},
    {'label': 'Completed', 'status': 'COMPLETED'},
    {'label': 'Cancelled', 'status': 'CANCELLED'},
    {'label': 'Rejected', 'status': 'REJECTED'},
  ];

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    _authService = widget.authService ?? OwnerAuthService();
    if (widget.initialFilter != null) {
      _selectedFilter = widget.initialFilter!;
    }
    _loadReservations();
    _initSocketListeners();
  }

  void _initSocketListeners() {
    final socketService = SocketService();
    _reservationCreatedSub = socketService.onReservationCreated.listen((_) {
      if (mounted) _loadReservations();
    });
    _reservationUpdatedSub = socketService.onReservationUpdated.listen((_) {
      if (mounted) _loadReservations();
    });
  }

  @override
  void dispose() {
    _reservationCreatedSub?.cancel();
    _reservationUpdatedSub?.cancel();
    super.dispose();
  }

  Future<void> _loadReservations() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final user = _authService.currentUser ?? await _apiService.getMe();
      final restaurantId = user.restaurantId;
      if (restaurantId == null || restaurantId.isEmpty) {
        throw Exception('No restaurant assigned to this owner account');
      }

      final list = await _apiService.getRestaurantReservations(restaurantId);
      if (mounted) {
        setState(() {
          _allReservations = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceFirst('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  List<ReservationModel> get _filteredReservations {
    if (_selectedFilter == 'ALL') {
      return _allReservations;
    }
    return _allReservations
        .where((r) => r.status.toUpperCase() == _selectedFilter.toUpperCase())
        .toList();
  }

  Future<void> _handleStatusUpdate(ReservationModel reservation, String newStatus) async {
    setState(() {
      _updatingReservationId = reservation.id;
    });

    try {
      final updated = await _apiService.updateReservationStatus(reservation.id, newStatus);
      if (mounted) {
        setState(() {
          final index = _allReservations.indexWhere((r) => r.id == reservation.id);
          if (index != -1) {
            _allReservations[index] = updated;
          }
          _updatingReservationId = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.emerald,
            content: Text('Reservation #${reservation.id.substring(0, 8)} status updated to $newStatus'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _updatingReservationId = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppTheme.red,
            content: Text(e.toString().replaceFirst('Exception: ', '')),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        title: const Text(
          'Reservation Manager',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            tooltip: 'Refresh Bookings',
            onPressed: _loadReservations,
          ),
        ],
      ),
      body: Column(
        children: [
          // 1. Filter Chips Row
          Container(
            color: AppTheme.darkSurface,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filterTabs.map((tab) {
                  final isSelected = _selectedFilter == tab['status'];
                  return Padding(
                    padding: const EdgeInsets.only(right: 8.0),
                    child: ChoiceChip(
                      label: Text(
                        tab['label']!,
                        style: TextStyle(
                          color: isSelected ? Colors.white : AppTheme.textSecondary,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 12,
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: AppTheme.brand500,
                      backgroundColor: AppTheme.darkCard,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: BorderSide(
                          color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
                        ),
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedFilter = tab['status']!;
                          });
                        }
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),

          // 2. Reservation List or States
          Expanded(
            child: _buildBody(),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.brand500),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: AppTheme.red),
              const SizedBox(height: 12),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadReservations,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Try Again'),
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brand500),
              ),
            ],
          ),
        ),
      );
    }

    final list = _filteredReservations;

    if (list.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadReservations,
        color: AppTheme.brand500,
        child: ListView(
          padding: const EdgeInsets.all(32.0),
          children: [
            const SizedBox(height: 60),
            Center(
              child: Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: AppTheme.darkCard,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.event_seat_outlined, size: 48, color: AppTheme.textMuted),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _selectedFilter == 'ALL'
                  ? 'No reservations found'
                  : 'No $_selectedFilter reservations',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'New reservations made by customers will appear here in real time.',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadReservations,
      color: AppTheme.brand500,
      child: ListView.separated(
        padding: const EdgeInsets.all(16.0),
        itemCount: list.length,
        separatorBuilder: (_, _) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final res = list[index];
          return OwnerBookingCard(
            reservation: res,
            isUpdating: _updatingReservationId == res.id,
            onTap: () async {
              final updated = await Navigator.push<ReservationModel?>(
                context,
                MaterialPageRoute(
                  builder: (_) => OwnerBookingDetailsScreen(
                    reservation: res,
                    apiService: _apiService,
                  ),
                ),
              );
              if (updated != null && mounted) {
                setState(() {
                  final idx = _allReservations.indexWhere((r) => r.id == updated.id);
                  if (idx != -1) {
                    _allReservations[idx] = updated;
                  }
                });
              }
            },
            onStatusChanged: (newStatus) => _handleStatusUpdate(res, newStatus),
          );
        },
      ),
    );
  }
}
