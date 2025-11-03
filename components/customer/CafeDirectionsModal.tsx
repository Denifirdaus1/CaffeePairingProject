import React, { useEffect, useRef, useState } from 'react';
import { initGoogleMapsLoader } from '../../services/googleMapsService';

interface CafeDirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cafeName: string;
  userLocation: { lat: number; lng: number };
  cafeLocation: { lat: number; lng: number };
  cafeAddress?: string;
}

export const CafeDirectionsModal: React.FC<CafeDirectionsModalProps> = ({
  isOpen,
  onClose,
  cafeName,
  userLocation,
  cafeLocation,
  cafeAddress,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initialize Google Maps API
        await initGoogleMapsLoader();

        // Create map instance
        const map = new google.maps.Map(mapRef.current!, {
          center: userLocation,
          zoom: 13,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        });

        mapInstanceRef.current = map;

        // Initialize directions service and renderer
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#D4A574', // brand-accent color
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        });

        // Calculate and display route
        await calculateRoute();

        setLoading(false);
      } catch (err: any) {
        console.error('Error initializing directions:', err);
        setError(err.message || 'Failed to load directions');
        setLoading(false);
      }
    };

    initializeMap();
  }, [isOpen, userLocation, cafeLocation]);

  const calculateRoute = async () => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) {
      throw new Error('Directions service not initialized');
    }

    return new Promise<void>((resolve, reject) => {
      directionsServiceRef.current!.route(
        {
          origin: userLocation,
          destination: cafeLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRendererRef.current!.setDirections(result);

            // Extract route info
            const route = result.routes[0];
            if (route && route.legs.length > 0) {
              const leg = route.legs[0];
              setRouteInfo({
                distance: leg.distance?.text || 'N/A',
                duration: leg.duration?.text || 'N/A',
              });
            }

            resolve();
          } else {
            reject(new Error(`Directions request failed: ${status}`));
          }
        }
      );
    });
  };

  const handleOpenInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${cafeLocation.lat},${cafeLocation.lng}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-brand-surface rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
              Directions to {cafeName}
            </h2>
            {cafeAddress && (
              <p className="text-brand-text-muted text-sm">{cafeAddress}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="px-6 py-4 bg-brand-accent/10 border-b border-white/10">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-brand-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                <span className="text-white font-semibold">
                  {routeInfo.distance}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-brand-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-white font-semibold">
                  {routeInfo.duration}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Map Container */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-surface/90">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-accent mx-auto mb-4"></div>
                <p className="text-brand-text">Loading directions...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-brand-surface/90">
              <div className="text-center px-6">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-2">Failed to load directions</p>
                <p className="text-brand-text-muted text-sm">{error}</p>
              </div>
            </div>
          )}

          <div ref={mapRef} className="w-full h-[500px]" />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors font-medium"
          >
            Close
          </button>
          <button
            onClick={handleOpenInGoogleMaps}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-accent hover:bg-brand-accent/90 text-brand-bg rounded-xl transition-colors font-semibold"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
            Open in Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

