import { useEffect, useRef, useState } from "react";
import { MapPin, Truck } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { useShipmentData } from '@/hooks/useShipmentData';

export default function DeliveryMap() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { shipments } = useShipmentData();
  const markersRef = useRef<mapboxgl.Marker[]>([]); // To keep track of markers

  useEffect(() => {
    if (!mapContainerRef.current) return;
    let mapInstance: mapboxgl.Map | null = null; // Use a local variable for the instance

    async function initializeMap() {
      try {
        // Get the Mapbox token from Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('map-token', {
          method: 'GET'
        });
        
        if (error || !data?.token) {
          throw new Error("Could not retrieve map token");
        }
        
        mapboxgl.accessToken = data.token;
        
        // Philippines coordinates (centered approximately on the Philippines archipelago)
        const philippinesCoordinates: [number, number] = [121.774, 12.879]; // longitude, latitude
        const initialZoom = 5.5; // Adjusted zoom level to show the Philippines

        mapInstance = new mapboxgl.Map({
          container: mapContainerRef.current!, // Assert non-null as we checked
          style: 'mapbox://styles/mapbox/dark-v11',
          center: philippinesCoordinates,
          zoom: initialZoom,
          projection: 'globe'
        });
        map.current = mapInstance; // Assign to ref after creation

        // Add navigation controls
        mapInstance.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        mapInstance.on('load', () => {
          setMapLoaded(true);
          
          // Add atmosphere and fog effects for a cyber look
          mapInstance?.setFog({
            'color': 'rgb(20, 25, 40)',
            'high-color': 'rgb(32, 40, 64)',
            'horizon-blend': 0.2
          });

          // The call to addPhilippineMarkers is removed from here.
          // Markers will be handled by a separate useEffect.
        });

        mapInstance.on('error', (e) => {
          console.error("Mapbox GL error:", e.error);
          setMapError(`Map error: ${e.error?.message || 'Unknown map error'}`);
        });

      } catch (err) {
        console.error("Map initialization error:", err);
        setMapError("Failed to load the map. Please try again later.");
      }
    }
    
    initializeMap();

    return () => {
      // Clear markers managed by markersRef
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Remove map instance
      if (mapInstance) {
        mapInstance.remove();
      }
      map.current = null;
      setMapLoaded(false); // Reset map loaded state
    };
  }, []); // This useEffect runs once on mount

  useEffect(() => {
    if (!mapLoaded || !map.current || !shipments) {
      // If map is not loaded, or no map instance, or no shipments data, clear existing markers and do nothing.
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    async function updateShipmentLocationMarkers() { // Renamed function
      if (!map.current) return;

      // Clear existing markers before adding new ones
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      // Process Origins
      const uniqueOrigins = Array.from(new Set(shipments.map(s => s.origin).filter(Boolean)));

      if (uniqueOrigins.length === 0) {
        console.log("No unique origins found in shipments to display on map.");
        // Continue to check for destinations even if no origins
      }

      for (const cityName of uniqueOrigins) {
        try {
          if (!mapboxgl.accessToken) {
            console.error("Mapbox access token is not set. Cannot geocode.");
            setMapError("Mapbox token missing, cannot fetch city locations.");
            return; 
          }

          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?country=PH&access_token=${mapboxgl.accessToken}&limit=1`;
          const response = await fetch(geocodeUrl);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Geocoding API request failed for "${cityName}" with status: ${response.status}. Response: ${errorText}`);
            continue; 
          }

          const geoData = await response.json();

          if (geoData.features && geoData.features.length > 0) {
            const coordinates = geoData.features[0].center as [number, number];
            
            const markerEl = document.createElement('div');
            markerEl.className = 'flex flex-col items-center';
            
            const pinEl = document.createElement('div');
            pinEl.className = 'text-cyber-neon'; // Style for origin
            pinEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
            
            const nameEl = document.createElement('div');
            nameEl.className = 'text-xs text-white font-medium bg-black/60 px-1.5 py-0.5 rounded-sm mt-1';
            nameEl.textContent = cityName;
            
            markerEl.appendChild(pinEl);
            markerEl.appendChild(nameEl);
            
            const newMarker = new mapboxgl.Marker(markerEl)
              .setLngLat(coordinates)
              .addTo(map.current!);
            markersRef.current.push(newMarker);
          } else {
            console.warn(`Geocoding for origin city "${cityName}" returned no features.`);
          }
        } catch (error) {
          console.error(`Error processing origin city "${cityName}" for marker:`, error);
        }
      }

      // Process Destinations
      const uniqueDestinations = Array.from(new Set(shipments.map(s => s.destination).filter(Boolean)));

      if (uniqueDestinations.length === 0) {
        console.log("No unique destinations found in shipments to display on map.");
      }

      for (const cityName of uniqueDestinations) {
        try {
          if (!mapboxgl.accessToken) {
            console.error("Mapbox access token is not set. Cannot geocode.");
            // setMapError already handled if token was missing for origins
            return; 
          }

          const geocodeUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(cityName)}.json?country=PH&access_token=${mapboxgl.accessToken}&limit=1`;
          const response = await fetch(geocodeUrl);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Geocoding API request failed for destination "${cityName}" with status: ${response.status}. Response: ${errorText}`);
            continue; 
          }

          const geoData = await response.json();

          if (geoData.features && geoData.features.length > 0) {
            const coordinates = geoData.features[0].center as [number, number];
            
            const markerEl = document.createElement('div');
            markerEl.className = 'flex flex-col items-center';
            
            const pinEl = document.createElement('div');
            // Apply red color for destination markers
            // Using Tailwind class, ensure 'text-red-500' is available or use inline style
            pinEl.className = 'text-red-500'; // Or use pinEl.style.color = 'red';
            pinEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
            
            const nameEl = document.createElement('div');
            nameEl.className = 'text-xs text-white font-medium bg-black/60 px-1.5 py-0.5 rounded-sm mt-1';
            nameEl.textContent = cityName;
            
            markerEl.appendChild(pinEl);
            markerEl.appendChild(nameEl);
            
            const newMarker = new mapboxgl.Marker(markerEl)
              .setLngLat(coordinates)
              .addTo(map.current!);
            markersRef.current.push(newMarker);
          } else {
            console.warn(`Geocoding for destination city "${cityName}" returned no features.`);
          }
        } catch (error) {
          console.error(`Error processing destination city "${cityName}" for marker:`, error);
        }
      }
    }
    
    updateShipmentLocationMarkers(); // Updated function call

  }, [mapLoaded, shipments, map]); // Re-run when map is loaded, shipments change, or map instance changes

  if (mapError) {
    return (
      <div className="cyber-card relative overflow-hidden p-6" style={{ height: '400px' }}>
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-sm text-red-400">{mapError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cyber-card relative overflow-hidden" style={{ height: '400px' }}>
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
        <Truck className="h-4 w-4 text-cyber-neon" />
        <span className="text-sm font-medium">Philippines Route Optimization</span>
      </div>
      
      <div 
        ref={mapContainerRef} 
        className="absolute inset-0"
      >
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/50">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-2 border-cyber-neon border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-gray-400">Loading map data...</p>
            </div>
          </div>
        )}
      </div>
      
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button className="w-8 h-8 bg-black/60 border border-gray-700 rounded-md flex items-center justify-center text-white hover:border-cyber-neon">
          +
        </button>
        <button className="w-8 h-8 bg-black/60 border border-gray-700 rounded-md flex items-center justify-center text-white hover:border-cyber-neon">
          −
        </button>
      </div>
    </div>
  );
}
