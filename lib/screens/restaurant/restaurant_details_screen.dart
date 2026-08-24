import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../core/app_theme.dart';
import '../../models/menu_category_model.dart';
import '../../models/menu_item_model.dart';
import '../../models/restaurant_model.dart';
import '../../services/api_service.dart';
import '../../widgets/menu_item_card.dart';
import '../booking/reservation_screen.dart';

/// Comprehensive Restaurant Details & Menu Screen for DineTrack Mobile
class RestaurantDetailsScreen extends StatefulWidget {
  final String restaurantId;
  final RestaurantModel? initialRestaurant;
  final ApiService? apiService;
  final double? userLat;
  final double? userLng;

  const RestaurantDetailsScreen({
    super.key,
    required this.restaurantId,
    this.initialRestaurant,
    this.apiService,
    this.userLat,
    this.userLng,
  });

  @override
  State<RestaurantDetailsScreen> createState() => _RestaurantDetailsScreenState();
}

class _RestaurantDetailsScreenState extends State<RestaurantDetailsScreen> {
  late final ApiService _apiService;
  RestaurantModel? _restaurant;
  List<MenuCategoryModel> _categories = [];
  List<MenuItemModel> _allItems = [];

  bool _isLoading = true;
  String? _errorMessage;
  String _selectedCategoryId = 'ALL';
  String _menuSearchQuery = '';
  bool _isFavorite = false;

  // Food Pre-Order Cart State
  final Map<String, int> _cartQuantities = {};
  final Map<String, MenuItemModel> _cartItems = {};

  int get _totalCartCount => _cartQuantities.values.fold(0, (sum, q) => sum + q);
  double get _cartSubtotal => _cartQuantities.entries.fold(
        0.0,
        (sum, e) => sum + ((_cartItems[e.key]?.price ?? 0) * e.value),
      );
  double get _cartTax => _cartSubtotal * 0.05;
  double get _cartTotal => _cartSubtotal + _cartTax;

  void _addItem(MenuItemModel item) {
    setState(() {
      _cartItems[item.id] = item;
      _cartQuantities[item.id] = (_cartQuantities[item.id] ?? 0) + 1;
    });
  }

  void _removeItem(MenuItemModel item) {
    setState(() {
      final current = _cartQuantities[item.id] ?? 0;
      if (current <= 1) {
        _cartQuantities.remove(item.id);
        _cartItems.remove(item.id);
      } else {
        _cartQuantities[item.id] = current - 1;
      }
    });
  }

