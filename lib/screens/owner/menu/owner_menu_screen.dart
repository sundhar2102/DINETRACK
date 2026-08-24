import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import '../../../models/menu_category_model.dart';
import '../../../models/menu_item_model.dart';
import '../../../services/owner_api_service.dart';
import '../../../services/owner_auth_service.dart';
import '../../../widgets/owner_menu_item_card.dart';
import '../auth/owner_login_screen.dart';
import 'add_menu_item_screen.dart';
import 'edit_menu_item_screen.dart';

/// Restaurant Owner Menu Management Screen
class OwnerMenuScreen extends StatefulWidget {
  final OwnerApiService? apiService;
  final OwnerAuthService? authService;

  const OwnerMenuScreen({
    super.key,
    this.apiService,
    this.authService,
  });

  @override
  State<OwnerMenuScreen> createState() => _OwnerMenuScreenState();
}

class _OwnerMenuScreenState extends State<OwnerMenuScreen> {
  late final OwnerApiService _apiService;
  late final OwnerAuthService _authService;

  List<MenuCategoryModel> _categories = [];
  List<MenuItemModel> _allItems = [];
  List<MenuItemModel> _filteredItems = [];

  bool _isLoading = true;
  String? _errorMessage;
  String? _actionLoadingItemId;

  String _searchQuery = '';
  String _selectedFilter = 'ALL';
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    _authService = widget.authService ?? OwnerAuthService();
    _loadMenuData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadMenuData() async {
    final restId = _authService.currentUser?.restaurantId ?? _authService.restaurant?.id;
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
      final menu = await _apiService.getRestaurantMenu(restId);
      if (mounted) {
        setState(() {
          _categories = menu.categories;
          _allItems = menu.items;
          _applyFilters();
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        final msg = e.toString().replaceFirst('Exception: ', '');
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
        MaterialPageRoute(builder: (_) => const OwnerLoginScreen()),
        (route) => false,
      );
    }
  }

  void _applyFilters() {
    List<MenuItemModel> results = List.from(_allItems);

    // 1. Search Query Filter (name, description, or category name)
    if (_searchQuery.trim().isNotEmpty) {
      final query = _searchQuery.trim().toLowerCase();
      results = results.where((item) {
        final matchesName = item.name.toLowerCase().contains(query);
        final matchesDesc = item.description?.toLowerCase().contains(query) ?? false;
        final catName = _categories
            .firstWhere(
              (c) => c.id == item.categoryId,
              orElse: () => const MenuCategoryModel(id: '', restaurantId: '', name: ''),
            )
            .name
            .toLowerCase();
        final matchesCat = catName.contains(query);
        return matchesName || matchesDesc || matchesCat;
      }).toList();
    }

    // 2. Chip Filter: ALL, AVAILABLE, SOLD OUT, VEG, NON-VEG
    switch (_selectedFilter) {
      case 'AVAILABLE':
        results = results.where((item) => item.isAvailable).toList();
        break;
      case 'SOLD OUT':
        results = results.where((item) => !item.isAvailable).toList();
        break;
      case 'VEG':
        results = results.where((item) => item.isVegetarian).toList();
        break;
      case 'NON-VEG':
        results = results.where((item) => !item.isVegetarian).toList();
        break;
      case 'ALL':
      default:
        break;
    }

    setState(() {
      _filteredItems = results;
    });
  }

  Future<void> _toggleAvailability(MenuItemModel item, bool newAvailability) async {
    setState(() => _actionLoadingItemId = item.id);
    try {
      await _apiService.toggleMenuItemAvailability(item.id, newAvailability);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: newAvailability ? AppTheme.emerald : AppTheme.red,
            content: Text(
              newAvailability
                  ? '✅ Marked "${item.name}" as Available'
                  : '🔴 Marked "${item.name}" as Sold Out',
            ),
          ),
        );
        _loadMenuData();
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
    } finally {
      if (mounted) {
        setState(() => _actionLoadingItemId = null);
      }
    }
  }

  Future<void> _confirmDelete(MenuItemModel item) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Delete Menu Item?',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to permanently delete "${item.name}" from your restaurant menu?',
          style: const TextStyle(color: AppTheme.textSecondary),
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
            child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() => _actionLoadingItemId = item.id);
      try {
        await _apiService.deleteMenuItem(item.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: AppTheme.emerald,
              content: Text('Menu item deleted successfully.'),
            ),
          );
          _loadMenuData();
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
      } finally {
        if (mounted) {
          setState(() => _actionLoadingItemId = null);
        }
      }
    }
  }

  Future<void> _navigateToAddItem() async {
    final restId = _authService.currentUser?.restaurantId ?? _authService.restaurant?.id ?? '';
    final added = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => AddMenuItemScreen(
          restaurantId: restId,
          categories: _categories,
          apiService: _apiService,
        ),
      ),
    );

    if (added == true && mounted) {
      _loadMenuData();
    }
  }

  Future<void> _navigateToEditItem(MenuItemModel item) async {
    final updated = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => EditMenuItemScreen(
          item: item,
          apiService: _apiService,
        ),
      ),
    );

    if (updated == true && mounted) {
      _loadMenuData();
    }
  }

  String _getCategoryName(String categoryId) {
    for (final cat in _categories) {
      if (cat.id == categoryId) return cat.name;
    }
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final restaurantName = _authService.restaurant?.name ??
        _authService.currentUser?.restaurantName ??
        'Restaurant Menu';

    final totalCount = _allItems.length;
    final availableCount = _allItems.where((i) => i.isAvailable).length;
    final soldOutCount = _allItems.where((i) => !i.isAvailable).length;
    final categoryCount = _categories.length;

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _navigateToAddItem,
        backgroundColor: AppTheme.brand500,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Add Dish', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        color: AppTheme.brand500,
        backgroundColor: AppTheme.darkCard,
        onRefresh: _loadMenuData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Header with Stats & Restaurant Name
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: AppTheme.cardDecoration(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                restaurantName,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              const Text(
                                'Live Menu & Inventory Management',
                                style: TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: _navigateToAddItem,
                          icon: const Icon(Icons.add, size: 16),
                          label: const Text('Add Item'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.brand500,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Metrics Row
                    Row(
                      children: [
                        _buildMetricPill('Total Items', '$totalCount', AppTheme.brand500),
                        const SizedBox(width: 8),
                        _buildMetricPill('Available', '$availableCount', AppTheme.emerald),
                        const SizedBox(width: 8),
                        _buildMetricPill('Sold Out', '$soldOutCount', AppTheme.red),
                        if (categoryCount > 0) ...[
                          const SizedBox(width: 8),
                          _buildMetricPill('Categories', '$categoryCount', AppTheme.amber),
                        ],
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 2. Search Bar
              TextField(
                controller: _searchController,
                style: const TextStyle(color: Colors.white, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Search by dish name, ingredients, or category...',
                  hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                  prefixIcon: const Icon(Icons.search, color: AppTheme.textSecondary, size: 20),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: AppTheme.textSecondary, size: 18),
                          onPressed: () {
                            _searchController.clear();
                            setState(() {
                              _searchQuery = '';
                              _applyFilters();
                            });
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppTheme.darkInput,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                    borderSide: const BorderSide(color: AppTheme.brand500, width: 1.5),
                  ),
                ),
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val;
                    _applyFilters();
                  });
                },
              ),

              const SizedBox(height: 12),

              // 3. Filter Chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterChip('ALL'),
                    const SizedBox(width: 8),
                    _buildFilterChip('AVAILABLE'),
                    const SizedBox(width: 8),
                    _buildFilterChip('SOLD OUT'),
                    const SizedBox(width: 8),
                    _buildFilterChip('VEG'),
                    const SizedBox(width: 8),
                    _buildFilterChip('NON-VEG'),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // 4. Body Content: Loading, Error, Empty, or List
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40.0),
                    child: CircularProgressIndicator(color: AppTheme.brand500),
                  ),
                )
              else if (_errorMessage != null)
                _buildErrorView()
              else if (_filteredItems.isEmpty)
                _buildEmptyState()
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _filteredItems.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (ctx, index) {
                    final item = _filteredItems[index];
                    return OwnerMenuItemCard(
                      item: item,
                      categoryName: _getCategoryName(item.categoryId),
                      isActionLoading: _actionLoadingItemId == item.id,
                      onEdit: () => _navigateToEditItem(item),
                      onDelete: () => _confirmDelete(item),
                      onToggleAvailability: (newVal) => _toggleAvailability(item, newVal),
                    );
                  },
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricPill(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.4)),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 10,
                fontWeight: FontWeight.w500,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String filter) {
    final isSelected = _selectedFilter == filter;
    return ChoiceChip(
      label: Text(filter),
      selected: isSelected,
      selectedColor: AppTheme.brand500,
      backgroundColor: AppTheme.darkCard,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textSecondary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 12,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedFilter = filter;
            _applyFilters();
          });
        }
      },
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            const Icon(Icons.error_outline, color: AppTheme.red, size: 40),
            const SizedBox(height: 12),
            Text(
              _errorMessage ?? 'Failed to load menu items',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white, fontSize: 14),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadMenuData,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40.0),
        child: Column(
          children: [
            const Icon(Icons.restaurant_menu, color: AppTheme.textMuted, size: 48),
            const SizedBox(height: 12),
            const Text(
              'No Menu Items Found',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              _searchQuery.isNotEmpty
                  ? 'No dishes matching "$_searchQuery"'
                  : 'Start adding delicious food items to your menu.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            if (_searchQuery.isEmpty) ...[
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _navigateToAddItem,
                icon: const Icon(Icons.add),
                label: const Text('Add First Menu Item'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.brand500,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
