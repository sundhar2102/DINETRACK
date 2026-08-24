import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import '../../../models/restaurant_model.dart';
import '../../../models/table_model.dart';
import '../../../services/owner_api_service.dart';
import '../../../services/owner_auth_service.dart';
import '../auth/owner_login_screen.dart';
import 'add_table_screen.dart';
import 'edit_table_screen.dart';

class OwnerTablesScreen extends StatefulWidget {
  final RestaurantModel? restaurant;
  final OwnerApiService? apiService;
  final OwnerAuthService? authService;

  const OwnerTablesScreen({
    super.key,
    this.restaurant,
    this.apiService,
    this.authService,
  });

  @override
  State<OwnerTablesScreen> createState() => _OwnerTablesScreenState();
}

class _OwnerTablesScreenState extends State<OwnerTablesScreen> {
  late final OwnerApiService _apiService;
  late final OwnerAuthService _authService;

  RestaurantModel? _restaurant;
  List<TableModel> _tables = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _searchQuery = '';
  String _selectedFilter = 'ALL';
  bool _isProcessingAction = false;

  final TextEditingController _searchController = TextEditingController();

  static const List<String> _statusFilters = [
    'ALL',
    'AVAILABLE',
    'RESERVED',
    'OCCUPIED',
    'CLEANING',
    'MAINTENANCE',
    'BLOCKED',
  ];

  static const List<String> _validStatuses = [
    'AVAILABLE',
    'OCCUPIED',
    'RESERVED',
    'CLEANING',
    'BLOCKED',
    'MAINTENANCE',
  ];

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    _authService = widget.authService ?? OwnerAuthService();
    _restaurant = widget.restaurant;
    _loadData();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (_restaurant == null) {
        final currentUser = _authService.currentUser;
        final restId = currentUser?.restaurantId ?? _authService.restaurant?.id;
        if (restId != null && restId.isNotEmpty) {
          _restaurant = await _apiService.getOwnerRestaurant(restId);
        } else {
          final me = await _apiService.getMe();
          if (me.restaurantId != null && me.restaurantId!.isNotEmpty) {
            _restaurant = await _apiService.getOwnerRestaurant(me.restaurantId!);
          }
        }
      }

      if (_restaurant == null) {
        throw Exception('Unable to locate partner restaurant. Please sign in again.');
      }

      final tables = await _apiService.getRestaurantTables(_restaurant!.id);

      if (!mounted) return;
      setState(() {
        _tables = tables;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      final errStr = e.toString();
      if (errStr.contains('401') || errStr.contains('Unauthorized')) {
        await _authService.logout();
        if (!mounted) return;
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const OwnerLoginScreen()),
          (route) => false,
        );
        return;
      }

