"""
Direct Logic Tests for Kumbhakaran Backend
"""

import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from main import (
    calculate_haversine_distance,
    get_nearby_salons,
    SALONS_DB
)

def test_haversine():
    # Distance between Koramangala (12.9344, 77.6258) and Indiranagar (12.9719, 77.6412) is ~4.4 km
    d = calculate_haversine_distance(12.9344, 77.6258, 12.9719, 77.6412)
    assert 4.0 <= d <= 5.0, f"Expected ~4.4km, got {d}"
    print(f"[OK] Haversine distance test passed: {d} km")

def test_nearby_discovery():
    results = get_nearby_salons(latitude=12.9344, longitude=77.6258, radius=5.0)
    assert len(results) >= 1, "Expected at least 1 salon nearby"
    print(f"[OK] Nearby salon discovery passed: found {len(results)} salons within 5km")
    for s in results:
        print(f"  - {s.name}: {s.distance_km} km away, queue: {s.current_queue}")

if __name__ == "__main__":
    test_haversine()
    test_nearby_discovery()
    print("All backend tests verified successfully!")