  List<Map<String, dynamic>> _getPreOrderItemsList() {
    return _cartQuantities.entries.map((e) {
      final item = _cartItems[e.key]!;
      return {
        'id': item.id,
        'name': item.name,
        'price': item.price,
        'quantity': e.value,
        'prep_time_minutes': item.prepTimeMinutes,
      };
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? ApiService();
    _restaurant = widget.initialRestaurant;
    _fetchRestaurantData();
  }

  Future<void> _fetchRestaurantData() async {
    setState(() {
      _isLoading = _restaurant == null;
      _errorMessage = null;
    });

    try {
      final restaurant = await _apiService.getRestaurantById(
        widget.restaurantId,
        lat: widget.userLat,
        lng: widget.userLng,
      );

      List<MenuCategoryModel> categories = restaurant.menuCategories ?? [];
      List<MenuItemModel> items = restaurant.menuItems ?? [];

      // If categories weren't populated in restaurant detail, fetch from /menu/:id
      if (categories.isEmpty) {
        try {
          categories = await _apiService.getMenuByRestaurant(widget.restaurantId);
        } catch (_) {
          // Keep existing categories if menu call fails
        }
      }

      // If items are empty, flatten all items from categories
      if (items.isEmpty && categories.isNotEmpty) {
        items = categories.expand((c) => c.items).toList();
      }

      if (mounted) {
        setState(() {
          _restaurant = restaurant;
          _categories = categories;
          _allItems = items;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString().replaceAll('Exception: ', '');
        });
      }
    }
  }

  List<MenuItemModel> get _filteredItems {
    List<MenuItemModel> list;
    if (_selectedCategoryId == 'ALL') {
      list = _allItems;
    } else {
      final cat = _categories.firstWhere(
        (c) => c.id == _selectedCategoryId,
        orElse: () => const MenuCategoryModel(id: '', restaurantId: '', name: '', items: []),
      );
      list = cat.items.isNotEmpty
          ? cat.items
          : _allItems.where((i) => i.categoryId == _selectedCategoryId).toList();
    }

    if (_menuSearchQuery.trim().isNotEmpty) {
      final query = _menuSearchQuery.trim().toLowerCase();
      list = list.where((item) {
        final matchName = item.name.toLowerCase().contains(query);
        final matchDesc = item.description?.toLowerCase().contains(query) ?? false;
        return matchName || matchDesc;
      }).toList();
    }

    return list;
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading && _restaurant == null) {
      return Scaffold(
        backgroundColor: AppTheme.darkBg,
        body: _buildLoadingSkeleton(),
      );
    }

    if (_errorMessage != null && _restaurant == null) {
      return Scaffold(
        backgroundColor: AppTheme.darkBg,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: _buildErrorView(),
      );
    }

    final restaurant = _restaurant!;

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.darkSurface,
          border: const Border(
            top: BorderSide(color: AppTheme.darkBorder),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_totalCartCount > 0) ...[
                      Row(
                        children: [
                          const Icon(Icons.shopping_bag_rounded, color: AppTheme.emerald, size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '$_totalCartCount Dishes Pre-Ordered',
                            style: const TextStyle(
                              color: AppTheme.emerald,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Total: ₹${_cartTotal.toInt()} (Pay at table)',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ] else ...[
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: AppTheme.emerald,
                              shape: BoxShape.circle,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            '${restaurant.availableTablesCount ?? 0} Tables Available',
                            style: const TextStyle(
                              color: AppTheme.emerald,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${restaurant.priceRange} • ${restaurant.cuisine.split(',').first}',
                        style: const TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              ElevatedButton.icon(
                onPressed: () => _navigateToReservation(restaurant),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.brand500,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                icon: Icon(
                  _totalCartCount > 0 ? Icons.check_circle_outline_rounded : Icons.table_restaurant_rounded,
                  size: 18,
                ),
                label: Text(
                  _totalCartCount > 0 ? 'Pre-Order & Book' : 'Reserve a Table',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
              ),
            ],
          ),
        ),
      ),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // 1. Sliver AppBar with Hero Image & Actions
          _buildSliverAppBar(restaurant),

          // 2. Main Restaurant Info Header Card
          SliverToBoxAdapter(
            child: _buildRestaurantInfoSection(restaurant),
          ),

          // 3. Action Buttons (Call, Directions, Tables)
          SliverToBoxAdapter(
            child: _buildActionRow(restaurant),
          ),

          // 4. Menu Section Title & Search
          SliverToBoxAdapter(
            child: _buildMenuHeader(),
          ),

          // 5. Category Filter Chips
          if (_categories.isNotEmpty)
            SliverToBoxAdapter(
              child: _buildCategoryChips(),
            ),

          // 6. Menu Items List or Empty State
          _buildMenuItemsSliver(),

          // Bottom padding for scroll safety
          const SliverToBoxAdapter(
            child: SizedBox(height: 60),
          ),
        ],
      ),
    );
  }

  /// Top Sliver App Bar with restaurant photo, overlay, back button, and favorite action
  Widget _buildSliverAppBar(RestaurantModel restaurant) {
    return SliverAppBar(
      expandedHeight: 250,
      pinned: true,
      backgroundColor: AppTheme.darkSurface,
      leading: Padding(
        padding: const EdgeInsets.all(8.0),
        child: CircleAvatar(
          backgroundColor: Colors.black.withValues(alpha: 0.55),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
            onPressed: () => Navigator.pop(context),
          ),
        ),
      ),
      actions: [
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: CircleAvatar(
            backgroundColor: Colors.black.withValues(alpha: 0.55),
            child: IconButton(
              icon: Icon(
                _isFavorite ? Icons.favorite : Icons.favorite_border,
                color: _isFavorite ? AppTheme.red : Colors.white,
                size: 20,
              ),
              onPressed: () {
                setState(() {
                  _isFavorite = !_isFavorite;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      _isFavorite
                          ? '${restaurant.name} added to favorites'
                          : '${restaurant.name} removed from favorites',
                    ),
                    duration: const Duration(seconds: 1),
                  ),
                );
              },
            ),
          ),
        ),
      ],
      flexibleSpace: FlexibleSpaceBar(
        background: Stack(
          fit: StackFit.expand,
          children: [
            // Image
            if (restaurant.coverImageUrl != null || restaurant.imageUrl != null)
              Image.network(
                restaurant.coverImageUrl ?? restaurant.imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: AppTheme.darkCard,
                  child: const Icon(Icons.restaurant, size: 64, color: AppTheme.textMuted),
                ),
              )
            else
              Container(
                color: AppTheme.darkCard,
                child: const Icon(Icons.restaurant, size: 64, color: AppTheme.textMuted),
              ),

            // Gradient Overlays for readable text
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.black.withValues(alpha: 0.6),
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.85),
                  ],
                ),
              ),
            ),

            // Verified Badge on image
            if (restaurant.isVerified)
              Positioned(
                bottom: 16,
                left: 16,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.emerald,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.verified, size: 14, color: Colors.white),
                      SizedBox(width: 4),
                      Text(
                        'VERIFIED PARTNER',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Restaurant details section
  Widget _buildRestaurantInfoSection(RestaurantModel restaurant) {
    return Container(
      padding: const EdgeInsets.all(18),
      margin: const EdgeInsets.fromLTRB(16, 14, 16, 8),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Name and Price
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  restaurant.name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: -0.4,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.darkInput,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.darkBorder),
                ),
                child: Text(
                  restaurant.priceRange,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          // Cuisine
          Text(
            restaurant.cuisine,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 12),

          // Rating, Open Status, and Hours Row
          Row(
            children: [
              // Rating
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.amber.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, size: 16, color: AppTheme.amber),
                    const SizedBox(width: 4),
                    Text(
                      restaurant.formattedRating,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '(${restaurant.ratingCount})',
                      style: const TextStyle(
                        color: AppTheme.textMuted,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 10),

              // Open / Closed Status
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: restaurant.isOpen
                      ? AppTheme.emerald.withValues(alpha: 0.15)
                      : AppTheme.red.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: restaurant.isOpen ? AppTheme.emerald.withValues(alpha: 0.4) : AppTheme.red.withValues(alpha: 0.4),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: restaurant.isOpen ? AppTheme.emerald : AppTheme.red,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      restaurant.isOpen ? 'OPEN NOW' : 'CLOSED',
                      style: TextStyle(
                        color: restaurant.isOpen ? AppTheme.emerald : AppTheme.red,
                        fontWeight: FontWeight.w800,
                        fontSize: 11,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 10),

              // Hours
              Expanded(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.schedule,
                      size: 15,
                      color: AppTheme.textSecondary,
                    ),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        restaurant.formattedHours,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: AppTheme.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const Divider(height: 24, color: AppTheme.darkBorder),

          // Distance and Address
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(
                Icons.location_on_outlined,
                size: 18,
                color: AppTheme.amber,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (restaurant.distanceKm != null) ...[
                      Text(
                        '${restaurant.distanceKm!.toStringAsFixed(1)} km away ${restaurant.estimatedTravelTimeMinutes != null ? "• ~${restaurant.estimatedTravelTimeMinutes} mins drive" : ""}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.emerald,
                        ),
                      ),
                      const SizedBox(height: 2),
                    ],
                    Text(
                      restaurant.fullAddress,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Real Description (if non-empty)
          if (restaurant.description != null && restaurant.description!.trim().isNotEmpty) ...[
            const SizedBox(height: 14),
            Text(
              restaurant.description!.trim(),
              style: const TextStyle(
                fontSize: 13,
                height: 1.4,
                color: AppTheme.textSecondary,
              ),
            ),
          ],

          // Available Tables & Crowd Status
          if (restaurant.availableTablesCount != null || restaurant.crowdLevel != null) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.darkInput,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.darkBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.table_restaurant, size: 18, color: AppTheme.emerald),
                  const SizedBox(width: 8),
                  Text(
                    '${restaurant.availableTablesCount ?? 0} Tables Available',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.emerald,
                    ),
                  ),
                  const Spacer(),
                  if (restaurant.crowdLevel != null) ...[
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppTheme.blue.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '${restaurant.crowdLevel} CROWD',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.blue,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _navigateToReservation(RestaurantModel restaurant) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ReservationScreen(
          restaurant: restaurant,
          apiService: _apiService,
          initialPreOrderItems: _getPreOrderItemsList(),
          initialCartItems: _cartItems,
        ),
      ),
    );
  }

  /// Action buttons: Reserve Table, Call, Location Directions
  Widget _buildActionRow(RestaurantModel restaurant) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Row(
        children: [
          // Primary Action: Reserve Table
          Expanded(
            flex: 3,
            child: ElevatedButton.icon(
              onPressed: () => _navigateToReservation(restaurant),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                elevation: 0,
              ),
              icon: const Icon(Icons.table_restaurant_rounded, size: 18),
              label: const Text(
                'Reserve Table',
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Call Button
          if (restaurant.phone != null && restaurant.phone!.isNotEmpty) ...[
            Expanded(
              flex: 2,
              child: OutlinedButton.icon(
                onPressed: () => _showContactModal(restaurant),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  side: const BorderSide(color: AppTheme.darkBorder),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.phone_outlined, size: 16, color: AppTheme.emerald),
                label: const Text(
                  'Call',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
          ],

          // View Location Button
          Expanded(
            flex: 2,
            child: OutlinedButton.icon(
              onPressed: () => _showLocationModal(restaurant),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
                side: const BorderSide(color: AppTheme.darkBorder),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              icon: const Icon(Icons.map_outlined, size: 16, color: AppTheme.amber),
              label: const Text(
                'Directions',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }


  /// Menu Header with search field and total dish counter
  Widget _buildMenuHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                'Restaurant Menu',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.amber.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${_allItems.length} Dishes',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.amber,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Menu Search Input
          Container(
            height: 44,
            decoration: BoxDecoration(
              color: AppTheme.darkInput,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.darkBorder),
            ),
            child: TextField(
              onChanged: (val) {
                setState(() {
                  _menuSearchQuery = val;
                });
              },
              style: const TextStyle(
                fontSize: 13,
                color: Colors.white,
              ),
              decoration: InputDecoration(
                hintText: 'Search dishes in menu...',
                hintStyle: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textMuted,
                ),
                prefixIcon: const Icon(
                  Icons.search,
                  size: 18,
                  color: AppTheme.textSecondary,
                ),
                suffixIcon: _menuSearchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16),
                        onPressed: () {
                          setState(() {
                            _menuSearchQuery = '';
                          });
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// Horizontal category chips (All, Starters, Main Course, etc.)
  Widget _buildCategoryChips() {
    return Container(
      height: 40,
      margin: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: _categories.length + 1, // +1 for "All"
        itemBuilder: (context, index) {
          final isAll = index == 0;
          final categoryId = isAll ? 'ALL' : _categories[index - 1].id;
          final categoryName = isAll ? 'All Dishes' : _categories[index - 1].name;
          final isSelected = _selectedCategoryId == categoryId;

          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(categoryName),
              selected: isSelected,
              onSelected: (selected) {
                if (selected) {
                  setState(() {
                    _selectedCategoryId = categoryId;
                  });
                }
              },
              selectedColor: AppTheme.brand500,
              backgroundColor: AppTheme.darkCard,
              labelStyle: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                color: isSelected ? Colors.white : AppTheme.textSecondary,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
                ),
              ),
              showCheckmark: false,
            ),
          );
        },
      ),
    );
  }

  /// Menu items list sliver
  Widget _buildMenuItemsSliver() {
    final items = _filteredItems;

    if (items.isEmpty) {
      return SliverToBoxAdapter(
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
          alignment: Alignment.center,
          child: Column(
            children: [
              const Icon(
                Icons.search_off_rounded,
                size: 48,
                color: AppTheme.textMuted,
              ),
              const SizedBox(height: 12),
              Text(
                _menuSearchQuery.isNotEmpty
                    ? 'No dishes match "$_menuSearchQuery"'
                    : 'No menu items found in this category',
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              if (_menuSearchQuery.isNotEmpty) ...[
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _menuSearchQuery = '';
                    });
                  },
                  child: const Text('Clear Search', style: TextStyle(color: AppTheme.brand500)),
                ),
              ],
            ],
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final item = items[index];
          final qty = _cartQuantities[item.id] ?? 0;
          return MenuItemCard(
            item: item,
            quantity: qty,
            onAdd: () => _addItem(item),
            onRemove: () => _removeItem(item),
            onTap: () => _showDishDetailModal(item),
          );
        },
        childCount: items.length,
      ),
    );
  }

  /// Show detailed dish bottom sheet on tap with interactive Add to Pre-Order option
  void _showDishDetailModal(MenuItemModel item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final qty = _cartQuantities[item.id] ?? 0;
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          item.name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    item.formattedPrice,
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.emerald,
                    ),
                  ),
                  const SizedBox(height: 10),
                  if (item.description != null && item.description!.isNotEmpty)
                    Text(
                      item.description!,
                      style: const TextStyle(
                        fontSize: 14,
                        height: 1.4,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      const Icon(Icons.timer_outlined, size: 16, color: AppTheme.amber),
                      const SizedBox(width: 6),
                      Text(
                        'Average Prep Time: ${item.formattedPrepTime}',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  if (item.isAvailable)
                    SizedBox(
                      width: double.infinity,
                      child: qty == 0
                          ? ElevatedButton.icon(
                              onPressed: () {
                                _addItem(item);
                                setModalState(() {});
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.brand500,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              icon: const Icon(Icons.add_shopping_cart_rounded, size: 18),
                              label: const Text('Add to Pre-Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            )
                          : Container(
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                              decoration: BoxDecoration(
                                color: AppTheme.darkInput,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppTheme.brand500, width: 1.5),
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Pre-Order Quantity:',
                                    style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                                  ),
                                  Row(
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.remove_circle_outline, color: AppTheme.textSecondary, size: 22),
                                        onPressed: () {
                                          _removeItem(item);
                                          setModalState(() {});
                                        },
                                      ),
                                      Text('$qty', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                      IconButton(
                                        icon: const Icon(Icons.add_circle, color: AppTheme.brand500, size: 22),
                                        onPressed: () {
                                          _addItem(item);
                                          setModalState(() {});
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                    ),
                  const SizedBox(height: 8),
                ],
              ),
            );
          },
        );
      },
    );
  }

  /// Show contact phone modal
  void _showContactModal(RestaurantModel restaurant) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Contact ${restaurant.name}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 14),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: AppTheme.emerald,
                  child: Icon(Icons.phone, color: Colors.white, size: 20),
                ),
                title: Text(
                  restaurant.phone ?? 'No phone available',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                ),
                subtitle: const Text('Tap to copy number', style: TextStyle(color: AppTheme.textMuted)),
                trailing: const Icon(Icons.copy, size: 18, color: AppTheme.textSecondary),
                onTap: () {
                  if (restaurant.phone != null) {
                    Clipboard.setData(ClipboardData(text: restaurant.phone!));
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Phone number copied to clipboard')),
                    );
                  }
                },
              ),
            ],
          ),
        );
      },
    );
  }

  /// Show directions / address modal
  void _showLocationModal(RestaurantModel restaurant) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Restaurant Location',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 14),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const CircleAvatar(
                  backgroundColor: AppTheme.amber,
                  child: Icon(Icons.location_on, color: Colors.white, size: 20),
                ),
                title: Text(
                  restaurant.fullAddress,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white),
                ),
                subtitle: restaurant.distanceKm != null
                    ? Text(
                        '${restaurant.distanceKm!.toStringAsFixed(1)} km from your current location',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      )
                    : null,
                trailing: const Icon(Icons.copy, size: 18, color: AppTheme.textSecondary),
                onTap: () {
                  Clipboard.setData(ClipboardData(text: restaurant.fullAddress));
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Address copied to clipboard')),
                  );
                },
              ),
            ],
          ),
        );
      },
    );
  }

  /// Skeleton loader
  Widget _buildLoadingSkeleton() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppTheme.brand500),
          ),
          SizedBox(height: 16),
          Text(
            'Loading Restaurant & Menu...',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  /// Error view with retry
  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              size: 56,
              color: AppTheme.red,
            ),
            const SizedBox(height: 16),
            const Text(
              'Unable to Load Restaurant',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Please check your connection and try again.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _fetchRestaurantData,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
