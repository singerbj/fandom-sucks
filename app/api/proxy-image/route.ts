// app/api/proxy-image/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge"; // Use Edge runtime for better performance with binary data

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the image URL from the query parameters
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("Missing URL parameter", { status: 400 });
    }

    // Fetch the original image
    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      return new NextResponse(
        `Failed to fetch image: ${imageResponse.statusText}`,
        {
          status: imageResponse.status,
        }
      );
    }

    // Get the image data and content type
    const imageData = await imageResponse.arrayBuffer();
    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    // Return the image with the same content type
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("Proxy image error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new NextResponse(`Error proxying image: ${errorMessage}`, {
      status: 500,
    });
  }
}
