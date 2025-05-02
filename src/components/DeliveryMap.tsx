
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
  
  useEffect(() => {
    if (!mapContainerRef.current) return;

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

        map.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: philippinesCoordinates,
          zoom: initialZoom,
          projection: 'globe'
        });

        // Add navigation controls
        map.current.addControl(
          new mapboxgl.NavigationControl({
            visualizePitch: true,
          }),
          'top-right'
        );

        map.current.on('load', () => {
          setMapLoaded(true);
          
          // Add atmosphere and fog effects for a cyber look
          map.current?.setFog({
            'color': 'rgb(20, 25, 40)',
            'high-color': 'rgb(32, 40, 64)',
            'horizon-blend': 0.2
          });

          // Add markers for major Philippine cities
          addPhilippineMarkers();
        });
      } catch (err) {
        console.error("Map initialization error:", err);
        setMapError("Failed to load the map. Please try again later.");
      }
    }
    
    // Add markers for major cities in the Philippines
    function addPhilippineMarkers() {
      if (!map.current) return;
      
      const cities = [
        { name: "Manila", coordinates: [120.9842, 14.5995] as [number, number] },
        { name: "Cebu", coordinates: [123.8854, 10.3157] as [number, number] },
        { name: "Davao", coordinates: [125.6194, 7.0707] as [number, number] },
        { name: "Quezon City", coordinates: [121.0244, 14.6760] as [number, number] },
        { name: "Zamboanga", coordinates: [122.0790, 6.9214] as [number, number] }
      ];
      
      cities.forEach(city => {
        // Create a DOM element for the marker
        const markerEl = document.createElement('div');
        markerEl.className = 'flex flex-col items-center';
        
        // Pin element
        const pinEl = document.createElement('div');
        pinEl.className = 'text-cyber-neon';
        pinEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>`;
        
        // City name element
        const nameEl = document.createElement('div');
        nameEl.className = 'text-xs text-white font-medium bg-black/60 px-1.5 py-0.5 rounded-sm mt-1';
        nameEl.textContent = city.name;
        
        // Append to parent
        markerEl.appendChild(pinEl);
        markerEl.appendChild(nameEl);
        
        // Add marker to map
        new mapboxgl.Marker(markerEl)
          .setLngLat(city.coordinates)
          .addTo(map.current!);
      });
    }
    
    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, []);

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
