import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix leafet icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RoutingControl = ({ rotaSelecionada }) => {
  const map = useMap();

  useEffect(() => {
    if (!rotaSelecionada) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(rotaSelecionada.origin.lat, rotaSelecionada.origin.lng),
        L.latLng(rotaSelecionada.destination.lat, rotaSelecionada.destination.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      show: false, // hide itinerary
      createMarker: () => null // we will add markers ourselves or let it do it if preferred. Let's return null to avoid duplicates if we render Marker manually.
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
      const routes = e.routes;
      const bounds = L.latLngBounds(routes[0].coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    });

    return () => map.removeControl(routingControl);
  }, [map, rotaSelecionada]);

  return null;
};

export default function MapaRota({ rotaSelecionada, config }) {
  const defaultLat = config?.latCasa || -21.1904;
  const defaultLng = config?.lngCasa || -47.7858;
  const center = [defaultLat, defaultLng];

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[250px] md:h-[350px] w-full z-0 relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={center} />
        {rotaSelecionada && (
          <Marker position={[rotaSelecionada.destination.lat, rotaSelecionada.destination.lng]} />
        )}
        <RoutingControl rotaSelecionada={rotaSelecionada} />
      </MapContainer>
    </div>
  );
}
