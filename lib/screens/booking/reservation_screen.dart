import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../models/availability_model.dart';
import '../../models/menu_category_model.dart';
import '../../models/menu_item_model.dart';
import '../../models/restaurant_model.dart';
import '../../models/table_model.dart';
import '../../models/time_slot_model.dart';
import '../../models/user_model.dart';
import '../../services/api_service.dart';
import '../../services/auth_service.dart';
import '../auth/login_screen.dart';
import 'reservation_review_screen.dart';

class ReservationScreen extends StatefulWidget {
  final RestaurantModel restaurant;
  final ApiService? apiService;
  final AuthService? authService;
  final UserModel? currentUser;
  final List<Map<String, dynamic>> initialPreOrderItems;
  final Map<String, MenuItemModel>? initialCartItems;

  const ReservationScreen({
    super.key,
    required this.restaurant,
    this.apiService,
    this.authService,
    this.currentUser,
    this.initialPreOrderItems = const [],
    this.initialCartItems,
  });

  @override
  State<ReservationScreen> createState() => _ReservationScreenState();
}

class _ReservationScreenState extends State<ReservationScreen> {
  late final ApiService _apiService;
  late final AuthService _authService;

  UserModel? _activeUser;

  // Booking Form State
  int _adultsCount = 2;
  int _childrenCount = 0;
  late DateTime _selectedDate;
  String _selectedTimeSlot = '19:30';
  String _allocationMode = 'auto'; // 'auto' or 'manual'
  String? _selectedTableId;
  final Set<String> _selectedPresets = {};
  final TextEditingController _customRequestController = TextEditingController();

  // Food Pre-Order State
  List<MenuCategoryModel> _menuCategories = [];
  final Map<String, int> _cartQuantities = {};
  final Map<String, MenuItemModel> _cartItems = {};
  bool _isFoodSectionExpanded = true;
  String _selectedFoodCategory = 'ALL';
  String _selectedDietFilter = 'ALL';

  // Backend Data
  bool _isLoading = true;
  bool _isLoadingWaitTime = false;
  String? _errorMessage;
  List<TableModel> _tables = [];
  AvailabilityModel? _availability;

  int get _totalGuests => _adultsCount + _childrenCount;

  int get _totalCartItemsCount => _cartQuantities.values.fold(0, (sum, q) => sum + q);
  double get _cartSubtotal => _cartQuantities.entries.fold(
        0.0,
        (sum, e) => sum + ((_cartItems[e.key]?.price ?? 0) * e.value),
      );
  double get _cartTax => _cartSubtotal * 0.05;
  double get _cartTotal => _cartSubtotal + _cartTax;

