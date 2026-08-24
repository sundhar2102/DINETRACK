import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import '../../../models/reservation_model.dart';
import '../../../models/restaurant_model.dart';
import '../../../models/table_model.dart';
import '../../../models/user_model.dart';
import '../../../services/owner_api_service.dart';
import '../../../services/owner_auth_service.dart';
import '../../../widgets/owner_booking_card.dart';
import '../../auth/login_screen.dart';
import '../bookings/owner_booking_details_screen.dart';
import '../bookings/owner_bookings_screen.dart';
import '../menu/owner_menu_screen.dart';
import '../profile/owner_profile_screen.dart';
import '../../../services/socket_service.dart';
import '../tables/owner_tables_screen.dart';

/// Restaurant Owner Dashboard Screen for DineTrack Partners
class OwnerDashboardScreen extends StatefulWidget {
  final UserModel ownerUser;
  final OwnerApiService? apiService;
  final OwnerAuthService? authService;

  const OwnerDashboardScreen({
    super.key,
    required this.ownerUser,
    this.apiService,
    this.authService,
  });

  @override
  State<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends State<OwnerDashboardScreen> {
  late final OwnerApiService _apiService;
  late final OwnerAuthService _authService;

  RestaurantModel? _restaurant;
  List<ReservationModel> _todayReservations = [];
  List<ReservationModel> _allReservations = [];
  List<TableModel> _tables = [];
  Map<String, dynamic> _analytics = {};

  bool _isLoading = true;
  String? _errorMessage;
  int _selectedTabIndex = 0;

  // Socket stream subscriptions
  StreamSubscription? _tableStatusSub;
  StreamSubscription? _reservationCreatedSub;
  StreamSubscription? _reservationUpdatedSub;
  StreamSubscription? _orderStatusSub;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    _authService = widget.authService ?? OwnerAuthService();
    _loadDashboardData();
    _initSocketListeners();
  }

  void _initSocketListeners() {
    final restId = widget.ownerUser.restaurantId;
    final userId = widget.ownerUser.id;
    
    final socketService = SocketService();
    socketService.initSocket(userId: userId, restaurantId: restId);

    _tableStatusSub = socketService.onTableStatusChanged.listen((_) {
      if (mounted) _loadDashboardData();
    });
    _reservationCreatedSub = socketService.onReservationCreated.listen((_) {
      if (mounted) _loadDashboardData();
    });
    _reservationUpdatedSub = socketService.onReservationUpdated.listen((_) {
      if (mounted) _loadDashboardData();
    });
    _orderStatusSub = socketService.onOrderStatusChanged.listen((_) {
      if (mounted) _loadDashboardData();
    });
  }

  @override
  void dispose() {
    _tableStatusSub?.cancel();
    _reservationCreatedSub?.cancel();
    _reservationUpdatedSub?.cancel();
    _orderStatusSub?.cancel();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    final restId = widget.ownerUser.restaurantId;
    if (restId == null || restId.isEmpty) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'No restaurant assigned to this owner account.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Fetch Restaurant details
      final restaurantFuture = _apiService.getOwnerRestaurant(restId);
      // 2. Fetch Restaurant reservations
      final reservationsFuture = _apiService.getRestaurantReservations(restId);
      // 3. Fetch Restaurant tables
      final tablesFuture = _apiService.getRestaurantTables(restId);
      // 4. Fetch Restaurant analytics
      final analyticsFuture = _apiService.getRestaurantAnalytics(restId);

      final results = await Future.wait([
        restaurantFuture,
        reservationsFuture,
        tablesFuture,
        analyticsFuture,
      ]);

      if (mounted) {
        final restaurant = results[0] as RestaurantModel;
        final reservations = results[1] as List<ReservationModel>;
        final tables = results[2] as List<TableModel>;
        final analytics = results[3] as Map<String, dynamic>;

        // Filter upcoming / active reservations
        final nowStr = DateTime.now().toIso8601String().substring(0, 10);
        final todayList = reservations
            .where((r) => r.reservationDate == nowStr || r.isUpcoming)
            .toList();

        setState(() {
          _restaurant = restaurant;
          _allReservations = reservations;
          _todayReservations = todayList;
          _tables = tables;
          _analytics = analytics;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        final msg = e.toString().replaceFirst('Exception: ', '');
        // If unauthorized or token expired, redirect to owner login
        if (msg.contains('401') || msg.toLowerCase().contains('unauthorized')) {
          _handleSessionExpired();
          return;
        }
        setState(() {
          _errorMessage = msg;
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleSessionExpired() async {
    await _authService.logout();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: AppTheme.red,
          content: Text('Session expired. Please log in again.'),
        ),
      );
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _confirmLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Log Out Partner Portal?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: const Text(
          'Are you sure you want to log out of your restaurant management session?',
          style: TextStyle(color: AppTheme.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.red,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Log Out', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (shouldLogout == true && mounted) {
      await _authService.logout();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
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
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.brand500.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.storefront, color: AppTheme.brand500, size: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _restaurant?.name ?? widget.ownerUser.restaurantName ?? 'Partner Portal',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    'Partner: ${widget.ownerUser.name}',
                    style: const TextStyle(
                      color: AppTheme.textSecondary,
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.red),
            tooltip: 'Partner Logout',
            onPressed: _confirmLogout,
          ),
        ],
      ),
      body: _buildCurrentTabBody(),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppTheme.darkSurface,
          border: Border(top: BorderSide(color: AppTheme.darkBorder, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _selectedTabIndex,
          onTap: (index) => setState(() => _selectedTabIndex = index),
          backgroundColor: AppTheme.darkSurface,
          selectedItemColor: AppTheme.brand500,
          unselectedItemColor: AppTheme.textMuted,
          type: BottomNavigationBarType.fixed,
          selectedFontSize: 12,
          unselectedFontSize: 11,
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard),
              label: 'Dashboard',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_today_outlined),
              activeIcon: Icon(Icons.calendar_today),
              label: 'Reservations',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.table_restaurant_outlined),
              activeIcon: Icon(Icons.table_restaurant),
              label: 'Tables',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.restaurant_menu_outlined),
              activeIcon: Icon(Icons.restaurant_menu),
              label: 'Menu',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentTabBody() {
    switch (_selectedTabIndex) {
      case 1:
        return OwnerBookingsScreen(
          apiService: _apiService,
          authService: _authService,
        );
      case 2:
        return OwnerTablesScreen(
          apiService: _apiService,
          authService: _authService,
        );
      case 3:
        return OwnerMenuScreen(
          apiService: _apiService,
          authService: _authService,
        );
      case 4:
        return OwnerProfileScreen(
          ownerUser: widget.ownerUser,
          apiService: _apiService,
          authService: _authService,
        );
      default:
        break;
    }

    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.brand500),
      );
    }

