import { NextRequest, NextResponse } from "next/server";

// Proxies OpenStreetMap Nominatim so the client gets real Kuwait area/block/street.
const UA = "BluePointLaundry/1.0 (support@bluepoint.app)";

function firstDigits(s?: string): string {
  const m = (s || "").match(/\d+/);
  return m ? m[0] : "";
}

type OsmAddress = {
  suburb?: string;
  city_district?: string;
  county?: string;
  neighbourhood?: string;
  quarter?: string;
  road?: string;
  house_number?: string;
};

function parse(a: OsmAddress | undefined) {
  const area = a?.suburb || a?.city_district || a?.county || a?.neighbourhood || "";
  const blockRaw = a?.neighbourhood || a?.quarter || "";
  const block = /block|قطعة/i.test(blockRaw) ? firstDigits(blockRaw) : "";
  const road = a?.road || "";
  const street = /street|شارع/i.test(road) ? firstDigits(road) : road;
  const building = a?.house_number || "";
  return { area, block, street, building };
}

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get("mode");
  try {
    if (mode === "reverse") {
      const lat = p.get("lat");
      const lng = p.get("lng");
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const json = (await res.json()) as { address?: OsmAddress };
      return NextResponse.json(parse(json?.address));
    }
    if (mode === "search") {
      const area = p.get("area") || "";
      const block = p.get("block") || "";
      const street = p.get("street") || "";
      const q = [street && `Street ${street}`, block && `Block ${block}`, area, "Kuwait"]
        .filter(Boolean)
        .join(", ");
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&addressdetails=1&limit=1&accept-language=en`;
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (Array.isArray(arr) && arr[0]) {
        return NextResponse.json({ lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) });
      }
      return NextResponse.json({ lat: null, lng: null });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
  return NextResponse.json({ error: "bad_mode" }, { status: 400 });
}
