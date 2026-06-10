package service

import (
	"math"
)

// CalculateDistance returns the distance between two coordinates in meters using the Haversine formula
func CalculateDistance(lat1, lon1, lat2, lon2 float64) float64 {
	const earthRadius = 6371000.0 // meters
	
	lat1Rad := lat1 * math.Pi / 180
	lat2Rad := lat2 * math.Pi / 180
	deltaLat := (lat2 - lat1) * math.Pi / 180
	deltaLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(deltaLat/2)*math.Sin(deltaLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*
			math.Sin(deltaLon/2)*math.Sin(deltaLon/2)
	
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return earthRadius * c
}

// IsWithinRadius checks if the user's distance is within the branch's radius
func IsWithinRadius(userLat, userLon, branchLat, branchLon float64, radiusMeters int) (bool, float64) {
	distance := CalculateDistance(userLat, userLon, branchLat, branchLon)
	return distance <= float64(radiusMeters), distance
}
