
import { useEffect, useRef, useState } from "react";
import { MapPin, Truck } from "lucide-react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';

export default function DeliveryMap() {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
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
        
        map.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-74.5, 40],
          zoom: 9,
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

          // Add a glowing effect to the map
          map.current?.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
        });
      } catch (err) {
        console.error("Map initialization error:", err);
        setMapError("Failed to load the map. Please try again later.");
      }
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
        <span className="text-sm font-medium">Route Optimization</span>
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
      
      {/* Map controls */}
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
