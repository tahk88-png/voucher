import { NextResponse } from "next/server";
import { AccessControlError } from "@/lib/access-control/guards";

export function accessErrorResponse(error: unknown, fallbackMessage = "Access control error") {
  if (error instanceof AccessControlError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details ?? null,
      },
      { status: error.status }
    );
  }

  return NextResponse.json(
    {
      error: fallbackMessage,
    },
    { status: 500 }
  );
}

