class LocationModel {
  final double latitude;
  final double longitude;
  final String? address;
  final String? locality;
  final String? city;
  final String? state;

  const LocationModel({
    required this.latitude,
    required this.longitude,
    this.address,
    this.locality,
    this.city,
    this.state,
  });

  /// Readable display name for top bar
  String get displayName {
    if (locality != null && locality!.isNotEmpty && city != null && city!.isNotEmpty) {
      return '$locality, $city';
    } else if (city != null && state != null && city!.isNotEmpty && state!.isNotEmpty) {
      return '$city, $state';
    } else if (city != null && city!.isNotEmpty) {
      return city!;
    } else if (address != null && address!.isNotEmpty) {
      return address!;
    }
    return 'Lat: ${latitude.toStringAsFixed(3)}, Lng: ${longitude.toStringAsFixed(3)}';
  }

  @override
  String toString() => 'LocationModel(lat: $latitude, lng: $longitude, display: $displayName)';
}

enum LocationPermissionState {
  granted,
  denied,
  deniedForever,
  serviceDisabled,
  error,
}

class LocationResult {
  final LocationPermissionState state;
  final LocationModel? location;
  final String? errorMessage;

  const LocationResult({
    required this.state,
    this.location,
    this.errorMessage,
  });

  bool get isSuccess => state == LocationPermissionState.granted && location != null;
}
