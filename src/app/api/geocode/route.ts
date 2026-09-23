import { NextRequest, NextResponse } from "next/server";
import { GeocodeResult } from "@/types/tankerkoenig";

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    postcode?: string;
    state?: string;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Suchbegriff zu kurz" },
      { status: 400 }
    );
  }

  try {
    const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
    nominatimUrl.searchParams.set("q", q);
    nominatimUrl.searchParams.set("format", "json");
    nominatimUrl.searchParams.set("countrycodes", "de");
    nominatimUrl.searchParams.set("addressdetails", "1");
    nominatimUrl.searchParams.set("limit", "5");

    const res = await fetch(nominatimUrl.toString(), {
      headers: {
        "User-Agent": "SpritRadar-PWA/1.0 (info@spritradar.internal)",
        Accept: "application/json",
      },
      next: { revalidate: 3600 }, // Cache geocode results for 1 hour
    });

    if (!res.ok) {
      throw new Error(`Nominatim error: ${res.status}`);
    }

    const items: NominatimItem[] = await res.json();

    const results: GeocodeResult[] = items.map((item) => {
      const city =
        item.address?.city ||
        item.address?.town ||
        item.address?.village ||
        item.address?.suburb ||
        "";
      const postcode = item.address?.postcode || "";

      return {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        city: city || item.display_name.split(",")[0],
        postcode: postcode,
      };
    });

    return NextResponse.json({ ok: true, results });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Geocoding Fehler";
    console.error("Geocoding failed:", msg);
    return NextResponse.json(
      { ok: false, error: "Ortssuche fehlgeschlagen" },
      { status: 500 }
    );
  }
}
