import 'package:flutter/material.dart';
import '../../core/app_theme.dart';
import '../../services/owner_auth_service.dart';
import 'auth/owner_login_screen.dart';
import 'dashboard/owner_dashboard_screen.dart';

/// Splash Screen specifically dedicated to the Restaurant Partner flow
class OwnerSplashScreen extends StatefulWidget {
  final OwnerAuthService? authService;

  const OwnerSplashScreen({
    super.key,
    this.authService,
  });

  @override
  State<OwnerSplashScreen> createState() => _OwnerSplashScreenState();
}

class _OwnerSplashScreenState extends State<OwnerSplashScreen> {
  late final OwnerAuthService _authService;

  @override
  void initState() {
    super.initState();
    _authService = widget.authService ?? OwnerAuthService();
    _checkOwnerSession();
  }

  Future<void> _checkOwnerSession() async {
    // Artificial small delay for smooth visual transition
    await Future.delayed(const Duration(milliseconds: 600));

    final user = await _authService.restoreSession();

    if (!mounted) return;

    if (user != null && user.isOwner) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => OwnerDashboardScreen(
            ownerUser: user,
            authService: _authService,
          ),
        ),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(
          builder: (_) => OwnerLoginScreen(
            authService: _authService,
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.darkBg,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x66C81E1E),
                    blurRadius: 24,
                    offset: Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Image.asset(
                  'assets/images/app_logo.png',
                  width: 88,
                  height: 88,
                  fit: BoxFit.cover,
                ),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'Smart Table Partner',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Restaurant Management Portal',
              style: TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 36),
            const CircularProgressIndicator(
              strokeWidth: 2.5,
              color: AppTheme.brand500,
            ),
          ],
        ),
      ),
    );
  }
}