      setState(() {
        _errorMessage = errStr.replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  List<TableModel> get _filteredTables {
    return _tables.where((tbl) {
      final statusName = tbl.status.name.toUpperCase();
      // 1. Status Filter
      if (_selectedFilter != 'ALL') {
        if (statusName != _selectedFilter) {
          return false;
        }
      }

      // 2. Search Query Filter (table number, capacity, section)
      if (_searchQuery.trim().isNotEmpty) {
        final q = _searchQuery.toLowerCase().trim();
        final matchNum = tbl.tableNumber.toLowerCase().contains(q);
        final matchSec = tbl.section.toLowerCase().contains(q);
        final matchCap = '${tbl.capacity}'.contains(q);
        final matchStatus = statusName.toLowerCase().contains(q);
        if (!matchNum && !matchSec && !matchCap && !matchStatus) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  // Count Getters for Real Metrics
  int get _totalCount => _tables.length;
  int get _availableCount => _tables.where((t) => t.isAvailable).length;
  int get _reservedCount => _tables.where((t) => t.isReserved).length;
  int get _occupiedCount => _tables.where((t) => t.isOccupied).length;
  int get _cleaningCount => _tables.where((t) => t.isCleaning).length;
  int get _maintenanceCount => _tables.where((t) => t.isMaintenance).length;
  int get _blockedCount => _tables.where((t) => t.isBlocked).length;

  Future<void> _navigateToAddTable() async {
    if (_restaurant == null) return;
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => AddTableScreen(
          restaurant: _restaurant!,
          apiService: _apiService,
        ),
      ),
    );

    if (result == true) {
      _loadData();
    }
  }

  Future<void> _navigateToEditTable(TableModel table) async {
    final result = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => EditTableScreen(
          table: table,
          apiService: _apiService,
        ),
      ),
    );

    if (result == true) {
      _loadData();
    }
  }

  Future<void> _promptDeleteTable(TableModel table) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: AppTheme.darkCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.delete_forever_rounded, color: AppTheme.red),
              SizedBox(width: 8),
              Text('Delete Table', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          content: Text(
            'Are you sure you want to permanently delete Table ${table.tableNumber}? Active bookings on this table will need manual reassignment.',
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Delete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );

    if (confirmed == true) {
      _deleteTable(table);
    }
  }

  Future<void> _deleteTable(TableModel table) async {
    setState(() => _isProcessingAction = true);
    try {
      await _apiService.deleteTable(table.id);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Table ${table.tableNumber} deleted successfully'),
          backgroundColor: AppTheme.emerald,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      _loadData();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isProcessingAction = false);
      }
    }
  }

  Future<void> _promptChangeStatus(TableModel table) async {
    final currentStatusName = table.status.name.toUpperCase();
    final newStatus = await showModalBottomSheet<String>(
      context: context,
      backgroundColor: AppTheme.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppTheme.darkBorderSubtle,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.swap_horiz_rounded, color: AppTheme.brand500, size: 22),
                    const SizedBox(width: 10),
                    Text(
                      'Update Status • Table #${table.tableNumber}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Current status: $currentStatusName',
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 16),
                ..._validStatuses.map((st) {
                  final isCurrent = currentStatusName == st;
                  final color = _getStatusColor(st);
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    leading: Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    title: Text(
                      st,
                      style: TextStyle(
                        color: isCurrent ? color : Colors.white,
                        fontWeight: isCurrent ? FontWeight.bold : FontWeight.w500,
                        fontSize: 14,
                      ),
                    ),
                    trailing: isCurrent
                        ? const Icon(Icons.check_rounded, color: AppTheme.emerald, size: 20)
                        : null,
                    onTap: isCurrent ? null : () => Navigator.of(ctx).pop(st),
                  );
                }),
                const SizedBox(height: 8),
              ],
            ),
          ),
        );
      },
    );

    if (newStatus == null || newStatus == currentStatusName) return;

    // Confirm potentially disruptive transitions
    if (newStatus == 'MAINTENANCE' || newStatus == 'BLOCKED') {
      if (!mounted) return;
      final confirm = await showDialog<bool>(
        context: context,
        builder: (ctx) {
          return AlertDialog(
            backgroundColor: AppTheme.darkCard,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: const BorderSide(color: AppTheme.darkBorder),
            ),
            title: Text(
              'Change Table ${table.tableNumber} to $newStatus?',
              style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
            ),
            content: Text(
              'Marking this table as $newStatus will immediately take it out of available customer reservation inventory.',
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.of(ctx).pop(false),
                child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
              ),
              ElevatedButton(
                onPressed: () => Navigator.of(ctx).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.brand500,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Confirm', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      );

      if (confirm != true) return;
    }

    setState(() => _isProcessingAction = true);

    try {
      await _apiService.updateTableStatus(table.id, newStatus);
      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Table ${table.tableNumber} status updated to $newStatus'),
          backgroundColor: AppTheme.emerald,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );

      _loadData();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isProcessingAction = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceAll('Exception: ', '')),
          backgroundColor: AppTheme.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  Color _getStatusColor(dynamic status) {
    final String s = (status is TableStatus) ? status.name.toUpperCase() : status.toString().toUpperCase();
    switch (s) {
      case 'AVAILABLE':
        return AppTheme.emerald;
      case 'OCCUPIED':
        return AppTheme.red;
      case 'RESERVED':
        return AppTheme.amber;
      case 'CLEANING':
        return AppTheme.brand500;
      case 'MAINTENANCE':
        return AppTheme.amber;
      case 'BLOCKED':
        return AppTheme.textMuted;
      default:
        return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final restaurantName = _restaurant?.name ?? 'Floor & Table Overview';

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Table Management',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            Text(
              restaurantName,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12),
            child: ElevatedButton.icon(
              key: const Key('add_table_header_btn'),
              onPressed: _isLoading ? null : _navigateToAddTable,
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Table', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                elevation: 0,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(color: AppTheme.darkBorder, height: 1),
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading && _tables.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppTheme.brand500,
          strokeWidth: 3,
        ),
      );
    }

    if (_errorMessage != null && _tables.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.cloud_off_rounded, color: AppTheme.red, size: 48),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _loadData,
                icon: const Icon(Icons.refresh_rounded, size: 18),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.brand500,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ],
          ),
        ),
      );
    }

    final filtered = _filteredTables;

    return RefreshIndicator(
      onRefresh: _loadData,
      color: AppTheme.brand500,
      backgroundColor: AppTheme.darkCard,
      child: ListView(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        children: [
          // 1. Live Floor Metrics Cards Grid
          _buildMetricsOverview(),

          const SizedBox(height: 16),

          // 2. Search Box
          _buildSearchBar(),

          const SizedBox(height: 12),

          // 3. Status Filter Horizontal Chips
          _buildFilterTabs(),

          const SizedBox(height: 16),

          // 4. Section Header with Count
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Floor Tables (${filtered.length})',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (_isProcessingAction)
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.brand500),
                ),
            ],
          ),

          const SizedBox(height: 12),

          // 5. Tables Grid
          if (filtered.isEmpty)
            _buildEmptyState()
          else
            _buildTablesGrid(filtered),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildMetricsOverview() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Real-Time Floor Capacity',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.brand500.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$_totalCount Total Tables',
                  style: const TextStyle(
                    color: AppTheme.brand500,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildMetricChip('Available', '$_availableCount', AppTheme.emerald),
                const SizedBox(width: 8),
                _buildMetricChip('Reserved', '$_reservedCount', AppTheme.amber),
                const SizedBox(width: 8),
                _buildMetricChip('Occupied', '$_occupiedCount', AppTheme.red),
                const SizedBox(width: 8),
                _buildMetricChip('Cleaning', '$_cleaningCount', AppTheme.brand500),
                const SizedBox(width: 8),
                _buildMetricChip('Maintenance', '$_maintenanceCount', AppTheme.amber),
                const SizedBox(width: 8),
                _buildMetricChip('Blocked', '$_blockedCount', AppTheme.textMuted),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricChip(String label, String count, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 11, fontWeight: FontWeight.w500),
          ),
          Text(
            count,
            style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      key: const Key('table_search_input'),
      controller: _searchController,
      onChanged: (val) => setState(() => _searchQuery = val),
      style: const TextStyle(color: Colors.white, fontSize: 13),
      decoration: InputDecoration(
        hintText: 'Search by table number, section, capacity...',
        hintStyle: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
        prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.textSecondary, size: 20),
        suffixIcon: _searchQuery.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear_rounded, color: AppTheme.textSecondary, size: 18),
                onPressed: () {
                  _searchController.clear();
                  setState(() => _searchQuery = '');
                },
              )
            : null,
        filled: true,
        fillColor: AppTheme.darkInput,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: AppTheme.brand500, width: 1.5),
        ),
      ),
    );
  }

  Widget _buildFilterTabs() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: _statusFilters.map((filter) {
          final isSelected = _selectedFilter == filter;
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: FilterChip(
              key: Key('filter_chip_$filter'),
              label: Text(
                filter,
                style: TextStyle(
                  color: isSelected ? Colors.white : AppTheme.textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 11,
                ),
              ),
              selected: isSelected,
              onSelected: (_) => setState(() => _selectedFilter = filter),
              backgroundColor: AppTheme.darkCard,
              selectedColor: AppTheme.brand500,
              showCheckmark: false,
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
                side: BorderSide(
                  color: isSelected ? AppTheme.brand500 : AppTheme.darkBorder,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildTablesGrid(List<TableModel> tables) {
    return GridView.builder(
      key: const Key('owner_tables_grid'),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.95,
      ),
      itemCount: tables.length,
      itemBuilder: (ctx, index) {
        final table = tables[index];
        return _buildTableCard(table);
      },
    );
  }

  Widget _buildTableCard(TableModel table) {
    final statusColor = _getStatusColor(table.status);

    return Container(
      decoration: AppTheme.cardDecoration(
        borderColor: statusColor.withValues(alpha: 0.4),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Top Row: Table Number & Options Menu
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'TABLE ${table.tableNumber.toUpperCase()}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 14,
                      letterSpacing: 0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_vert_rounded, color: AppTheme.textSecondary, size: 18),
                  color: AppTheme.darkCard,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onSelected: (val) {
                    if (val == 'status') {
                      _promptChangeStatus(table);
                    } else if (val == 'edit') {
                      _navigateToEditTable(table);
                    } else if (val == 'delete') {
                      _promptDeleteTable(table);
                    }
                  },
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'status',
                      child: Row(
                        children: [
                          Icon(Icons.swap_horiz_rounded, color: AppTheme.brand500, size: 18),
                          SizedBox(width: 8),
                          Text('Change Status', style: TextStyle(color: Colors.white, fontSize: 13)),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'edit',
                      child: Row(
                        children: [
                          Icon(Icons.edit_rounded, color: AppTheme.blue, size: 18),
                          SizedBox(width: 8),
                          Text('Edit Table', style: TextStyle(color: Colors.white, fontSize: 13)),
                        ],
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: Row(
                        children: [
                          Icon(Icons.delete_rounded, color: AppTheme.red, size: 18),
                          SizedBox(width: 8),
                          Text('Delete Table', style: TextStyle(color: AppTheme.red, fontSize: 13)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),

            // Middle: Capacity Pill & Section
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.darkInput,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppTheme.darkBorder),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.people_alt_rounded, color: Color(0xFFCBD5E1), size: 13),
                      const SizedBox(width: 4),
                      Text(
                        '${table.capacity} SEATS',
                        style: const TextStyle(
                          color: Color(0xFFCBD5E1),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  table.section,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 11,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),

            // Bottom: Status Indicator Chip & Quick Tap Action
            InkWell(
              onTap: () => _promptChangeStatus(table),
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 5, horizontal: 8),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(color: statusColor, shape: BoxShape.circle),
                    ),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        table.status.name.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3,
                        ),
                        overflow: TextOverflow.ellipsis,
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

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: AppTheme.cardDecoration(),
      child: Column(
        children: [
          const Icon(Icons.table_restaurant_outlined, color: AppTheme.textMuted, size: 40),
          const SizedBox(height: 12),
          const Text(
            'No Tables Found',
            style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            _searchQuery.isNotEmpty || _selectedFilter != 'ALL'
                ? 'No tables match the selected query or filter.'
                : 'No tables configured for this restaurant yet.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12),
          ),
          if (_searchQuery.isEmpty && _selectedFilter == 'ALL') ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: _navigateToAddTable,
              icon: const Icon(Icons.add_rounded, size: 16),
              label: const Text('Add First Table'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.brand500,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