  final List<String> _specialPresets = const [
    '🎂 Birthday Celebration',
    '🥂 Anniversary',
    '🪟 Window Table',
    '🕯️ Quiet Corner',
    '♿ Wheelchair Accessible',
    '👶 High Chair Needed',
  ];

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? ApiService();
    _authService = widget.authService ?? AuthService();
    _selectedDate = DateTime.now();
    _initAuthAndLoadData();
  }

  @override
  void dispose() {
    _customRequestController.dispose();
    super.dispose();
  }

  Future<void> _initAuthAndLoadData() async {
    // 1. Restore & verify authenticated user session
    _activeUser = widget.currentUser ?? _authService.currentUser;
    if (_activeUser == null) {
      _activeUser = await _authService.restoreSession();
      if (mounted) setState(() {});
    }

    final isUnverified = widget.restaurant.verificationStatus == 'UNDER_VERIFICATION' ||
        (widget.restaurant.isVerified == false && widget.restaurant.verificationStatus != 'APPROVED');
    if (isUnverified) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final results = await Future.wait([
        _apiService.getTablesByRestaurantId(widget.restaurant.id),
        _apiService.getWaitTimeAndAvailability(widget.restaurant.id, partySize: _totalGuests),
        _apiService.getMenuByRestaurant(widget.restaurant.id),
      ]);

      if (mounted) {
        setState(() {
          _tables = results[0] as List<TableModel>;
          _availability = results[1] as AvailabilityModel;
          _menuCategories = results[2] as List<MenuCategoryModel>;

          // Pre-populate cart items if passed from restaurant detail screen
          if (widget.initialCartItems != null) {
            _cartItems.addAll(widget.initialCartItems!);
          }
          final allDishes = _menuCategories.expand((c) => c.items).toList();
          for (final raw in widget.initialPreOrderItems) {
            final id = raw['id']?.toString() ?? '';
            final qty = (raw['quantity'] as num? ?? 1).toInt();
            if (id.isNotEmpty) {
              _cartQuantities[id] = qty;
              if (!_cartItems.containsKey(id)) {
                final match = allDishes.firstWhere(
                  (d) => d.id == id,
                  orElse: () => MenuItemModel(
                    id: id,
                    restaurantId: widget.restaurant.id,
                    categoryId: '',
                    name: raw['name']?.toString() ?? 'Item',
                    price: (raw['price'] as num? ?? 0).toDouble(),
                    prepTimeMinutes: (raw['prep_time_minutes'] as num? ?? 15).toInt(),
                  ),
                );
                _cartItems[id] = match;
              }
            }
          }

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  void _onPartySizeChanged() {
    setState(() => _isLoadingWaitTime = true);
    _apiService.getWaitTimeAndAvailability(widget.restaurant.id, partySize: _totalGuests).then((avail) {
      if (mounted) {
        setState(() {
          _availability = avail;
          _isLoadingWaitTime = false;
        });
      }
    }).catchError((_) {
      if (mounted) {
        setState(() => _isLoadingWaitTime = false);
      }
    });
  }

  String _formatDateYMD(DateTime dt) {
    final y = dt.year.toString().padLeft(4, '0');
    final m = dt.month.toString().padLeft(2, '0');
    final d = dt.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  String _formatDatePill(DateTime dt) {
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    final now = DateTime.now();
    final isToday = dt.year == now.year && dt.month == now.month && dt.day == now.day;
    final isTomorrow = dt.year == now.year && dt.month == now.month && dt.day == now.day + 1;

    if (isToday) return 'TODAY\n${dt.day} ${months[dt.month - 1]}';
    if (isTomorrow) return 'TOMORROW\n${dt.day} ${months[dt.month - 1]}';
    return '${days[dt.weekday - 1]}\n${dt.day} ${months[dt.month - 1]}';
  }

  void _addItemToCart(MenuItemModel item) {
    setState(() {
      _cartItems[item.id] = item;
      _cartQuantities[item.id] = (_cartQuantities[item.id] ?? 0) + 1;
    });
  }

  void _removeItemFromCart(MenuItemModel item) {
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

  Future<void> _handleReservationSubmit() async {
    final user = _activeUser ?? _authService.currentUser;

    if (user == null && !_authService.isAuthenticated) {
      final loggedInUser = await Navigator.push<UserModel>(
        context,
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );

      if (!mounted) return;

      if (loggedInUser != null) {
        setState(() => _activeUser = loggedInUser);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please log in to confirm your table reservation.'),
            backgroundColor: AppTheme.red,
          ),
        );
        return;
      }
    }

    // Validate table if in manual mode
    if (_allocationMode == 'manual' && _selectedTableId != null) {
      final tbl = _tables.firstWhere((t) => t.id == _selectedTableId, orElse: () => _tables.first);
      if (tbl.capacity < _totalGuests) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Table #${tbl.tableNumber} seats ${tbl.capacity} guests max. Your party has $_totalGuests guests.'),
            backgroundColor: AppTheme.red,
          ),
        );
        return;
      }
    }

    final selectedTable = _allocationMode == 'manual' && _selectedTableId != null
        ? _tables.firstWhere((t) => t.id == _selectedTableId, orElse: () => _tables.first)
        : null;

    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ReservationReviewScreen(
          restaurant: widget.restaurant,
          adultsCount: _adultsCount,
          childrenCount: _childrenCount,
          selectedDate: _selectedDate,
          selectedTimeSlot: _selectedTimeSlot,
          allocationMode: _allocationMode,
          selectedTable: selectedTable,
          selectedPresets: _selectedPresets.toList(),
          customRequest: _customRequestController.text,
          preOrderItems: _getPreOrderItemsList(),
          estimatedWaitMinutes: _availability?.estimatedWaitTime ?? 0,
          apiService: _apiService,
          authService: _authService,
          currentUser: _activeUser ?? user,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isUnverified = widget.restaurant.verificationStatus == 'UNDER_VERIFICATION' ||
        (widget.restaurant.isVerified == false && widget.restaurant.verificationStatus != 'APPROVED');

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Reserve a Table',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18),
            ),
            Text(
              'Live DineTrack Booking Engine',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
            ),
          ],
        ),
      ),
      body: isUnverified
          ? _buildUnderVerificationNotice()
          : _isLoading
              ? _buildLoadingSkeleton()
              : _errorMessage != null
                  ? _buildErrorView()
                  : _buildReservationForm(),
      bottomNavigationBar: isUnverified || _isLoading || _errorMessage != null
          ? null
          : _buildBottomActionBar(),
    );
  }

  Widget _buildUnderVerificationNotice() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: AppTheme.amber.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppTheme.amber.withValues(alpha: 0.4)),
              ),
              child: const Icon(Icons.hourglass_empty_rounded, color: AppTheme.amber, size: 32),
            ),
            const SizedBox(height: 18),
            const Text(
              'Under Verification',
              style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.restaurant.name} is currently completing admin verification. Online table reservations are temporarily locked.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.5),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: const Text('Back to Details', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return const Center(
      child: CircularProgressIndicator(color: AppTheme.brand500),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: AppTheme.red, size: 48),
            const SizedBox(height: 12),
            const Text(
              'Failed to Load Table Information',
              style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Unknown error occurred',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initAuthAndLoadData,
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.brand500),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReservationForm() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Restaurant Summary Card
          _buildRestaurantSummary(),
          const SizedBox(height: 16),

          // Live Availability & Dynamic Wait Time Banner
          _buildLiveAvailabilityBanner(),
          const SizedBox(height: 16),

          // Step 1: Party Size Selection (Adults & Children)
          _buildStepCard(
            stepNumber: 1,
            title: 'Party Size (Guests)',
            icon: Icons.people_alt_outlined,
            iconColor: AppTheme.brand500,
            child: _buildPartySizeSelector(),
          ),
          const SizedBox(height: 16),

          // Step 2: Date Selector
          _buildStepCard(
            stepNumber: 2,
            title: 'Booking Date',
            icon: Icons.calendar_month_outlined,
            iconColor: AppTheme.blue,
            child: _buildDateSelector(),
          ),
          const SizedBox(height: 16),

          // Step 3: Time Slot Selector & Estimated Wait Time
          _buildStepCard(
            stepNumber: 3,
            title: 'Time Slot & Wait Time',
            icon: Icons.access_time_rounded,
            iconColor: AppTheme.emerald,
            child: _buildTimeSlotSelector(),
          ),
          const SizedBox(height: 16),

          // Step 4: Table Allocation Mode
          _buildStepCard(
            stepNumber: 4,
            title: 'Table Allocation',
            icon: Icons.table_restaurant_outlined,
            iconColor: AppTheme.amber,
            child: _buildTableAllocationSection(),
          ),
          const SizedBox(height: 16),

          // Step 5: Food Pre-Order (Optional)
          _buildStepCard(
            stepNumber: 5,
            title: 'Food Pre-Order (Optional)',
            icon: Icons.restaurant_menu_rounded,
            iconColor: AppTheme.brand500,
            child: _buildFoodPreOrderSection(),
          ),
          const SizedBox(height: 16),

          // Step 6: Special Occasion & Requests
          _buildStepCard(
            stepNumber: 6,
            title: 'Occasion & Special Requests',
            icon: Icons.card_giftcard_outlined,
            iconColor: AppTheme.purple,
            child: _buildSpecialRequestsSection(),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildRestaurantSummary() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: widget.restaurant.imageUrl != null && widget.restaurant.imageUrl!.isNotEmpty
                ? Image.network(
                    widget.restaurant.imageUrl!,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) => _imagePlaceholder(),
                  )
                : _imagePlaceholder(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.restaurant.name,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  widget.restaurant.cuisine,
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.star_rounded, color: AppTheme.amber, size: 14),
                    const SizedBox(width: 3),
                    Text(
                      '${widget.restaurant.rating}',
                      style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(width: 8),
                    const Icon(Icons.access_time_filled, color: AppTheme.emerald, size: 12),
                    const SizedBox(width: 3),
                    Text(
                      widget.restaurant.formattedHours,
                      style: const TextStyle(color: AppTheme.emerald, fontSize: 11, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 60,
      height: 60,
      color: AppTheme.darkInput,
      child: const Icon(Icons.restaurant, color: AppTheme.brand500, size: 28),
    );
  }

  Widget _buildLiveAvailabilityBanner() {
    if (_isLoadingWaitTime) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: AppTheme.blue.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppTheme.blue.withValues(alpha: 0.35)),
        ),
        child: const Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.blue),
            ),
            SizedBox(width: 10),
            Text(
              'Calculating live wait time...',
              style: TextStyle(color: AppTheme.blue, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
        ),
      );
    }

    final avail = _availability;
    final availCount = avail?.availableTablesCount ?? _tables.where((t) => t.isAvailable).length;
    final crowd = avail?.crowdLevel ?? 'LOW';
    final waitMinutes = avail?.estimatedWaitTime ?? 0;

    final String waitLabel = waitMinutes > 0
        ? 'Estimated Wait: ~$waitMinutes mins (${avail?.minimumWaitTime ?? waitMinutes}–${avail?.maximumWaitTime ?? (waitMinutes + 5)} mins)'
        : (availCount > 0 ? 'Immediate Seating Available (0 mins wait)' : 'Wait time currently unavailable');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.emerald.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          const Icon(Icons.bolt_rounded, color: AppTheme.emerald, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  waitLabel,
                  style: const TextStyle(color: AppTheme.emerald, fontWeight: FontWeight.bold, fontSize: 12),
                ),
                const SizedBox(height: 2),
                Text(
                  '$availCount tables ready • Crowd: $crowd • Instant confirmation',
                  style: const TextStyle(color: Color(0xFF6EE7B7), fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepCard({
    required int stepNumber,
    required String title,
    required IconData icon,
    required Color iconColor,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: iconColor, size: 18),
              const SizedBox(width: 8),
              Text(
                'Step $stepNumber: $title',
                style: TextStyle(color: iconColor, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.4),
              ),
            ],
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  Widget _buildPartySizeSelector() {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _buildCounterField(
                label: 'Adults (12+ yrs)',
                value: _adultsCount,
                min: 1,
                max: 12,
                onChanged: (val) {
                  setState(() => _adultsCount = val);
                  _onPartySizeChanged();
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildCounterField(
                label: 'Children',
                value: _childrenCount,
                min: 0,
                max: 6,
                onChanged: (val) {
                  setState(() => _childrenCount = val);
                  _onPartySizeChanged();
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppTheme.darkInput,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.darkBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Guests:',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
              ),
              Text(
                '$_totalGuests Guests',
                style: const TextStyle(color: AppTheme.brand500, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCounterField({
    required String label,
    required int value,
    required int min,
    required int max,
    required ValueChanged<int> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppTheme.darkInput,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _counterButton(
                icon: Icons.remove,
                enabled: value > min,
                onTap: () => onChanged(value - 1),
              ),
              Text(
                '$value',
                style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              _counterButton(
                icon: Icons.add,
                enabled: value < max,
                onTap: () => onChanged(value + 1),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _counterButton({required IconData icon, required bool enabled, required VoidCallback onTap}) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: enabled ? AppTheme.darkCard : AppTheme.darkInput,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: enabled ? AppTheme.darkBorderSubtle : AppTheme.darkBorder),
        ),
        child: Icon(icon, color: enabled ? Colors.white : AppTheme.darkBorderSubtle, size: 16),
      ),
    );
  }

  Widget _buildDateSelector() {
    final dates = List.generate(14, (i) => DateTime.now().add(Duration(days: i)));

    return SizedBox(
      height: 72,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: dates.length,
        separatorBuilder: (context, index) => const SizedBox(width: 8),
        itemBuilder: (ctx, idx) {
          final dt = dates[idx];
          final isSelected = dt.year == _selectedDate.year &&
              dt.month == _selectedDate.month &&
              dt.day == _selectedDate.day;

          return InkWell(
            onTap: () => setState(() => _selectedDate = dt),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              width: 82,
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: isSelected ? AppTheme.brand500 : AppTheme.darkInput,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
                  width: isSelected ? 1.5 : 1,
                ),
              ),
              child: Center(
                child: Text(
                  _formatDatePill(dt),
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppTheme.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    height: 1.3,
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTimeSlotSelector() {
    final slots = TimeSlotModel.getStandardSlots();
    final lunchSlots = slots.where((s) => s.period == SlotPeriod.lunch).toList();
    final dinnerSlots = slots.where((s) => s.period == SlotPeriod.dinner).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Lunch Section
        const Row(
          children: [
            Icon(Icons.wb_sunny_outlined, color: AppTheme.amber, size: 14),
            SizedBox(width: 6),
            Text('Lunch Time Slots', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: lunchSlots.map((slot) => _buildTimeChip(slot)).toList(),
        ),
        const SizedBox(height: 14),

        // Dinner Section
        const Row(
          children: [
            Icon(Icons.nightlight_round, color: AppTheme.purple, size: 14),
            SizedBox(width: 6),
            Text('Dinner Time Slots', style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: dinnerSlots.map((slot) => _buildTimeChip(slot)).toList(),
        ),
      ],
    );
  }

  Widget _buildTimeChip(TimeSlotModel slot) {
    final isSelected = _selectedTimeSlot == slot.time;

    return InkWell(
      onTap: () => setState(() => _selectedTimeSlot = slot.time),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.brand500 : AppTheme.darkInput,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          slot.formattedDisplay,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildTableAllocationSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: AppTheme.darkInput,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.darkBorder),
          ),
          child: Row(
            children: [
              Expanded(
                child: _modeOptionButton(
                  title: 'Auto-Assign Table',
                  isSelected: _allocationMode == 'auto',
                  onTap: () => setState(() {
                    _allocationMode = 'auto';
                    _selectedTableId = null;
                  }),
                ),
              ),
              Expanded(
                child: _modeOptionButton(
                  title: 'Select Floor Table',
                  isSelected: _allocationMode == 'manual',
                  onTap: () => setState(() => _allocationMode = 'manual'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),

        if (_allocationMode == 'auto')
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.emerald.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_awesome, color: AppTheme.emerald, size: 18),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Intelligent Placement: Automatic optimal table allocation for $_totalGuests guests.',
                    style: const TextStyle(color: Color(0xFF6EE7B7), fontSize: 11, height: 1.4),
                  ),
                ),
              ],
            ),
          )
        else ...[
          const Text(
            'Choose an available table from the floor layout:',
            style: TextStyle(color: AppTheme.textSecondary, fontSize: 11),
          ),
          const SizedBox(height: 10),
          _buildTableGrid(),
        ],
      ],
    );
  }

  Widget _modeOptionButton({required String title, required bool isSelected, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.brand500 : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              color: isSelected ? Colors.white : AppTheme.textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTableGrid() {
    if (_tables.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.darkInput,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Text('No table data currently available.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1.15,
      ),
      itemCount: _tables.length,
      itemBuilder: (ctx, idx) {
        final tbl = _tables[idx];
        final isSelected = _selectedTableId == tbl.id;
        final isCapable = tbl.capacity >= _totalGuests;
        final isAvailable = tbl.isAvailable;
        final isSelectable = isCapable && isAvailable;

        return InkWell(
          onTap: isSelectable
              ? () {
                  setState(() {
                    _selectedTableId = isSelected ? null : tbl.id;
                  });
                }
              : () {
                  if (!isAvailable) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Table #${tbl.tableNumber} is currently ${tbl.status.label}.'),
                        duration: const Duration(seconds: 1),
                      ),
                    );
                  } else if (!isCapable) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Table #${tbl.tableNumber} only seats ${tbl.capacity} guests.'),
                        duration: const Duration(seconds: 1),
                      ),
                    );
                  }
                },
          borderRadius: BorderRadius.circular(14),
          child: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isSelected
                  ? AppTheme.brand500
                  : isSelectable
                      ? AppTheme.darkInput
                      : AppTheme.darkInput.withValues(alpha: 0.4),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected
                    ? AppTheme.brand500
                    : isSelectable
                        ? AppTheme.darkBorder
                        : AppTheme.darkBorderSubtle,
                width: isSelected ? 1.5 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  'Table #${tbl.tableNumber}',
                  style: TextStyle(
                    color: isSelected ? Colors.white : (isSelectable ? Colors.white : AppTheme.textMuted),
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${tbl.capacity} Seats • ${tbl.section}',
                  style: TextStyle(
                    color: isSelected ? Colors.white70 : AppTheme.textSecondary,
                    fontSize: 10,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? Colors.white.withValues(alpha: 0.2)
                        : tbl.status.color.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    tbl.status.label,
                    style: TextStyle(
                      color: isSelected ? Colors.white : tbl.status.color,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildFoodPreOrderSection() {
    List<MenuItemModel> allItems = _menuCategories.expand((c) => c.items).toList();

    if (_selectedFoodCategory != 'ALL') {
      final cat = _menuCategories.firstWhere(
        (c) => c.id == _selectedFoodCategory || c.name == _selectedFoodCategory,
        orElse: () => const MenuCategoryModel(id: '', restaurantId: '', name: ''),
      );
      allItems = cat.items.isNotEmpty
          ? cat.items
          : allItems.where((i) => i.categoryId == _selectedFoodCategory).toList();
    }

    if (_selectedDietFilter == 'VEG') {
      allItems = allItems.where((i) => i.isVegetarian).toList();
    } else if (_selectedDietFilter == 'NON_VEG') {
      allItems = allItems.where((i) => !i.isVegetarian).toList();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                _totalCartItemsCount > 0
                    ? '$_totalCartItemsCount Dishes Added to Booking'
                    : 'Pre-order dishes to prepare them on your arrival',
                style: TextStyle(
                  color: _totalCartItemsCount > 0 ? AppTheme.emerald : AppTheme.textSecondary,
                  fontSize: 12,
                  fontWeight: _totalCartItemsCount > 0 ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _isFoodSectionExpanded = !_isFoodSectionExpanded;
                });
              },
              icon: Icon(
                _isFoodSectionExpanded ? Icons.keyboard_arrow_up : Icons.add_circle_outline,
                size: 16,
                color: AppTheme.brand500,
              ),
              label: Text(
                _isFoodSectionExpanded ? 'Hide Dishes' : (_totalCartItemsCount > 0 ? 'Edit Dishes' : 'Browse Menu'),
                style: const TextStyle(color: AppTheme.brand500, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),

        // Dietary & Category Filter Chips
        if (_isFoodSectionExpanded && _menuCategories.isNotEmpty) ...[
          const SizedBox(height: 8),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildDietFilterChip('ALL', 'All'),
                const SizedBox(width: 6),
                _buildDietFilterChip('VEG', '🌱 Veg Only'),
                const SizedBox(width: 6),
                _buildDietFilterChip('NON_VEG', '🍗 Non-Veg'),
                const SizedBox(width: 10),
                Container(width: 1, height: 18, color: AppTheme.darkBorder),
                const SizedBox(width: 10),
                _buildCategoryFilterChip('ALL', 'All Categories'),
                ..._menuCategories.map((cat) => Padding(
                      padding: const EdgeInsets.only(left: 6),
                      child: _buildCategoryFilterChip(cat.id, cat.name),
                    )),
              ],
            ),
          ),
        ],

        // Cart Summary if items added
        if (_totalCartItemsCount > 0) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.darkInput,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.darkBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ..._cartQuantities.entries.map((entry) {
                  final item = _cartItems[entry.key]!;
                  final qty = entry.value;
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Icon(
                          item.isVegetarian ? Icons.circle : Icons.change_history,
                          color: item.isVegetarian ? AppTheme.emerald : AppTheme.red,
                          size: 12,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            item.name,
                            style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '₹${(item.price * qty).toInt()}',
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 8),
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            InkWell(
                              onTap: () => _removeItemFromCart(item),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: AppTheme.darkCard,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Icon(Icons.remove, size: 14, color: AppTheme.textSecondary),
                              ),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 6),
                              child: Text('$qty', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                            InkWell(
                              onTap: () => _addItemToCart(item),
                              child: Container(
                                padding: const EdgeInsets.all(2),
                                decoration: BoxDecoration(
                                  color: AppTheme.brand500,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Icon(Icons.add, size: 14, color: Colors.white),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
                const Divider(height: 16, color: AppTheme.darkBorder),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Pre-Order Total (incl. 5% GST):',
                      style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                    ),
                    Text(
                      '₹${_cartTotal.toInt()}',
                      style: const TextStyle(color: AppTheme.emerald, fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],

        // Expanded Menu List
        if (_isFoodSectionExpanded) ...[
          const SizedBox(height: 12),
          if (allItems.isEmpty)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: Center(
                child: Text('No menu items available for pre-order.', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: allItems.length,
              separatorBuilder: (context, index) => const SizedBox(height: 8),
              itemBuilder: (ctx, idx) {
                final item = allItems[idx];
                final qty = _cartQuantities[item.id] ?? 0;

                return Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.darkInput,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.darkBorder),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        item.isVegetarian ? Icons.circle : Icons.change_history,
                        color: item.isVegetarian ? AppTheme.emerald : AppTheme.red,
                        size: 12,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item.name,
                              style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${item.formattedPrice} • ~${item.prepTimeMinutes}m prep',
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                            ),
                          ],
                        ),
                      ),
                      if (qty == 0)
                        ElevatedButton(
                          onPressed: () => _addItemToCart(item),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.brand500,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('Add', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        )
                      else
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline, size: 20, color: AppTheme.brand500),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => _removeItemFromCart(item),
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              child: Text('$qty', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_circle, size: 20, color: AppTheme.brand500),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () => _addItemToCart(item),
                            ),
                          ],
                        ),
                    ],
                  ),
                );
              },
            ),
        ],
      ],
    );
  }

  Widget _buildDietFilterChip(String key, String label) {
    final isSelected = _selectedDietFilter == key;
    return InkWell(
      onTap: () => setState(() => _selectedDietFilter = key),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.brand500 : AppTheme.darkInput,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryFilterChip(String key, String label) {
    final isSelected = _selectedFoodCategory == key;
    return InkWell(
      onTap: () => setState(() => _selectedFoodCategory = key),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.brand500 : AppTheme.darkInput,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textSecondary,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
          ),
        ),
      ),
    );
  }

  Widget _buildSpecialRequestsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Occasion Presets:',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _specialPresets.map((preset) {
            final active = _selectedPresets.contains(preset);
            return InkWell(
              onTap: () {
                setState(() {
                  if (active) {
                    _selectedPresets.remove(preset);
                  } else {
                    _selectedPresets.add(preset);
                  }
                });
              },
              borderRadius: BorderRadius.circular(10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: active ? AppTheme.purple.withValues(alpha: 0.2) : AppTheme.darkInput,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(
                    color: active ? AppTheme.purple : AppTheme.darkBorder,
                  ),
                ),
                child: Text(
                  preset,
                  style: TextStyle(
                    color: active ? const Color(0xFFD8B4FE) : AppTheme.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _customRequestController,
          maxLines: 2,
          style: const TextStyle(color: Colors.white, fontSize: 12),
          decoration: InputDecoration(
            hintText: 'Any special dietary restrictions or seating preferences...',
            hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
            filled: true,
            fillColor: AppTheme.darkInput,
            contentPadding: const EdgeInsets.all(12),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.darkBorder),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.darkBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.brand500),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActionBar() {
    final waitMinutes = _availability?.estimatedWaitTime ?? 0;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: AppTheme.darkSurface,
        border: Border(top: BorderSide(color: AppTheme.darkBorder)),
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '$_totalGuests Guests • $_selectedTimeSlot',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${_formatDateYMD(_selectedDate)} • ${_selectedTableId != null ? "Table #$_selectedTableId" : "Auto Table"}${waitMinutes > 0 ? " • Est. Wait: ~${waitMinutes}m" : ""}',
                    style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11),
                  ),
                  if (_cartTotal > 0)
                    Text(
                      'Food Pre-Order: ₹${_cartTotal.toInt()}',
                      style: const TextStyle(color: AppTheme.emerald, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: _handleReservationSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.check_circle_outline_rounded, size: 18),
                  SizedBox(width: 6),
                  Text('Reserve Table', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
