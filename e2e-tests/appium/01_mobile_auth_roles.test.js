/**
 * Suite M01: Mobile Application Splash, Role Switcher Tab & Authentication
 * 18 Test Cases
 */
module.exports = {
  suiteId: 'MOB-AUTH-01',
  suiteName: 'Mobile Authentication & Role Switcher',
  platform: 'Mobile',
  tests: [
    {
      id: 'ST-MOB-AUTH-001',
      title: 'Mobile App Launch & Splash Screen Animation',
      description: 'Launch Smart Table mobile app and verify splash screen logo branding',
      expected: 'App launches cleanly with Smart Table brand logo and subtitle',
    },
    {
      id: 'ST-MOB-AUTH-002',
      title: 'Splash Screen Session Check - Unauthenticated User',
      description: 'Verify unauthenticated session automatically routes to Login Screen',
      expected: 'Routes to Login Screen within 800ms',
    },
    {
      id: 'ST-MOB-AUTH-003',
      title: 'Render Unified Login Screen with Role Switcher Tabs',
      description: 'Verify both "Diner" and "Restaurant Owner" segmented tabs are present',
      expected: 'Role switcher tabs rendered with active styling on Diner by default',
    },
    {
      id: 'ST-MOB-AUTH-004',
      title: 'Diner Sign In Form Elements Verification',
      description: 'Verify Email input, Password input, and "SIGN IN AS DINER" button',
      expected: 'All diner form controls are visible and interactable',
    },
    {
      id: 'ST-MOB-AUTH-005',
      title: 'Switch to "Restaurant Owner" Tab Interaction',
      description: 'Tap on "Restaurant Owner" tab on login card',
      expected: 'Header switches to "Restaurant Owner Sign In" and button to "SIGN IN AS RESTAURANT OWNER"',
    },
    {
      id: 'ST-MOB-AUTH-006',
      title: 'Owner Form Hint & Icon Dynamic Change',
      description: 'Verify email hint changes to "e.g. owner@sangeetha.com" and icon to storefront',
      expected: 'Dynamic hint and partner branding updated instantly',
    },
    {
      id: 'ST-MOB-AUTH-007',
      title: 'Switch Back to "Diner" Tab Interaction',
      description: 'Tap on "Diner" tab on login card',
      expected: 'Form controls restore back to Diner mode smoothly',
    },
    {
      id: 'ST-MOB-AUTH-008',
      title: 'Customer Login with Valid Credentials (Mobile)',
      description: 'Log in with alex@smarttable.com / Password123!',
      expected: 'Navigates directly to Customer Home Screen with restaurant feed',
    },
    {
      id: 'ST-MOB-AUTH-009',
      title: 'Customer Session Persistence in SharedPreferences',
      description: 'Kill app and re-launch; verify customer remains logged in without re-entering credentials',
      expected: 'Splash screen reads smarttable_auth_token and opens Customer Home Screen',
    },
    {
      id: 'ST-MOB-AUTH-010',
      title: 'Restaurant Owner Login with Valid Partner Account (Mobile)',
      description: 'Switch to Owner tab, submit owner@sangeetha.com / Password123!',
      expected: 'Navigates directly to Owner Dashboard Screen with live restaurant metrics',
    },
    {
      id: 'ST-MOB-AUTH-011',
      title: 'Owner Session Persistence in SharedPreferences',
      description: 'Kill app and re-launch; verify owner remains logged into Partner Dashboard',
      expected: 'Splash screen reads smarttable_owner_token and opens Owner Dashboard Screen',
    },
    {
      id: 'ST-MOB-AUTH-012',
      title: 'Customer Account Attempting Owner Login Rejection',
      description: 'Submit customer credentials in Owner tab',
      expected: 'Rejection error: "This account does not have restaurant-owner access"',
    },
    {
      id: 'ST-MOB-AUTH-013',
      title: 'Mobile Form Validation - Empty Fields',
      description: 'Tap Sign In with empty email and password fields',
      expected: 'Inline error banners: "Please enter your email" and "Please enter your password"',
    },
    {
      id: 'ST-MOB-AUTH-014',
      title: 'Mobile Form Validation - Invalid Email Syntax',
      description: 'Enter invalid email "test.com" and tap Sign In',
      expected: 'Inline validation error: "Please enter a valid email address"',
    },
    {
      id: 'ST-MOB-AUTH-015',
      title: 'Mobile Password Visibility Toggle',
      description: 'Tap eye icon on password input field',
      expected: 'Toggles between hidden dots and cleartext password',
    },
    {
      id: 'ST-MOB-AUTH-016',
      title: 'Navigate to Mobile Sign Up Screen',
      description: 'Tap "Sign Up" link at bottom of login screen',
      expected: 'Opens Customer Sign Up Screen with full registration form',
    },
    {
      id: 'ST-MOB-AUTH-017',
      title: 'Owner Mobile Logout Flow',
      description: 'From Owner Profile tab, tap "LOG OUT PARTNER SESSION" with confirmation modal',
      expected: 'Tokens cleared, session terminated, and returns to Unified Login Screen',
    },
    {
      id: 'ST-MOB-AUTH-018',
      title: 'Customer Mobile Logout Flow',
      description: 'From Customer Profile, tap Logout',
      expected: 'Tokens cleared, returns to Unified Login Screen in Diner mode',
    },
  ],
};
