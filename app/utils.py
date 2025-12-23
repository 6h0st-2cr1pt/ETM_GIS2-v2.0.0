"""
Utility functions for the ETM GIS application
"""
import requests
import time
from typing import Optional


def get_address_from_coordinates(latitude: float, longitude: float, retry_count: int = 3) -> Optional[str]:
    """
    Use OpenStreetMap's Nominatim reverse geocoding service to convert
    latitude and longitude coordinates to a human-readable address.
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        retry_count: Number of retry attempts if request fails
        
    Returns:
        Human-readable address string or None if geocoding fails
    """
    # Nominatim API endpoint
    url = "https://nominatim.openstreetmap.org/reverse"
    
    # Parameters for the API request
    params = {
        'lat': latitude,
        'lon': longitude,
        'format': 'json',
        'addressdetails': 1,
        'zoom': 18  # Higher zoom level for more detailed address
    }
    
    # Headers to identify the application (required by Nominatim usage policy)
    headers = {
        'User-Agent': 'ETM-GIS/2.0.0 (https://github.com/your-repo)'  # Update with your actual app name/URL
    }
    
    for attempt in range(retry_count):
        try:
            # Make the API request
            response = requests.get(url, params=params, headers=headers, timeout=10)
            
            # Check if request was successful
            if response.status_code == 200:
                data = response.json()
                
                # Extract address components
                if 'address' in data:
                    address_parts = []
                    address = data['address']
                    
                    # Build address from components (most specific to least specific)
                    if 'house_number' in address and 'road' in address:
                        address_parts.append(f"{address.get('house_number', '')} {address.get('road', '')}")
                    elif 'road' in address:
                        address_parts.append(address['road'])
                    
                    # Add suburb if available
                    if 'suburb' in address:
                        address_parts.append(address['suburb'])
                    
                    if 'village' in address:
                        address_parts.append(address['village'])
                    elif 'town' in address:
                        address_parts.append(address['town'])
                    elif 'city' in address:
                        address_parts.append(address['city'])
                    
                    if 'state' in address:
                        address_parts.append(address['state'])
                    elif 'region' in address:
                        address_parts.append(address['region'])
                    
                    if 'postcode' in address:
                        address_parts.append(address['postcode'])
                    
                    if 'country' in address:
                        address_parts.append(address['country'])
                    
                    # Join address parts with commas
                    if address_parts:
                        return ', '.join(address_parts)
                    elif 'display_name' in data:
                        # Fallback to display_name if address components aren't available
                        return data['display_name']
                    else:
                        return None
                elif 'display_name' in data:
                    # Fallback to display_name if address structure is different
                    return data['display_name']
                else:
                    return None
            elif response.status_code == 429:
                # Rate limit exceeded - wait and retry
                wait_time = (attempt + 1) * 2  # Exponential backoff
                time.sleep(wait_time)
                continue
            else:
                # Other HTTP errors
                print(f"Geocoding API returned status code {response.status_code}")
                return None
                
        except requests.exceptions.Timeout:
            print(f"Geocoding request timed out (attempt {attempt + 1}/{retry_count})")
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
            return None
        except requests.exceptions.RequestException as e:
            print(f"Error calling geocoding API: {str(e)}")
            if attempt < retry_count - 1:
                time.sleep(2)
                continue
            return None
        except Exception as e:
            print(f"Unexpected error during geocoding: {str(e)}")
            return None
        
        # Respect Nominatim's usage policy: max 1 request per second
        if attempt < retry_count - 1:
            time.sleep(1)
    
    return None


def geocode_location(location) -> bool:
    """
    Geocode a Location instance and update its address field.
    
    Args:
        location: Location model instance
        
    Returns:
        True if geocoding was successful, False otherwise
    """
    if not location.address:  # Only geocode if address is not already set
        address = get_address_from_coordinates(location.latitude, location.longitude)
        if address:
            location.address = address
            location.save(update_fields=['address'])
            return True
    return False

