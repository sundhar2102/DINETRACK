import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import '../models/location_model.dart';

class LocationService {
  LocationModel? _lastKnownLocation;
  LocationModel? get lastKnownLocation => _lastKnownLocation;

  LocationService();

  /// Check whether GPS location service is enabled on the device
  Future<bool> isServiceEnabled() async {
    try {
      return await Geolocator.isLocationServiceEnabled();
    } catch (e) {
      debugPrint('Error checking location service: $e');
      return false;
    }
  }

  /// Check current permission status
  Future<LocationPermission> checkPermission() async {
    return await Geolocator.checkPermission();
  }

  /// Request location permission
  Future<LocationPermission> requestPermission() async {
    return await Geolocator.requestPermission();
  }

  /// Open application settings for permanently denied permissions
  Future<bool> openAppSettings() async {
    return await Geolocator.openAppSettings();
  }

  /// Open device location settings for disabled GPS service
  Future<bool> openLocationSettings() async {
    return await Geolocator.openLocationSettings();
  }

  /// Primary method to determine current GPS position with reverse geocoding
  Future<LocationResult> getCurrentLocation({bool requestIfNotGranted = true}) async {
    try {
      // 1. Check if location services are enabled
      final serviceEnabled = await isServiceEnabled();
      if (!serviceEnabled) {
        return const LocationResult(
          state: LocationPermissionState.serviceDisabled,
          errorMessage: 'Location services are turned off.',
        );
      }

      // 2. Check permission
      var permission = await checkPermission();

      if (permission == LocationPermission.denied && requestIfNotGranted) {
        permission = await requestPermission();
      }

      if (permission == LocationPermission.denied) {
        return const LocationResult(
          state: LocationPermissionState.denied,
          errorMessage: 'Location permission is required to show nearby restaurants.',
        );
      }

      if (permission == LocationPermission.deniedForever) {
        return const LocationResult(
          state: LocationPermissionState.deniedForever,
          errorMessage: 'Location permission is permanently denied. Please enable in app settings.',
        );
      }

      // 3. Obtain current position
      Position? position;
      try {
        position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 8),
          ),
        );
      } catch (e) {
        debugPrint('getCurrentPosition timeout or failed, trying last known position: $e');
        position = await Geolocator.getLastKnownPosition();
      }

      if (position == null) {
        return const LocationResult(
          state: LocationPermissionState.error,
          errorMessage: 'Could not obtain GPS coordinates.',
        );
      }

      // 4. Perform reverse geocoding safely
      String? locality;
      String? city;
      String? state;
      String? address;

      try {
        final geocoding = Geocoding();
        final placemarks = await geocoding.placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        ).timeout(const Duration(seconds: 4));

        if (placemarks.isNotEmpty) {
          final place = placemarks.first;
          locality = place.subLocality?.isNotEmpty == true ? place.subLocality : place.locality;
          city = place.locality?.isNotEmpty == true ? place.locality : place.subAdministrativeArea;
          state = place.administrativeArea;
          address = '${place.street ?? ''}, ${place.subLocality ?? ''}'.trim();
        }
      } catch (e) {
        debugPrint('Reverse geocoding unavailable or timed out: $e');
      }

      final locModel = LocationModel(
        latitude: position.latitude,
        longitude: position.longitude,
        locality: locality,
        city: city,
        state: state,
        address: address,
      );

      _lastKnownLocation = locModel;

      return LocationResult(
        state: LocationPermissionState.granted,
        location: locModel,
      );
    } catch (e) {
      debugPrint('LocationService unexpected error: $e');
      return LocationResult(
        state: LocationPermissionState.error,
        errorMessage: 'An unexpected error occurred while detecting location.',
      );
    }
  }
}
