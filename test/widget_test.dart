import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:mobile/screens/auth/login_screen.dart';
import 'package:mobile/screens/auth/signup_screen.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('LoginScreen renders branding, inputs, and sign in button', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: LoginScreen(),
      ),
    );

    // Verify Smart Table branding & Diner sign in
    expect(find.text('Smart Table'), findsOneWidget);
    expect(find.text('Diner'), findsOneWidget);
    expect(find.text('Restaurant Owner'), findsOneWidget);
    expect(find.text('Diner Sign In'), findsOneWidget);
    expect(find.text('EMAIL ADDRESS'), findsOneWidget);
    expect(find.text('PASSWORD'), findsOneWidget);
    expect(find.text('SIGN IN AS DINER'), findsOneWidget);
    expect(find.text('Sign Up'), findsOneWidget);

    // Switch to Restaurant Owner Tab
    await tester.tap(find.text('Restaurant Owner'));
    await tester.pumpAndSettle();

    expect(find.text('Restaurant Owner Sign In'), findsOneWidget);
    expect(find.text('OWNER / PARTNER EMAIL'), findsOneWidget);
    expect(find.text('SIGN IN AS RESTAURANT OWNER'), findsOneWidget);
  });

  testWidgets('SignupScreen renders full registration form', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: SignupScreen(),
      ),
    );

    // Verify fields
    expect(find.text('Create Diner Account'), findsOneWidget);
    expect(find.text('FULL NAME'), findsOneWidget);
    expect(find.text('EMAIL ADDRESS'), findsOneWidget);
    expect(find.text('PHONE NUMBER (OPTIONAL)'), findsOneWidget);
    expect(find.text('CREATE DINER ACCOUNT'), findsOneWidget);
  });
}
