import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { withErrorHandler } from "@/lib/error-handler";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const body = await req.json();
    const {
      reportedUserId,
      reportedMerchantId,
      reportedEntityType,
      reportedEntityId,
      category,
      description,
      evidenceUrls,
    } = body;

    if (!category || !description) {
      return NextResponse.json(
        { error: "category and description are required" },
        { status: 400 }
      );
    }

    const validCategories = [
      "spam",
      "fraud",
      "offensive_content",
      "trademark_violation",
      "other",
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `category must be one of: ${validCategories.join(", ")}` },
        { status: 400 }
      );
    }

    if (!reportedUserId && !reportedMerchantId && !reportedEntityId) {
      return NextResponse.json(
        {
          error:
            "At least one of reportedUserId, reportedMerchantId, or reportedEntityId is required",
        },
        { status: 400 }
      );
    }

    // Prevent self-reporting
    if (reportedUserId === userId) {
      return NextResponse.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      );
    }

    logger.info("User submitting report", {
      userId,
      reportedUserId,
      reportedMerchantId,
      reportedEntityType,
      category,
    });

    const report = await prisma.userReport.create({
      data: {
        reportedByUserId: userId,
        reportedUserId,
        reportedMerchantId,
        reportedEntityType,
        reportedEntityId,
        category,
        description,
        evidenceUrls: evidenceUrls ?? [],
        status: "open",
      },
    });

    logger.info("User report submitted successfully", {
      reportId: report.id,
      userId,
    });

    return NextResponse.json(
      {
        id: report.id,
        status: report.status,
        message: "Report submitted successfully",
      },
      { status: 201 }
    );
  });
}
