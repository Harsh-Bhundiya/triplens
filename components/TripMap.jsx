"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TripMap = ({ places = [] }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;
  const [selectedDay, setSelectedDay] = useState("all");
  const [routeStats, setRouteStats] = useState(null); // Distance aur Time ke liye state

  const availableDays = Array.from(new Set(places.map((p) => p.day || 1))).sort((a, b) => a - b);
  const filteredPlaces =
    selectedDay === "all" ? places : places.filter((p) => (p.day || 1) === Number(selectedDay));

  useEffect(() => {
    if (!mapRef.current) return;
    let isMounted=true;

    // 1. Initialize Map
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    }).setView([15.49, 73.82], 12);

    mapInstanceRef.current = map;

    // 2. Dark Matter Tiles
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`, {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: "© OpenStreetMap contributors © CARTO",
    }).addTo(map);

    const validCoordinates = [];

    // 3. Glowing Radar Pins add karo
    filteredPlaces.forEach((place, index) => {
      const lat = place.location?.latitude || place.latitude;
      const lon = place.location?.longitude || place.longitude;

      if (lat && lon) {
        validCoordinates.push({ lat, lon, place, index });

        const customIcon = L.divIcon({
          className: "custom-pulse-pin",
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
              <div class="pin-radar-ring"></div>
              <div style="
                background: linear-gradient(135deg, #38bdf8, #6366f1);
                color: #ffffff;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 800;
                font-size: 13px;
                font-family: system-ui, sans-serif;
                border: 2px solid #ffffff;
                box-shadow: 0 0 15px rgba(56, 189, 248, 0.8), 0 4px 6px rgba(0,0,0,0.5);
                position: relative;
                z-index: 2;
                cursor: pointer;
              ">
                ${index + 1}
              </div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -20],
        });

        const popupContent = `
          <div style="
            background: #18181b; 
            color: #f4f4f5; 
            padding: 10px 14px; 
            border-radius: 12px; 
            border: 1px solid #3f3f46;
            font-family: system-ui, sans-serif;
            min-width: 170px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.6);
          ">
            <span style="font-size: 11px; font-weight: 700; color: #38bdf8; text-transform: uppercase;">
              Stop #${index + 1} • Day ${place.day || 1}
            </span>
            <div style="font-size: 14px; font-weight: 700; margin-top: 4px; color: #fff;">
              ${place.placename || place.name || "Place"}
            </div>
          </div>
        `;

        L.marker([lat, lon], { icon: customIcon }).addTo(map).bindPopup(popupContent);
      }
    });

    // 4. 🛣️ REAL ROAD ROUTING VIA OSRM API
    if (validCoordinates.length > 1) {
      // OSRM format: lon,lat;lon,lat;...
      const waypoints = validCoordinates.map((c) => `${c.lon},${c.lat}`).join(";");
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${waypoints}?overview=full&geometries=geojson`;

      fetch(osrmUrl)
        .then((res) => res.json())
        .then((data) => {
          if(!isMounted) return;
          if (data.code === "Ok" && data.routes?.[0]) {
            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1);
            const durationMins = Math.round(route.duration / 60);

            // Update stats badge
            setRouteStats({ distanceKm, durationMins });

            // GeoJSON coordinates ko Leaflet ke format [lat, lon] me convert karo
            const roadPoints = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);

            // Draw Real Road Following Polyline
            const polyline = L.polyline(roadPoints, {
              color: "#38bdf8",
              weight: 5,
              opacity: 0.9,
              dashArray: "10, 14",
              className: "flowing-route-line",
            }).addTo(map);

            // 🖱️ Hover Tooltip on Road
            polyline.bindTooltip(
              `🚗 <strong>Real Driving Route</strong>: ${distanceKm} km (~${durationMins} mins)`,
              {
                sticky: true,
                className: "road-hover-tooltip",
              }
            );

            map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
          } else {
            // Fallback: Agar road na mile toh straight line
            fallbackStraightLine(map, validCoordinates);
          }
        })
        .catch(() => {
          if(!isMounted) return;
          fallbackStraightLine(map, validCoordinates);
        });
    } else if (validCoordinates.length === 1) {
      map.setView([validCoordinates[0].lat, validCoordinates[0].lon], 13);
      setRouteStats(null);
    } else {
      setRouteStats(null);
    }

    return () => {
      isMounted=false;
      map.remove();

    };
  }, [filteredPlaces, selectedDay]);

  // Fallback straight line drawer
   // Fallback straight line drawer
  const fallbackStraightLine = (map, validCoordinates) => {
    if (!validCoordinates || validCoordinates.length < 2) return;
    
    const points = validCoordinates.map((c) => [c.lat, c.lon]);
    const polyline = L.polyline(points, {
      color: "#38bdf8",
      weight: 4,
      dashArray: "8, 10",
      className: "flowing-route-line",
    }).addTo(map);

    // ✅ Safe Bounds Check (No more 'min' error!)
    const bounds = polyline.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  const handleFlyTo = (place) => {
    const lat = place.location?.latitude || place.latitude;
    const lon = place.location?.longitude || place.longitude;
    if (lat && lon && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lon], 14, { duration: 1.5 });
    }
  };

  return (
    <div style={{ marginTop: "24px", marginBottom: "24px" }}>
      {/* 🔮 Styles for Radar Pulse, Flowing Road, and Glassmorphic Tooltip */}
      <style>{`
        @keyframes dashMove {
          to {
            stroke-dashoffset: -48;
          }
        }
        .flowing-route-line {
          animation: dashMove 1.8s linear infinite;
          cursor: pointer;
        }
        @keyframes radarPulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        .pin-radar-ring {
          position: absolute;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(56, 189, 248, 0.4);
          box-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
          animation: radarPulse 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
          z-index: 1;
        }
        .road-hover-tooltip {
          background: #18181b !important;
          color: #f4f4f5 !important;
          border: 1px solid #38bdf8 !important;
          border-radius: 8px !important;
          font-family: system-ui, sans-serif !important;
          padding: 6px 10px !important;
          box-shadow: 0 8px 20px rgba(0,0,0,0.7) !important;
        }
        .road-hover-tooltip::before {
          border-top-color: #38bdf8 !important;
        }
        .leaflet-popup-tip { background: #18181b !important; }
        .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
      `}</style>

      {/* Header + Day Filter Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#f3f4f6", margin: 0 }}>
            🗺️ Live Route ({filteredPlaces.length} Stops)
          </h3>

          {/* 🚗 Live Distance & Time Floating Pill */}
          {routeStats && (
            <span
              style={{
                background: "rgba(56, 189, 248, 0.15)",
                border: "1px solid rgba(56, 189, 248, 0.4)",
                color: "#38bdf8",
                fontSize: "12px",
                fontWeight: "700",
                padding: "4px 10px",
                borderRadius: "14px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              🚗 {routeStats.distanceKm} km • ~{routeStats.durationMins} mins
            </span>
          )}
        </div>

        {/* Day Filter Chips */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setSelectedDay("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: "600",
              cursor: "pointer",
              border: "1px solid",
              borderColor: selectedDay === "all" ? "#38bdf8" : "#374151",
              backgroundColor: selectedDay === "all" ? "#0284c7" : "#1f2937",
              color: selectedDay === "all" ? "#fff" : "#9ca3af",
            }}
          >
            All Days
          </button>
          {availableDays.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDay(d)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                border: "1px solid",
                borderColor: selectedDay === d ? "#38bdf8" : "#374151",
                backgroundColor: selectedDay === d ? "#0284c7" : "#1f2937",
                color: selectedDay === d ? "#fff" : "#9ca3af",
              }}
            >
              Day {d}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        style={{
          width: "100%",
          height: "440px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #27272a",
          boxShadow: "0 12px 35px -8px rgba(0, 0, 0, 0.8)",
          zIndex: 1,
        }}
      />

      {/* 🏎️ Stops Quick Navigation Bar */}
      {filteredPlaces.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "10px",
            overflowX: "auto",
            paddingTop: "12px",
            paddingBottom: "6px",
          }}
        >
          {filteredPlaces.map((place, idx) => (
            <button
              key={place._id || idx}
              onClick={() => handleFlyTo(place)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 14px",
                background: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "10px",
                color: "#e4e4e7",
                fontSize: "13px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#38bdf8";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#27272a";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span
                style={{
                  background: "#0284c7",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  fontWeight: "bold",
                }}
              >
                {idx + 1}
              </span>
              <span>{place.placename || place.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripMap;