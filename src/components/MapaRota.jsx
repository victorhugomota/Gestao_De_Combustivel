import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import 'leaflet-routing-machine';

// Fix leaflet icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const RoutingControl = ({ waypoints = [] }) => {
  const map = useMap();

  useEffect(() => {
    if (!waypoints || waypoints.length < 2) return;

    const latLngWaypoints = waypoints.map(p => L.latLng(p.latitude, p.longitude));

    const routingControl = L.Routing.control({
      waypoints: latLngWaypoints,
      routeWhileDragging: false,
      addWaypoints: false,
      show: false, // Ocultar painel de instruções de texto
      createMarker: () => null, // Marcadores já renderizados pelo React
      lineOptions: {
        styles: [
          { color: '#059669', opacity: 0.8, weight: 6 },
          { color: '#10b981', opacity: 1, weight: 3 }
        ]
      }
    }).addTo(map);

    routingControl.on('routesfound', function(e) {
      const routes = e.routes;
      if (routes && routes.length > 0) {
        const bounds = L.latLngBounds(routes[0].coordinates);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    });

    return () => {
      try {
        map.removeControl(routingControl);
      } catch {
        // ignore unmount errors
      }
    };
  }, [map, waypoints]);

  return null;
};

export default function MapaRota({ circuito, rotaSelecionada, config }) {
  const defaultLat = config?.latCasa || -21.2687653;
  const defaultLng = config?.lngCasa || -47.8197413;
  const nomeCasa = config?.nomeCasa || 'Casa - Lar Grécia';
  const center = [defaultLat, defaultLng];

  // Determinar waypoints para traçar a rota
  let waypointsParaRota = [];
  if (circuito && circuito.waypointsCompletos && circuito.waypointsCompletos.length > 1) {
    waypointsParaRota = circuito.waypointsCompletos;
  } else if (rotaSelecionada) {
    waypointsParaRota = [
      { latitude: rotaSelecionada.origin.lat, longitude: rotaSelecionada.origin.lng, nome: nomeCasa },
      { latitude: rotaSelecionada.destination.lat, longitude: rotaSelecionada.destination.lng, nome: rotaSelecionada.nome }
    ];
  }

  const destinosUnicos = (circuito?.pontosOrdenados || []).filter(p => !p.isCasa);

  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm h-[320px] md:h-[400px] w-full z-0 relative bg-gray-100">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Marcador de Casa */}
        <Marker position={center}>
          <Popup>
            <div className="text-center font-sans p-1">
              <span className="font-bold text-emerald-700 block text-sm">🏠 {nomeCasa}</span>
              <span className="text-xs text-gray-500">Ponto inicial e de retorno</span>
            </div>
          </Popup>
        </Marker>

        {/* Marcadores dos Destinos Ordenados */}
        {destinosUnicos.map((ponto, i) => (
          <Marker key={ponto.id || i} position={[ponto.latitude, ponto.longitude]}>
            <Popup>
              <div className="text-center font-sans p-1">
                <span className="font-bold text-gray-900 block text-sm">📍 Parada {i + 1}: {ponto.nome}</span>
                <span className="text-xs text-emerald-600 block mt-0.5 font-medium">
                  {ponto.distanciaCasaCalculada ? ponto.distanciaCasaCalculada.toFixed(1) + ' km de casa' : ''}
                </span>
                <span className="text-[11px] text-gray-500 block truncate max-w-xs">{ponto.endereco}</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Rota traçada */}
        <RoutingControl waypoints={waypointsParaRota} />
      </MapContainer>

      {/* Badge Flutuante no Mapa com resumo da rota */}
      {circuito && circuito.distanciaTotalKm > 0 && (
        <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-gray-100 text-xs flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <div>
            <span className="font-bold text-gray-900 block">Circuito Completo (Ida e Volta)</span>
            <span className="text-gray-500 font-medium">
              {circuito.distanciaTotalKm.toFixed(1)} km total • {circuito.custoTotalDiarioRS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/dia
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
