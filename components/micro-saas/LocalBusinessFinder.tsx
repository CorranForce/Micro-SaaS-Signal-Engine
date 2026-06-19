"use client";

import { useState } from "react";
import { NICHE_TO_OSM } from "@/lib/constants";

const haversine = (la1: number, ln1: number, la2: number, ln2: number) => {
  if (!la2 || !ln2) return 999;
  const R = 3958.8; // Earth radius in miles
  const dL = (la2 - la1) * Math.PI / 180, dN = (ln2 - ln1) * Math.PI / 180;
  const a = Math.sin(dL / 2) ** 2 + Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) * Math.sin(dN / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
};

export const LocalBusinessFinder = ({ niche }: { niche: string }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [radius, setRadius] = useState(5);
  const [locationName, setLocationName] = useState("");
  const [searched, setSearched] = useState(false);
  const [outreachList, setOutreachList] = useState<Set<string>>(new Set());
  const [copiedAll, setCopiedAll] = useState(false);
  const [open, setOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  const osmEntry = NICHE_TO_OSM[niche] || null;

  const gmapsUrl = osmEntry?.gmaps
    ? `https://www.google.com/maps/search/${osmEntry.gmaps}${userCoords ? `/@${userCoords.lat},${userCoords.lng},13z` : ""}`
    : `https://www.google.com/maps/search/${encodeURIComponent(niche)}${userCoords ? `/@${userCoords.lat},${userCoords.lng},13z` : ""}`;

  const search = async () => {
    setLoading(true); setError(""); setResults([]); setSearched(true);
    try {
      const coords = await new Promise<{lat: number, lng: number}>((res, rej) => {
        if (!navigator.geolocation) rej(new Error("Geolocation not supported by this browser."));
        navigator.geolocation.getCurrentPosition(
          p => res({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => rej(new Error("Location access denied — please allow location in your browser and retry."))
        );
      });
      setUserCoords({ lat: coords.lat, lng: coords.lng });
      try {
        const gr = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json`, { headers: { "Accept-Language": "en" } });
        const gd = await gr.json();
        const a = gd.address || {};
        setLocationName(a.city || a.town || a.county || a.state || "your area");
      } catch { setLocationName("your area"); }
      const radiusMeters = Math.round(radius * 1609.34);
      let query = "";
      
      if (osmEntry?.tags) {
        const tagParts = osmEntry.tags.map(([k, v]: [string, string]) =>
          `node["${k}"="${v}"](around:${radiusMeters},${coords.lat},${coords.lng});\n  way["${k}"="${v}"](around:${radiusMeters},${coords.lat},${coords.lng});`
        ).join("\n  ");
        query = `[out:json][timeout:25];\n(\n  ${tagParts}\n);\nout body center;`;
      } else {
        const safeKeyword = niche.replace(/["\\]/g, "");
        query = `[out:json][timeout:25];
(
  nwr["shop"~"${safeKeyword}", i](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["office"~"${safeKeyword}", i](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["craft"~"${safeKeyword}", i](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["amenity"~"${safeKeyword}", i](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["name"~"${safeKeyword}", i]["shop"](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["name"~"${safeKeyword}", i]["office"](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["name"~"${safeKeyword}", i]["craft"](around:${radiusMeters},${coords.lat},${coords.lng});
  nwr["name"~"${safeKeyword}", i]["amenity"](around:${radiusMeters},${coords.lat},${coords.lng});
);
out body center;`;
      }
      
      const ov = await fetch("https://overpass-api.de/api/interpreter", { method: "POST", body: query });
      if (!ov.ok) throw new Error(`Overpass API error ${ov.status} — try again shortly.`);
      const od = await ov.json();
      const biz = (od.elements || []).filter((e: any) => e.tags?.name).map((e: any) => {
        const eLat = e.lat ?? e.center?.lat, eLng = e.lon ?? e.center?.lon;
        const addrParts = [e.tags["addr:housenumber"], e.tags["addr:street"], e.tags["addr:city"] || e.tags["addr:suburb"]].filter(Boolean);
        const phone = e.tags.phone || e.tags["contact:phone"] || "";
        const website = (e.tags.website || e.tags["contact:website"] || "").replace(/^https?:\/\//, "");
        const email = e.tags.email || e.tags["contact:email"] || "";
        const contactScore = (phone ? 1 : 0) + (website ? 1 : 0) + (email ? 1 : 0);
        
        return {
          id: e.id, name: e.tags.name, address: addrParts.join(" ") || e.tags["addr:full"] || "",
          phone, website, email, hours: e.tags.opening_hours || "",
          dist: haversine(coords.lat, coords.lng, eLat, eLng).toFixed(1),
          contactScore
        };
      }).sort((a: any, b: any) => {
        if (b.contactScore !== a.contactScore) return b.contactScore - a.contactScore;
        return parseFloat(a.dist) - parseFloat(b.dist);
      }).slice(0, 10);
      setResults(biz);
      if (!biz.length) setError("no_results");
    } catch (err: any) { 
      if (err.message === "Failed to fetch") {
        setError("Network error: Failed to connect to the local business API. This might be due to an ad blocker or network issue.");
      } else {
        setError(err.message); 
      }
    }
    finally { setLoading(false); }
  };

  const toggleOutreach = (id: string) => setOutreachList(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const copyOutreach = () => {
    const sel = results.filter(b => outreachList.has(b.id));
    if (!sel.length) return;
    navigator.clipboard.writeText(sel.map(b => [b.name, b.address, b.phone, b.website, b.email].filter(Boolean).join(" | ")).join("\n"));
    setCopiedAll(true); setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div className="mb-[22px]">
      <div onClick={() => setOpen(o => !o)} className="flex justify-between items-center cursor-pointer bg-ms-panel border border-ms-border border-l-4 border-l-ms-green px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="font-ms text-[13px] text-ms-white font-bold">📍 Find Local Prospects Near Me</div>
          {locationName && searched && !loading && <span className="font-ms text-[10px] text-ms-green bg-ms-green-dark border border-ms-green px-2 py-0.5">Near {locationName}</span>}
          {results.length > 0 && <span className="font-ms text-[10px] text-ms-yellow bg-ms-yellow-dark border border-ms-yellow px-2 py-0.5">{results.length} found</span>}
        </div>
        <div className="font-ms text-[12px] text-ms-green">{open ? "▲" : "▼"}</div>
      </div>
      {open && (
        <div className="bg-ms-panel border border-ms-border border-t-0 p-4">
          <div className="flex gap-2.5 items-center flex-wrap mb-3.5">
            <div className="flex items-center gap-1.5">
              <span className="font-ms text-[10px] text-ms-text-muted font-bold">RADIUS</span>
              {[1, 5, 10, 25, 50].map(r => (
                <button suppressHydrationWarning key={r} onClick={() => setRadius(r)} className={`font-ms text-[10px] px-2 py-1 cursor-pointer ${radius === r ? "font-bold bg-ms-green-dark border-ms-green text-ms-green" : "font-normal bg-transparent border-ms-border text-ms-text-muted"} border`}>
                  {r} mi
                </button>
              ))}
            </div>
            <button suppressHydrationWarning onClick={search} disabled={loading} className={`font-ms text-[12px] font-bold px-5 py-2 whitespace-nowrap border-none ${loading ? "bg-ms-panel text-ms-green cursor-default" : "bg-ms-green text-[#060f06] cursor-pointer"}`}>
              {loading ? "⟳ Searching…" : `📍 Search ${radius} Mile Radius`}
            </button>
            {results.length > 0 && outreachList.size > 0 && (
              <button suppressHydrationWarning onClick={copyOutreach} className={`font-ms text-[11px] font-bold px-4 py-2 whitespace-nowrap cursor-pointer border ${copiedAll ? "bg-ms-green-dark border-ms-green text-ms-green" : "bg-transparent border-ms-border-light text-ms-text-muted"}`}>
                {copiedAll ? `✓ Copied!` : `Copy ${outreachList.size} Contact${outreachList.size > 1 ? "s" : ""}`}
              </button>
            )}
          </div>
          {!searched && !loading && <div className="font-ms text-[12px] text-[#4a6a4a] py-2">Click <strong className="text-ms-green">Search {radius} Mile Radius</strong> to find real {(niche || "").toLowerCase()} near your location using OpenStreetMap — no API key needed.</div>}
          {loading && (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2 mt-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="p-3 border bg-ms-panel border-ms-border animate-pulse">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <div className="h-4 w-3/4 bg-ms-border rounded"></div>
                    <div className="h-6 w-6 bg-ms-border rounded"></div>
                  </div>
                  <div className="h-3 w-1/4 bg-ms-green/20 rounded mb-2"></div>
                  <div className="h-3 w-full bg-ms-border/50 rounded mb-1"></div>
                  <div className="h-3 w-1/2 bg-ms-border/50 rounded"></div>
                </div>
              ))}
            </div>
          )}
          {error && error !== "no_results" && (
            <div className="bg-ms-red-dark border border-ms-red-dark text-ms-red p-3 font-ms text-[12px] flex justify-between items-center mt-2">
              <span>✕ {error}</span>
              <button suppressHydrationWarning onClick={search} className="font-ms bg-transparent border border-ms-red text-ms-red px-3 py-1 text-[11px] cursor-pointer">Retry</button>
            </div>
          )}
          {error === "no_results" && (
            <div className="bg-ms-yellow-dark border border-ms-yellow-dark p-3.5 mt-2">
              <div className="font-ms text-[12px] text-ms-yellow mb-2.5">No results within {radius} miles. Try a larger radius or search Google Maps:</div>
              <a href={gmapsUrl} target="_blank" rel="noreferrer" className="font-ms text-[12px] font-bold text-[#060f06] bg-ms-yellow px-4.5 py-2 no-underline inline-block">🗺 Search on Google Maps →</a>
            </div>
          )}
          {results.length > 0 && (
            <div>
              <div className="font-ms text-[10px] text-ms-green font-bold tracking-[1px] mb-2.5 mt-1 uppercase">
                TOP {results.length} {niche} WITHIN {radius} MILES · {locationName} · CLICK + TO ADD TO OUTREACH LIST
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-2">
                {results.map(b => {
                  const inList = outreachList.has(b.id);
                  return (
                    <div key={b.id} className={`p-3 border ${inList ? "bg-ms-green-dark border-ms-green" : "bg-ms-panel border-ms-border"}`}>
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <div className="font-ms text-[12px] text-white font-bold leading-[1.3] flex-1">{b.name}</div>
                        <button suppressHydrationWarning onClick={() => toggleOutreach(b.id)} className={`font-ms text-[11px] font-bold shrink-0 w-6 h-6 cursor-pointer leading-none border ${inList ? "bg-ms-green border-ms-green text-[#060f06]" : "bg-transparent border-ms-border-light text-[#4a6a4a]"}`}>
                          {inList ? "✓" : "+"}
                        </button>
                      </div>
                      <div className="font-ms text-[10px] text-ms-green font-bold mb-1">{b.dist} miles away</div>
                      {b.address && <div className="font-ms text-[10px] text-ms-text-muted mb-[3px] leading-[1.4]">{b.address}</div>}
                      {b.phone && <div className="font-ms text-[10px] text-ms-text-light mb-0.5">📞 {b.phone}</div>}
                      {b.website && <div className="font-ms text-[10px] text-ms-green mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap">🌐 {b.website}</div>}
                      {b.email && <div className="font-ms text-[10px] text-ms-text-light mb-0.5">✉ {b.email}</div>}
                    </div>
                  );
                })}
              </div>
              <div className="mt-2.5 font-ms text-[10px] text-ms-text-muted">Data from OpenStreetMap · Coverage varies by region · Always verify details before outreach</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