    if (_errorMessage != null) {
      return _buildErrorView();
    }

    return _buildDashboardHome();
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: AppTheme.red, size: 48),
            const SizedBox(height: 16),
            Text(
              _errorMessage ?? 'Failed to load restaurant data',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loadDashboardData,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardHome() {
    final rest = _restaurant;
    final isApproved = rest?.isApproved ?? true;
    final isPending = rest?.isPending ?? false;
    final isRejected = rest?.isRejected ?? false;

    // Real table stats from API or list
    final totalTables = _analytics['totalTables'] ?? _tables.length;
    final availableTables = _analytics['availableTables'] ?? _tables.where((t) => t.isAvailable).length;
    final occupiedTables = _analytics['occupiedTables'] ?? _tables.where((t) => t.isOccupied).length;
    final reservedTables = _analytics['reservedTables'] ?? _tables.where((t) => t.isReserved).length;

    // Real booking stats
    final pendingCount = _allReservations.where((r) => r.isPending).length;
    final confirmedCount = _allReservations.where((r) => r.isConfirmed).length;
    final activeRes = _analytics['activeReservations'] ?? (confirmedCount + _allReservations.where((r) => r.isSeated).length);

    return RefreshIndicator(
      color: AppTheme.brand500,
      backgroundColor: AppTheme.darkCard,
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. Verification Status Banner
            if (isApproved)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.emerald.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.4)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.verified, color: AppTheme.emerald, size: 22),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Verified Partner Restaurant',
                            style: TextStyle(
                              color: AppTheme.emerald,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            'Your venue is active and accepting live customer bookings',
                            style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else if (isPending)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.amber.withValues(alpha: 0.4)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.hourglass_empty, color: AppTheme.amber, size: 22),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Pending Verification',
                            style: TextStyle(
                              color: AppTheme.amber,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            'Your restaurant listing is being reviewed by administration',
                            style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )
            else if (isRejected)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: AppTheme.red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.red.withValues(alpha: 0.4)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.cancel, color: AppTheme.red, size: 22),
                    SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Listing Inactive / Suspended',
                            style: TextStyle(
                              color: AppTheme.red,
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            'Please contact support for partner account assistance',
                            style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // 2. Restaurant Profile Overview Card
            if (rest != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: AppTheme.cardDecoration(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: (rest.imageUrl != null && rest.imageUrl!.isNotEmpty)
                              ? Image.network(
                                  rest.imageUrl!,
                                  width: 70,
                                  height: 70,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, _, _) => Container(
                                    width: 70,
                                    height: 70,
                                    color: AppTheme.darkInput,
                                    child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 32),
                                  ),
                                )
                              : Container(
                                  width: 70,
                                  height: 70,
                                  color: AppTheme.darkInput,
                                  child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 32),
                                ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rest.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                rest.cuisine,
                                style: const TextStyle(
                                  color: AppTheme.brand500,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  const Icon(Icons.location_on, size: 14, color: AppTheme.textMuted),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      rest.address ?? rest.city ?? 'Local Venue',
                                      style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const Divider(color: AppTheme.darkBorder, height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, color: Color(0xFFFFB800), size: 16),
                            const SizedBox(width: 4),
                            Text(
                              rest.rating.toStringAsFixed(1),
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            Text(
                              ' (${rest.ratingCount} reviews)',
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                            ),
                          ],
                        ),
                        Text(
                          'ID: ${rest.id}',
                          style: const TextStyle(color: AppTheme.textMuted, fontSize: 11, fontFamily: 'monospace'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 20),

            // 3. Real Analytics Section Header
            const Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Real-Time Analytics',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  'Live Backend Feed',
                  style: TextStyle(
                    color: AppTheme.brand500,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // 4. Metric Summary Cards
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    'Active Bookings',
                    '$activeRes',
                    Icons.bookmark_added_outlined,
                    AppTheme.brand500,
                    'Confirmed / Seated',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    'Pending Requests',
                    '$pendingCount',
                    Icons.hourglass_top,
                    AppTheme.amber,
                    'Needs Confirmation',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMetricCard(
                    'Available Tables',
                    '$availableTables / $totalTables',
                    Icons.table_bar_outlined,
                    AppTheme.emerald,
                    'Free to Reserve',
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricCard(
                    'Occupied Tables',
                    '$occupiedTables',
                    Icons.people_alt_outlined,
                    AppTheme.red,
                    'Dining Guests',
                  ),
                ),
              ],
            ),

            if (_analytics.containsKey('todayRevenue')) ...[
              const SizedBox(height: 12),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: AppTheme.cardDecoration(borderRadius: BorderRadius.circular(14)),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.emerald.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.currency_rupee, color: AppTheme.emerald, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Today's Revenue",
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                            ),
                            Text(
                              '₹${_analytics['todayRevenue'] ?? 0}',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      ],
                    ),
                    if (_analytics.containsKey('todayOrders'))
                      Text(
                        '${_analytics['todayOrders']} orders today',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                      ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 24),

            // 5. Floor & Table Status Overview
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Floor Status',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton.icon(
                  onPressed: () => setState(() => _selectedTabIndex = 2),
                  icon: const Icon(Icons.table_restaurant, size: 16, color: AppTheme.brand500),
                  label: const Text('View All Tables', style: TextStyle(color: AppTheme.brand500, fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 8),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: AppTheme.cardDecoration(),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildTableStatusBadge('Available', availableTables, AppTheme.emerald),
                  _buildTableStatusBadge('Occupied', occupiedTables, AppTheme.red),
                  _buildTableStatusBadge('Reserved', reservedTables, AppTheme.amber),
                  _buildTableStatusBadge('Total', totalTables, AppTheme.textSecondary),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 6. Reservation Preview Header & View All button
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Upcoming Reservations',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() => _selectedTabIndex = 1);
                  },
                  child: const Row(
                    children: [
                      Text(
                        'View All Reservations',
                        style: TextStyle(color: AppTheme.brand500, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_forward_ios, size: 12, color: AppTheme.brand500),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            // 7. Reservation List
            if (_todayReservations.isEmpty && _allReservations.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(24),
                decoration: AppTheme.cardDecoration(borderRadius: BorderRadius.circular(14)),
                child: const Column(
                  children: [
                    Icon(Icons.event_busy, color: AppTheme.textMuted, size: 36),
                    SizedBox(height: 10),
                    Text(
                      'No reservations yet',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'New customer bookings will appear here in real-time.',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    ),
                  ],
                ),
              )
            else
              ...(_todayReservations.isNotEmpty ? _todayReservations.take(4) : _allReservations.take(4)).map((res) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: OwnerBookingCard(
                    reservation: res,
                    onTap: () async {
                      final updated = await Navigator.push<ReservationModel>(
                        context,
                        MaterialPageRoute(
                          builder: (_) => OwnerBookingDetailsScreen(
                            reservation: res,
                            apiService: _apiService,
                          ),
                        ),
                      );
                      if (updated != null && mounted) {
                        _loadDashboardData();
                      }
                    },
                    onStatusChanged: (newStatus) async {
                      try {
                        await _apiService.updateReservationStatus(res.id, newStatus);
                        if (mounted) {
                          _loadDashboardData();
                        }
                      } catch (e) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              backgroundColor: AppTheme.red,
                              content: Text(e.toString().replaceFirst('Exception: ', '')),
                            ),
                          );
                        }
                      }
                    },
                  ),
                );
              }),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, IconData icon, Color color, String subtext) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(borderRadius: BorderRadius.circular(14)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w500),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            subtext,
            style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }

  Widget _buildTableStatusBadge(String label, int count, Color color) {
    return Column(
      children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.15),
            shape: BoxShape.circle,
            border: Border.all(color: color.withValues(alpha: 0.4)),
          ),
          child: Center(
            child: Text(
              '$count',
              style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
        ),
      ],
    );
  }
}
