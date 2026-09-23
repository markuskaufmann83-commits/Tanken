import { NextRequest, NextResponse } from "next/server";
import { StationDetail, TankerkoenigDetailResponse } from "@/types/tankerkoenig";

// Fallback detail if station is a demo or API unavailable
function generateFallbackDetail(id: string): StationDetail {
  return {
    id,
    name: "Tankstelle im Detail",
    brand: "Freie Tankstelle",
    street: "Musterstraße",
    houseNumber: "1",
    postCode: 10115,
    place: "Berlin",
    isOpen: true,
    wholeDay: false,
    e5: 1.739,
    e10: 1.679,
    diesel: 1.579,
    lat: 52.52,
    lng: 13.405,
    openingTimes: [
      { text: "Montag - Freitag", from: "06:00:00", to: "22:00:00" },
      { text: "Samstag", from: "07:00:00", to: "22:00:00" },
      { text: "Sonntag & Feiertage", from: "08:00:00", to: "21:00:00" },
    ],
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { ok: false, status: "error", message: "Parameter 'id' fehlt" },
      { status: 400 }
    );
  }

  // Handle demo stations
  if (id.startsWith("demo-")) {
    return NextResponse.json({
      ok: true,
      status: "demo",
      station: generateFallbackDetail(id),
    });
  }

  const apiKey = process.env.TANKERKOENIG_API_KEY;

  if (!apiKey || apiKey === "your_tankerkoenig_api_key_here") {
    return NextResponse.json({
      ok: true,
      status: "demo",
      station: generateFallbackDetail(id),
    });
  }

  try {
    const detailUrl = `https://creativecommons.tankerkoenig.de/json/detail.php?id=${encodeURIComponent(id)}&apikey=${apiKey}`;
    const response = await fetch(detailUrl, {
      next: { revalidate: 120 },
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Tankerkönig Detail API HTTP ${response.status}`);
    }

    const data: TankerkoenigDetailResponse = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Fehler beim Laden";
    console.error("Detail API error:", msg);
    return NextResponse.json({
      ok: true,
      status: "fallback",
      station: generateFallbackDetail(id),
    });
  }
}
