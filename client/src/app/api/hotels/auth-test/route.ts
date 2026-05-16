import { NextResponse } from "next/server";
import { getTboToken } from "@/lib/adapters/tbo/auth";

/**
 * Test endpoint to verify TBO hotel authentication API is working
 * GET /api/hotels/auth-test
 */
export async function GET() {
  try {
    console.log("[API /api/hotels/auth-test] Testing TBO authentication...");

    // Call the authentication function
    const token = await getTboToken();

    console.log("[API /api/hotels/auth-test] ✓ Authentication successful");
    console.log("[API /api/hotels/auth-test] Token (masked):", token.slice(0, 8) + "..." + token.slice(-4));

    return NextResponse.json({
      success: true,
      message: "TBO hotel authentication API is working!",
      token: token.slice(0, 8) + "..." + token.slice(-4), // Masked token for security
      tokenLength: token.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[API /api/hotels/auth-test] ✗ Authentication failed:", message);

    return NextResponse.json(
      {
        success: false,
        error: message,
        details: "Check TBO credentials in .env.local (TBO_USER_NAME, TBO_PASSWORD, etc.)",
      },
      { status: 500 },
    );
  }
}
