import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import '../../../models/restaurant_model.dart';
import '../../../models/user_model.dart';
import '../../../services/owner_api_service.dart';
import '../../../services/owner_auth_service.dart';
import '../../auth/login_screen.dart';

/// Restaurant Owner Partner & Restaurant Profile Screen (Read-Only)
class OwnerProfileScreen extends StatefulWidget {
  final UserModel ownerUser;
  final OwnerApiService? apiService;
  final OwnerAuthService? authService;

  const OwnerProfileScreen({
    super.key,
    required this.ownerUser,
    this.apiService,
    this.authService,
  });

  @override
  State<OwnerProfileScreen> createState() => _OwnerProfileScreenState();
}

class _OwnerProfileScreenState extends State<OwnerProfileScreen> {
  late final OwnerApiService _apiService;
  late final OwnerAuthService _authService;

  RestaurantModel? _restaurant;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _apiService = widget.apiService ?? OwnerApiService();
    _authService = widget.authService ?? OwnerAuthService();
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    final restId = widget.ownerUser.restaurantId;
    if (restId == null || restId.isEmpty) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final rest = await _apiService.getOwnerRestaurant(restId);
      if (mounted) {
        setState(() {
          _restaurant = rest;
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleLogout() async {
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
          'Are you sure you want to end your restaurant management session?',
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
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.bold)),
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
    final user = widget.ownerUser;
    final rest = _restaurant;

    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      appBar: AppBar(
        backgroundColor: AppTheme.darkSurface,
        elevation: 0,
        title: const Text(
          'Partner & Restaurant Profile',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: AppTheme.red),
            tooltip: 'Log Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.brand500))
          : RefreshIndicator(
              color: AppTheme.brand500,
              backgroundColor: AppTheme.darkCard,
              onRefresh: _loadProfileData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1. Partner Identity Header Card
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            AppTheme.brandAccent.withValues(alpha: 0.35),
                            AppTheme.darkCard,
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.brandAccent.withValues(alpha: 0.5)),
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 32,
                            backgroundColor: AppTheme.brand500,
                            child: Text(
                              user.name.isNotEmpty ? user.name[0].toUpperCase() : 'O',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: AppTheme.emerald.withAlpha(30),
                                    borderRadius: BorderRadius.circular(6),
                                    border: Border.all(color: AppTheme.emerald.withAlpha(80)),
                                  ),
                                  child: const Text(
                                    'AUTHENTICATED RESTAURANT OWNER',
                                    style: TextStyle(
                                      color: AppTheme.emerald,
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  user.email,
                                  style: const TextStyle(color: Color(0xFFCBD5E1), fontSize: 13),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 2. Restaurant Profile Card (Read-Only)
                    const Text(
                      'Assigned Restaurant Details',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),

                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: AppTheme.cardDecoration(),
                      child: Column(
                        children: [
                          _buildProfileRow('Restaurant Name', rest?.name ?? user.restaurantName ?? 'N/A'),
                          const Divider(color: AppTheme.darkBorder, height: 20),
                          _buildProfileRow('Restaurant ID', rest?.id ?? user.restaurantId ?? 'N/A'),
                          const Divider(color: AppTheme.darkBorder, height: 20),
                          _buildProfileRow('Verification Status', rest?.verificationStatus ?? 'APPROVED', isBadge: true),
                          const Divider(color: AppTheme.darkBorder, height: 20),
                          _buildProfileRow('Address', rest?.address ?? rest?.city ?? 'Registered on Smart Table'),
                          const Divider(color: AppTheme.darkBorder, height: 20),
                          _buildProfileRow('Cuisine', rest?.cuisine ?? 'Multi-Cuisine'),
                          if (rest?.phone != null && rest!.phone!.isNotEmpty) ...[
                            const Divider(color: AppTheme.darkBorder, height: 20),
                            _buildProfileRow('Contact Phone', rest.phone!),
                          ],
                          if (rest?.openingTime != null && rest?.closingTime != null) ...[
                            const Divider(color: AppTheme.darkBorder, height: 20),
                            _buildProfileRow('Operating Hours', '${rest!.openingTime} - ${rest.closingTime}'),
                          ],
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // 3. Read-Only Notice
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.darkInput,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.darkBorder),
                      ),
                      child: const Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.info_outline, color: AppTheme.brand500, size: 20),
                          SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Restaurant metadata and business information are managed by Smart Table Administration to ensure verified listing integrity.',
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 12, height: 1.4),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // 4. Logout Button
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton.icon(
                        onPressed: _handleLogout,
                        icon: const Icon(Icons.logout, color: AppTheme.red),
                        label: const Text(
                          'LOG OUT PARTNER SESSION',
                          style: TextStyle(
                            color: AppTheme.red,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.5,
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppTheme.red),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),

                    const SizedBox(height: 30),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildProfileRow(String label, String value, {bool isBadge = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
        const SizedBox(width: 16),
        Flexible(
          child: isBadge
              ? Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppTheme.emerald.withAlpha(25),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppTheme.emerald.withAlpha(70)),
                  ),
                  child: Text(
                    value.toUpperCase(),
                    style: const TextStyle(
                      color: AppTheme.emerald,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              : Text(
                  value,
                  textAlign: TextAlign.end,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
        ),
      ],
    );
  }
}
