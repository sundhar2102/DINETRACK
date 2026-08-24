import 'package:flutter/material.dart';
import '../../models/location_model.dart';
import '../../models/restaurant_model.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../../services/location_service.dart';
import '../../widgets/restaurant_card.dart';
import '../auth/login_screen.dart';
import '../bookings/my_bookings_screen.dart';
import '../restaurant/restaurant_details_screen.dart';

class CustomerHomeScreen extends StatefulWidget {
  final UserModel? currentUser;
  final AuthService? authService;
  final ApiService? apiService;
  final LocationService? locationService;
  final bool autoRequestLocation;

  const CustomerHomeScreen({
    super.key,
    this.currentUser,
    this.authService,
    this.apiService,
    this.locationService,
    this.autoRequestLocation = true,
  });


  @override
  State<CustomerHomeScreen> createState() => _CustomerHomeScreenState();
}

class _CustomerHomeScreenState extends State<CustomerHomeScreen> {
  late final AuthService _authService;
  late final ApiService _apiService;
  late final LocationService _locationService;

  int _selectedTabIndex = 0;
  String _selectedCategory = 'All';
  final TextEditingController _searchController = TextEditingController();

  bool _isLoading = true;
  bool _isLocating = false;
  String? _errorMessage;
  LocationModel? _currentLocation;
  LocationPermissionState _permissionState = LocationPermissionState.granted;

  List<RestaurantModel> _allRestaurants = [];
  List<RestaurantModel> _filteredRestaurants = [];

  final List<String> _categories = [
    'All',
    'South Indian',
    'North Indian',
    'Barbeque',
    'Italian',
    'Pan-Asian',
    'Hyderabadi',
    'Seafood',
    'Biryani',
  ];

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? AuthService();
    _apiService = widget.apiService ?? ApiService();
    _locationService = widget.locationService ?? LocationService();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initLocationAndRestaurants();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  /// Initialize GPS detection and fetch nearby restaurants
  Future<void> _initLocationAndRestaurants() async {
    if (!mounted) return;

    if (widget.autoRequestLocation) {
      await _detectLocation(requestPermission: true);
    } else {
      await _fetchRestaurants();
    }
  }

  /// Detect device GPS location
  Future<void> _detectLocation({bool requestPermission = true}) async {
    if (!mounted) return;
    setState(() => _isLocating = true);

    try {
      final result = await _locationService.getCurrentLocation(
        requestIfNotGranted: requestPermission,
      );

      if (!mounted) return;

      setState(() {
        _permissionState = result.state;
        _isLocating = false;
        if (result.isSuccess) {
          _currentLocation = result.location;
        }
      });

      // If permission is denied or service disabled, show prompt if needed
      if (result.state == LocationPermissionState.denied) {
        _showPermissionDialog();
      }

      // Fetch restaurants using detected coordinates (or default)
      await _fetchRestaurants(
        lat: _currentLocation?.latitude,
        lng: _currentLocation?.longitude,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLocating = false);
      await _fetchRestaurants();
    }
  }

