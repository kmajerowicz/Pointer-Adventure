const EARTH_RADIUS_KM = 6371

/**
 * Calculate the great-circle distance between two points on Earth.
 * @param lat1 - Latitude of first point (degrees)
 * @param lon1 - Longitude of first point (degrees)
 * @param lat2 - Latitude of second point (degrees)
 * @param lon2 - Longitude of second point (degrees)
 * @returns Distance in kilometers
 */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}
