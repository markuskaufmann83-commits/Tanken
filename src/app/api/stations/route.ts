import { NextRequest, NextResponse } from "next/server";
import { Station, TankerkoenigListResponse } from "@/types/tankerkoenig";

// Realistic fallback demo data in case of missing key or API failure
function generateFallbackStations(lat: number, lng: number): Station[] {
  const brands = [
    { brand: "ARAL", name: "Aral Tankstelle", street: "Hauptstraße", num: "42", dDiff: -0.02, e5Diff: 0.01, e10Diff: -0.01 },
    { brand: "SHELL", name: "Shell Station", street: "Bundesstraße", num: "108", dDiff: 0.01, e5Diff: 0.02, e10Diff: 0.02 },
    { brand: "JET", name: "JET Tankstelle", street: "Gewerbestraße", num: "15", dDiff: -0.04, e5Diff: -0.04, e10Diff: -0.04 },
    { brand: "TOTAL", name: "TotalEnergies", street: "Industriestraße", num: "7", dDiff: 0.00, e5Diff: 0.00, e10Diff: 0.00 },
    { brand: "HEM", name: "HEM Tankstelle", street: "Westring", num: "89", dDiff: -0.05, e5Diff: -0.03, e10Diff: -0.03 },
    { brand: "ESSO", name: "Esso Station", street: "Bahnhofstraße", num: "3", dDiff: 0.02, e5Diff: 0.03, e10Diff: 0.02 },
    { brand: "AVIA", name: "AVIA Tankstelle", street: "Kölner Straße", num: "24", dDiff: -0.01, e5Diff: -0.02, e10Diff: -0.02 },
    { brand: "Freie Tankstelle", name: "bft Freie Tankstelle", street: "Dorfstraße", num: "12", dDiff: -0.06, e5Diff: -0.05, e10Diff: -0.05 },
  ];

  const baseDiesel = 1.589;
  const baseE5 = 1.749;
  const baseE10 = 1.689;

  return brands.map((b, index) => {
    // Generate slight offset coordinates
    const offsetLat = (index % 3 === 0 ? 0.015 : -0.012) * ((index + 1) * 0.7);
    const offsetLng = (index % 2 === 0 ? 0.02 : -0.018) * ((index + 1) * 0.6);
    const dist = Math.round((Math.sqrt(offsetLat * offsetLat + offsetLng * offsetLng) * 111) * 10) / 10;

    return {
      id: `demo-${index + 1}`,
      name: b.name,
      brand: b.brand,
      street: b.street,
      houseNumber: b.num,
      postCode: 10115,
      place: "Umgebung",
      lat: Math.round((lat + offsetLat) * 10000) / 10000,
      lng: Math.round((lng + offsetLng) * 10000) / 10000,
      dist: dist || 1.1,
      diesel: Math.round((baseDiesel + b.dDiff) * 1000) / 1000,
      e5: Math.round((baseE5 + b.e5Diff) * 1000) / 1000,
      e10: Math.round((baseE10 + b.e10Diff) * 1000) / 1000,
      isOpen: index !== 6, // 7th is closed for realistic testing
    };
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get("lat") || "52.52");
  const lng = parseFloat(searchParams.get("lng") || "13.405");
  const rad = Math.min(Math.max(parseFloat(searchParams.get("rad") || "5"), 1), 25);
  const sort = searchParams.get("sort") === "dist" ? "dist" : "price";
  const type = searchParams.get("type") || "all";

  // Validate coordinates
  if (isNaN(lat) || isNaN(lng) || lat < 45 || lat > 56 || lng < 5 || lng > 16) {
    return NextResponse.json(
      {
        ok: false,
        status: "error",
        message: "Ungültige Koordinaten. Bitte Koordinaten innerhalb von Deutschland angeben.",
      },
      { status: 400 }
    );
  }

  const apiKey = process.env.TANKERKOENIG_API_KEY;

  if (!apiKey || apiKey === "your_tankerkoenig_api_key_here") {
    // Return mock data with demo notice
    const mockStations = generateFallbackStations(lat, lng);
    return NextResponse.json(
      {
        ok: true,
        status: "demo",
        message: "Demo-Modus aktiv: Kein Tankerkönig API-Key konfiguriert.",
        license: "Demo Data",
        data: "Demo MTS-K",
        stations: mockStations,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  }

  try {
    const tankerkoenigUrl = new URL("https://creativecommons.tankerkoenig.de/json/list.php");
    tankerkoenigUrl.searchParams.set("lat", lat.toString());
    tankerkoenigUrl.searchParams.set("lng", lng.toString());
    tankerkoenigUrl.searchParams.set("rad", rad.toString());
    tankerkoenigUrl.searchParams.set("sort", sort);
    tankerkoenigUrl.searchParams.set("type", type);
    tankerkoenigUrl.searchParams.set("apikey", apiKey);

    const response = await fetch(tankerkoenigUrl.toString(), {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Tankerkönig API HTTP ${response.status}`);
    }

    const data: TankerkoenigListResponse = await response.json();

    if (!data.ok) {
      // Tankerkönig returned an API-level error (e.g. rate limit or invalid key)
      console.warn("Tankerkönig API reported non-ok status:", data.message);
      // Fallback to realistic stations so the user experience doesn't break
      return NextResponse.json({
        ...data,
        stations: generateFallbackStations(lat, lng),
        isFallback: true,
      });
    }

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error("Error fetching Tankerkönig data:", errMessage);

    // Provide fallback data on network failure
    return NextResponse.json({
      ok: true,
      status: "fallback",
      message: `Verbindung zur Preis-API fehlgeschlagen (${errMessage}). Beispieldaten werden angezeigt.`,
      stations: generateFallbackStations(lat, lng),
      isFallback: true,
    });
  }
}