  /// Fetch restaurants from real backend nearby API
  Future<void> _fetchRestaurants({double? lat, double? lng}) async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await _apiService.getRestaurants(
        lat: lat ?? _currentLocation?.latitude,
        lng: lng ?? _currentLocation?.longitude,
      );
      if (!mounted) return;
      setState(() {
        _allRestaurants = results;
        _isLoading = false;
      });
      _applyFilter();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  /// Refresh GPS location and reload restaurant feed
  Future<void> _refreshLocationAndRestaurants() async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFFF6A00)),
            ),
            SizedBox(width: 12),
            Text('Refreshing GPS location & restaurants...'),
          ],
        ),
        backgroundColor: Color(0xFF161F30),
        duration: Duration(seconds: 2),
      ),
    );

    await _detectLocation(requestPermission: true);

    if (mounted && _currentLocation != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('📍 Location updated: ${_currentLocation!.displayName}'),
          backgroundColor: const Color(0xFF10B981),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _applyFilter() {
    final query = _searchController.text.trim().toLowerCase();
    setState(() {
      _filteredRestaurants = _allRestaurants.where((restaurant) {
        // 1. Category Filter
        final matchesCategory = _selectedCategory == 'All' ||
            restaurant.cuisine.toLowerCase().contains(_selectedCategory.toLowerCase()) ||
            restaurant.name.toLowerCase().contains(_selectedCategory.toLowerCase());

        // 2. Search Text Filter
        final matchesQuery = query.isEmpty ||
            restaurant.name.toLowerCase().contains(query) ||
            restaurant.cuisine.toLowerCase().contains(query) ||
            (restaurant.description != null && restaurant.description!.toLowerCase().contains(query)) ||
            restaurant.fullAddress.toLowerCase().contains(query);

        return matchesCategory && matchesQuery;
      }).toList();
    });
  }

  /// Show professional explanation modal when permission is needed
  void _showPermissionDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF161F30),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF6A00).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(Icons.location_on, color: Color(0xFFFF6A00), size: 28),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Text(
                      'Find restaurants near you',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Allow DineTrack to access your location to show nearby restaurants, accurate travel times, and real table availability around you.',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 24),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white70,
                        side: const BorderSide(color: Color(0xFF1F293D)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () => Navigator.pop(ctx),
                      child: const Text('Not Now'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF6A00),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _detectLocation(requestPermission: true);
                      },
                      child: const Text(
                        'Allow Location',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _handleLogout() async {
    await _authService.logout();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => LoginScreen(authService: _authService)),
      (route) => false,
    );
  }

  void _openRestaurantDetails(RestaurantModel rest) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => RestaurantDetailsScreen(
          restaurantId: rest.id,
          initialRestaurant: rest,
          apiService: _apiService,
          userLat: _currentLocation?.latitude,
          userLng: _currentLocation?.longitude,
        ),
      ),
    );
  }


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: SafeArea(
        child: _selectedTabIndex == 0
            ? _buildHomeFeed()
            : _buildOtherTabs(_selectedTabIndex),
      ),
      bottomNavigationBar: _buildBottomNavigationBar(),
    );
  }

  Widget _buildHomeFeed() {
    return RefreshIndicator(
      color: const Color(0xFFFF6A00),
      backgroundColor: const Color(0xFF161F30),
      onRefresh: _refreshLocationAndRestaurants,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTopHeader(),
                  const SizedBox(height: 12),
                  _buildLocationStatusBanner(),
                  const SizedBox(height: 12),
                  _buildSearchBar(),
                  const SizedBox(height: 16),
                  _buildCategoryList(),
                  const SizedBox(height: 20),
                  _buildSectionTitle(),
                  const SizedBox(height: 8),
                ],
              ),
            ),
          ),
          _buildRestaurantSliver(),
        ],
      ),
    );
  }

  Widget _buildTopHeader() {
    String locationText = 'Locating...';
    if (_isLocating) {
      locationText = 'Detecting GPS...';
    } else if (_currentLocation != null) {
      locationText = _currentLocation!.displayName;
    } else if (_permissionState == LocationPermissionState.denied) {
      locationText = 'Location Disabled';
    } else {
      locationText = 'Current Location';
    }

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        // Location Info
        Expanded(
          child: GestureDetector(
            onTap: _refreshLocationAndRestaurants,
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFF6A00).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: _isLocating
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFFFF6A00),
                          ),
                        )
                      : const Icon(Icons.location_on, color: Color(0xFFFF6A00), size: 20),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'CURRENT LOCATION',
                        style: TextStyle(
                          color: Color(0xFF94A3B8),
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              locationText,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.refresh, color: Colors.white54, size: 16),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Notifications & Profile Avatar
        Row(
          children: [
            Container(
              decoration: BoxDecoration(
                color: const Color(0xFF161F30),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF1F293D)),
              ),
              child: IconButton(
                icon: const Icon(Icons.notifications_none, color: Colors.white70, size: 20),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('No new notifications'),
                      backgroundColor: Color(0xFF161F30),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => setState(() => _selectedTabIndex = 4),
              child: CircleAvatar(
                radius: 19,
                backgroundColor: const Color(0xFFFF6A00),
                backgroundImage: _currentUser.avatarUrl != null && _currentUser.avatarUrl!.isNotEmpty
                    ? NetworkImage(_currentUser.avatarUrl!)
                    : null,
                child: (_currentUser.avatarUrl == null || _currentUser.avatarUrl!.isEmpty)
                    ? Text(
                        _currentUser.name.isNotEmpty ? _currentUser.name[0].toUpperCase() : 'U',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      )
                    : null,

              ),
            ),
          ],
        ),
      ],
    );
  }

  /// Banner displayed when GPS is disabled or permission needs user intervention
  Widget _buildLocationStatusBanner() {
    if (_permissionState == LocationPermissionState.granted && _currentLocation != null) {
      return const SizedBox.shrink();
    }

    if (_permissionState == LocationPermissionState.serviceDisabled) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.location_off, color: Color(0xFFF59E0B), size: 18),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Location services are turned off.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ),
            TextButton(
              onPressed: () => _locationService.openLocationSettings(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Enable Location',
                style: TextStyle(color: Color(0xFFFF6A00), fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_permissionState == LocationPermissionState.denied) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFF38BDF8).withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.my_location, color: Color(0xFF38BDF8), size: 18),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Location permission required for nearby ranking.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ),
            TextButton(
              onPressed: () => _detectLocation(requestPermission: true),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Allow Location',
                style: TextStyle(color: Color(0xFFFF6A00), fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    if (_permissionState == LocationPermissionState.deniedForever) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF1E293B),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFEF4444).withValues(alpha: 0.4)),
        ),
        child: Row(
          children: [
            const Icon(Icons.block, color: Color(0xFFEF4444), size: 18),
            const SizedBox(width: 10),
            const Expanded(
              child: Text(
                'Location permanently disabled in system settings.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ),
            TextButton(
              onPressed: () => _locationService.openAppSettings(),
              style: TextButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                minimumSize: Size.zero,
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: const Text(
                'Open Settings',
                style: TextStyle(color: Color(0xFFFF6A00), fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ),
          ],
        ),
      );
    }

    return const SizedBox.shrink();
  }

  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF161F30),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: TextField(
        controller: _searchController,
        onChanged: (_) => _applyFilter(),
        style: const TextStyle(color: Colors.white, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search restaurants, cuisines or dishes...',
          hintStyle: const TextStyle(color: Color(0xFF64748B), fontSize: 13),
          prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 20),
          suffixIcon: _searchController.text.isNotEmpty
              ? IconButton(
                  icon: const Icon(Icons.close, color: Colors.white54, size: 18),
                  onPressed: () {
                    _searchController.clear();
                    _applyFilter();
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildCategoryList() {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        padding: EdgeInsets.zero,
        scrollDirection: Axis.horizontal,
        itemCount: _categories.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat;

          return GestureDetector(
            onTap: () {
              setState(() => _selectedCategory = cat);
              _applyFilter();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                gradient: isSelected
                    ? const LinearGradient(
                        colors: [Color(0xFFFF6A00), Color(0xFFE55F00)],
                      )
                    : null,
                color: isSelected ? null : const Color(0xFF161F30),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? Colors.transparent : const Color(0xFF1F293D),
                ),
              ),
              child: Text(
                cat,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionTitle() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Restaurants Near You',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              _isLoading
                  ? 'Searching nearby...'
                  : '${_filteredRestaurants.length} places ready for dine-in',
              style: const TextStyle(color: Color(0xFF64748B), fontSize: 12),
            ),
          ],
        ),
        if (!_isLoading && _allRestaurants.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFF161F30),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFF1F293D)),
            ),
            child: const Row(
              children: [
                Icon(Icons.near_me, color: Color(0xFFFF6A00), size: 14),
                SizedBox(width: 4),
                Text(
                  'Sorted by distance',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildRestaurantSliver() {
    if (_isLoading) {
      return SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) => _buildSkeletonCard(),
          childCount: 3,
        ),
      );
    }

    if (_errorMessage != null) {
      return SliverToBoxAdapter(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: const Color(0xFF161F30),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0x66FF5252)),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.cloud_off_rounded, color: Colors.redAccent, size: 48),
              const SizedBox(height: 12),
              const Text(
                'Unable to load nearby restaurants',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFF6A00),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
                onPressed: () => _fetchRestaurants(),
                icon: const Icon(Icons.refresh, size: 18, color: Colors.white),
                label: const Text('Retry', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    if (_filteredRestaurants.isEmpty) {
      return SliverToBoxAdapter(
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 32, horizontal: 16),
          padding: const EdgeInsets.all(32),
          decoration: BoxDecoration(
            color: const Color(0xFF161F30),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFF1F293D)),
          ),
          child: Column(
            children: [
              const Icon(Icons.restaurant_menu, color: Color(0xFF64748B), size: 56),
              const SizedBox(height: 16),
              const Text(
                'No restaurants found nearby',
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 6),
              const Text(
                'Try clearing your search query or selecting another cuisine filter.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFFF6A00),
                  side: const BorderSide(color: Color(0xFFFF6A00)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _selectedCategory = 'All');
                  _applyFilter();
                },
                child: const Text('Reset Filters'),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final restaurant = _filteredRestaurants[index];
            return RestaurantCard(
              restaurant: restaurant,
              onTap: () => _openRestaurantDetails(restaurant),
            );

          },
          childCount: _filteredRestaurants.length,
        ),
      ),
    );
  }

  Widget _buildSkeletonCard() {
    return Container(
      margin: const EdgeInsets.only(bottom: 16, left: 16, right: 16),
      height: 220,
      decoration: BoxDecoration(
        color: const Color(0xFF161F30),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF1F293D)),
      ),
      child: Column(
        children: [
          Expanded(
            flex: 3,
            child: Container(
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
              ),
            ),
          ),
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 16, width: 180, color: const Color(0xFF1E293B)),
                  const SizedBox(height: 8),
                  Container(height: 12, width: 120, color: const Color(0xFF1E293B)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOtherTabs(int index) {
    if (index == 2) {
      return MyBookingsScreen(
        apiService: _apiService,
        authService: _authService,
        currentUser: widget.currentUser,
      );
    }

    if (index == 4) {
      return _buildProfileView();
    }

    final titles = ['Home', 'Explore', 'Bookings', 'Favorites', 'Profile'];
    final icons = [
      Icons.home,
      Icons.explore_outlined,
      Icons.calendar_month_outlined,
      Icons.favorite_border,
      Icons.person_outline
    ];

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icons[index], color: const Color(0xFFFF6A00), size: 64),
            const SizedBox(height: 16),
            Text(
              '${titles[index]} Screen',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'This feature will be fully activated in upcoming steps.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF161F30),
                foregroundColor: Colors.white,
                side: const BorderSide(color: Color(0xFF1F293D)),
              ),
              onPressed: () => setState(() => _selectedTabIndex = 0),
              child: const Text('Back to Home'),
            ),
          ],
        ),
      ),
    );
  }

  UserModel get _currentUser =>
      widget.currentUser ??
      _authService.currentUser ??
      const UserModel(
        id: 'usr-cust-001',
        name: 'Alex Morgan',
        email: 'alex@smarttable.com',
        role: 'CUSTOMER',
      );

  Widget _buildProfileView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const SizedBox(height: 20),
          CircleAvatar(
            radius: 46,
            backgroundColor: const Color(0xFFFF6A00),
            child: Text(
              _currentUser.name.isNotEmpty
                  ? _currentUser.name[0].toUpperCase()
                  : 'U',
              style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            _currentUser.name,
            style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            _currentUser.email,
            style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFF6A00).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              'ROLE: ${_currentUser.role}',
              style: const TextStyle(
                color: Color(0xFFFF6A00),
                fontWeight: FontWeight.bold,
                fontSize: 11,
              ),
            ),
          ),
          const SizedBox(height: 32),


          // Location Info Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF161F30),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF1F293D)),
            ),
            child: Row(
              children: [
                const Icon(Icons.gps_fixed, color: Color(0xFF38BDF8), size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'GPS Location',
                        style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12),
                      ),
                      Text(
                        _currentLocation != null
                            ? _currentLocation!.displayName
                            : 'Not detected',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _refreshLocationAndRestaurants,
                  child: const Text('Update', style: TextStyle(color: Color(0xFFFF6A00))),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.redAccent,
                side: const BorderSide(color: Colors.redAccent),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: _handleLogout,
              icon: const Icon(Icons.logout),
              label: const Text('LOGOUT OF SMART TABLE', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNavigationBar() {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF161F30),
        border: Border(top: BorderSide(color: Color(0xFF1F293D), width: 1)),
      ),
      child: BottomNavigationBar(
        currentIndex: _selectedTabIndex,
        onTap: (index) => setState(() => _selectedTabIndex = index),
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.transparent,
        elevation: 0,
        selectedItemColor: const Color(0xFFFF6A00),
        unselectedItemColor: const Color(0xFF64748B),
        selectedFontSize: 11,
        unselectedFontSize: 11,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined),
            activeIcon: Icon(Icons.explore),
            label: 'Explore',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_month_outlined),
            activeIcon: Icon(Icons.calendar_month),
            label: 'Bookings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_border),
            activeIcon: Icon(Icons.favorite),
            label: 'Favorites',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
