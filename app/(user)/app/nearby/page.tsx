"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { WarmCard } from "@/components/warm-card";
import { WarmButton } from "@/components/warm-button";
import { DistanceBadge } from "@/components/distance-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Navigation,
  Loader2,
  Store,
  Ticket,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface NearbyMerchant {
  id: string;
  name: string;
  slug: string;
  brandLogoUrl: string | null;
  city: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  distance: number;
  activeVoucherCount: number;
}

/** Keys under account.nearby.errors; the message is translated when rendered. */
type NearbyError =
  | "fetchFailed"
  | "geolocationUnsupported"
  | "permissionDenied"
  | "positionUnavailable"
  | "timeout"
  | "locationFailed"
  | "ipLocationFailed";

/** Coordinates from the browser, or the approximate IP-based location from the API. */
type LocationLabel = { kind: "coords"; text: string } | { kind: "approximate" } | null;

export default function NearbyPage() {
  const t = useTranslations("account");
  const [merchants, setMerchants] = useState<NearbyMerchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<NearbyError | null>(null);
  const [radius, setRadius] = useState(10);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLon, setUserLon] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<LocationLabel>(null);
  const [mapBounds, setMapBounds] = useState<{
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null>(null);

  const fetchNearby = useCallback(
    async (lat: number, lon: number, r: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/nearby?lat=${lat}&lon=${lon}&radius=${r}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMerchants(data.merchants || []);

        // Calculate map bounds
        const allPoints = [
          { latitude: lat, longitude: lon },
          ...(data.merchants || []),
        ];
        if (allPoints.length > 0) {
          const lats = allPoints.map(
            (p: { latitude: number }) => p.latitude
          );
          const lons = allPoints.map(
            (p: { longitude: number }) => p.longitude
          );
          const padding = 0.01;
          setMapBounds({
            minLat: Math.min(...lats) - padding,
            maxLat: Math.max(...lats) + padding,
            minLon: Math.min(...lons) - padding,
            maxLon: Math.max(...lons) + padding,
          });
        }
      } catch {
        setError("fetchFailed");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("geolocationUnsupported");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setUserLat(lat);
        setUserLon(lon);
        setLocationLabel({ kind: "coords", text: `${lat.toFixed(4)}, ${lon.toFixed(4)}` });
        fetchNearby(lat, lon, radius);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("permissionDenied");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("positionUnavailable");
            break;
          case err.TIMEOUT:
            setError("timeout");
            break;
          default:
            setError("locationFailed");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [fetchNearby, radius]);

  // Auto-load with IP fallback on mount
  useEffect(() => {
    if (!userLat && !userLon) {
      setLoading(true);
      fetch(`/api/nearby?radius=${radius}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.meta) {
            setUserLat(data.meta.lat);
            setUserLon(data.meta.lon);
            setLocationLabel({ kind: "approximate" });
          }
          setMerchants(data.merchants || []);

          // Calculate map bounds
          const allPoints = [
            { latitude: data.meta?.lat, longitude: data.meta?.lon },
            ...(data.merchants || []),
          ];
          const lats = allPoints
            .map((p: { latitude: number }) => p.latitude)
            .filter(Boolean);
          const lons = allPoints
            .map((p: { longitude: number }) => p.longitude)
            .filter(Boolean);
          if (lats.length > 0) {
            setMapBounds({
              minLat: Math.min(...lats) - 0.01,
              maxLat: Math.max(...lats) + 0.01,
              minLon: Math.min(...lons) - 0.01,
              maxLon: Math.max(...lons) + 0.01,
            });
          }
        })
        .catch(() => {
          setError("ipLocationFailed");
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    if (userLat !== null && userLon !== null) {
      fetchNearby(userLat, userLon, newRadius);
    }
  };

  // Convert lat/lon to percentage position on the map div
  const toMapPosition = (lat: number, lon: number) => {
    if (!mapBounds) return { left: "50%", top: "50%" };
    const latRange = mapBounds.maxLat - mapBounds.minLat || 1;
    const lonRange = mapBounds.maxLon - mapBounds.minLon || 1;
    const x = ((lon - mapBounds.minLon) / lonRange) * 100;
    const y = ((mapBounds.maxLat - lat) / latRange) * 100; // Invert Y
    return {
      left: `${Math.min(Math.max(x, 5), 95)}%`,
      top: `${Math.min(Math.max(y, 5), 95)}%`,
    };
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">
          {t("nearby.title")}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          {t("nearby.subtitle")}
        </p>
      </div>

      {/* Location controls */}
      <WarmCard padding="lg">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <WarmButton
              onClick={handleUseMyLocation}
              variant="primary"
              isLoading={loading}
              className="flex-shrink-0"
            >
              <Navigation className="h-4 w-4 mr-2" />
              {t("nearby.useMyLocation")}
            </WarmButton>

            {locationLabel && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>
                  {locationLabel.kind === "approximate"
                    ? t("nearby.approximateLocation")
                    : locationLabel.text}
                </span>
              </div>
            )}
          </div>

          {/* Radius slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">{t("nearby.searchRadius")}</Label>
              <span className="text-sm font-semibold text-[var(--primary)]">
                {radius} km
              </span>
            </div>
            <Input
              type="range"
              min={1}
              max={50}
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="h-2 cursor-pointer accent-[var(--primary)]"
            />
            <div className="flex justify-between text-xs text-[var(--text-faint)]">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
      </WarmCard>

      {/* Error state */}
      {error && (
        <WarmCard padding="md" className="border-[var(--danger)]/30 bg-[var(--danger)]/5">
          <div className="flex items-center gap-3 text-[var(--danger)]">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">{t(`nearby.errors.${error}`)}</p>
          </div>
        </WarmCard>
      )}

      {/* Map placeholder */}
      {merchants.length > 0 && mapBounds && (
        <WarmCard padding="none" className="overflow-hidden">
          <div className="relative w-full h-64 bg-[var(--surface-dim)] border-b border-[var(--border)]">
            {/* Grid lines */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute left-1/4 top-0 bottom-0 w-px bg-[var(--text)]" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--text)]" />
              <div className="absolute left-3/4 top-0 bottom-0 w-px bg-[var(--text)]" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-[var(--text)]" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-[var(--text)]" />
            </div>

            {/* User pin */}
            {userLat !== null && userLon !== null && (
              <div
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={toMapPosition(userLat, userLon)}
                title={t("nearby.yourLocation")}
              >
                <div className="relative">
                  <div className="absolute inset-0 h-5 w-5 rounded-full bg-[var(--primary)] animate-ping opacity-30" />
                  <div className="relative h-5 w-5 rounded-full bg-[var(--primary)] border-2 border-white shadow-md" />
                </div>
              </div>
            )}

            {/* Merchant pins */}
            {merchants.map((m, i) => {
              const pos = toMapPosition(m.latitude, m.longitude);
              const colors = [
                "bg-[#E17B5C]",
                "bg-[#9DB5A5]",
                "bg-[#DEB887]",
                "bg-[#6B5744]",
                "bg-[#8B7355]",
              ];
              return (
                <div
                  key={m.id}
                  className="absolute z-20 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  style={pos}
                  title={`${m.name} — ${m.distance} km`}
                >
                  <div
                    className={`h-4 w-4 rounded-full ${colors[i % colors.length]} border-2 border-white shadow-md transition-transform group-hover:scale-150`}
                  />
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-sm)] px-2 py-1 text-xs shadow-md z-30">
                    {m.name} ({m.distance} km)
                  </div>
                </div>
              );
            })}

            {/* Map label */}
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-[var(--surface)]/80 backdrop-blur-sm rounded-[var(--r-sm)] text-xs text-[var(--text-faint)]">
              {t("nearby.mapLabel", { count: merchants.length, radius })}
            </div>
          </div>
        </WarmCard>
      )}

      {/* Loading state */}
      {loading && !merchants.length && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
        </div>
      )}

      {/* Results */}
      {merchants.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--text)]">
            {t("nearby.merchantsNearby", { count: merchants.length })}
          </h2>

          {merchants.map((merchant) => (
            <Link
              key={merchant.id}
              href={`/m/${merchant.slug}`}
              className="block"
            >
              <WarmCard hover padding="lg">
                <div className="flex items-start gap-4">
                  {/* Logo */}
                  <div className="flex-shrink-0 h-14 w-14 rounded-[var(--r-md)] bg-[var(--surface-dim)] flex items-center justify-center overflow-hidden border border-[var(--border)]">
                    {merchant.brandLogoUrl ? (
                      <Image
                        src={merchant.brandLogoUrl}
                        alt={merchant.name}
                        width={56}
                        height={56}
                        className="h-full w-full object-contain p-1"
                        unoptimized
                      />
                    ) : (
                      <Store className="h-6 w-6 text-[var(--text-faint)]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-[var(--text)] truncate">
                        {merchant.name}
                      </h3>
                      <DistanceBadge distanceKm={merchant.distance} />
                    </div>

                    {(merchant.city || merchant.address) && (
                      <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">
                        {[merchant.address, merchant.city]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--text-faint)]">
                      <Ticket className="h-3.5 w-3.5" />
                      <span>
                        {t("nearby.activeVouchers", { count: merchant.activeVoucherCount })}
                      </span>
                    </div>
                  </div>
                </div>
              </WarmCard>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && merchants.length === 0 && userLat !== null && (
        <WarmCard padding="lg">
          <div className="py-10 text-center">
            <MapPin className="h-12 w-12 mx-auto text-[var(--text-faint)] mb-4" />
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
              {t("nearby.emptyTitle")}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              {t("nearby.emptyBody")}
            </p>
            <WarmButton
              onClick={() => handleRadiusChange(Math.min(radius + 10, 50))}
              variant="outline"
            >
              {t("nearby.expandRadius", { radius: Math.min(radius + 10, 50) })}
            </WarmButton>
          </div>
        </WarmCard>
      )}
    </div>
  );
}
