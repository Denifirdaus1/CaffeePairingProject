interface Window {
  google: typeof google;
}

declare namespace google.maps {
  class Map {
    constructor(mapDiv: Element | null, opts?: MapOptions);
    setCenter(latlng: LatLng | LatLngLiteral): void;
    setZoom(zoom: number): void;
  }

  class Marker {
    constructor(opts?: MarkerOptions);
    setPosition(position: LatLng | LatLngLiteral): void;
    setTitle(title: string): void;
    setMap(map: Map | null): void;
    getPosition(): LatLng | null;
    addListener(eventName: string, handler: Function): void;
  }

  class places {
    class Autocomplete {
      constructor(
        inputField: HTMLInputElement,
        opts?: {
          types?: string[];
          fields?: string[];
        }
      );
      addListener(eventName: string, handler: Function): void;
      getPlace(): PlaceResult;
    }
  }

  class Geocoder {
    geocode(
      request: GeocoderRequest,
      callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
    ): void;
  }

  interface MapOptions {
    center?: LatLng | LatLngLiteral;
    zoom?: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
    fullscreenControl?: boolean;
  }

  interface MarkerOptions {
    map?: Map;
    draggable?: boolean;
    position?: LatLng | LatLngLiteral;
    title?: string;
  }

  interface LatLng {
    lat(): number;
    lng(): number;
  }

  interface LatLngLiteral {
    lat: number;
    lng: number;
  }

  interface PlaceResult {
    formatted_address?: string;
    geometry?: PlaceGeometry;
    address_components?: AddressComponent[];
    name?: string;
  }

  interface PlaceGeometry {
    location?: LatLng;
  }

  interface AddressComponent {
    long_name: string;
    types: string[];
  }

  interface GeocoderRequest {
    location?: LatLng | LatLngLiteral;
  }

  interface GeocoderResult extends PlaceResult {}

  type GeocoderStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';

  namespace event {
    function clearInstanceListeners(instance: object): void;
  }

  namespace places {
    type Autocomplete = places.Autocomplete;
  }
}

declare const google: typeof google;
