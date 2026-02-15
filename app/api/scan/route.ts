import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // TODO: Integrate Firecrawl API
    // For now, return mock scan results
    const mockResult = {
      pageCount: 350,
      categories: [
        { label: "Products", count: 120 },
        { label: "Blog", count: 85 },
        { label: "Landing pages", count: 45 },
        { label: "Services", count: 30 },
        { label: "About/Contact", count: 20 },
        { label: "Other", count: 50 },
      ],
      url: url.replace(/\/$/, ""),
    };

    return NextResponse.json(mockResult);
  } catch {
    return NextResponse.json(
      { error: "Scan failed" },
      { status: 500 }
    );
  }
}
