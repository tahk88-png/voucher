import { NextRequest, NextResponse } from "next/server"
import { withErrorHandler } from "@/lib/error-handler"
import { auth } from "@/lib/auth"
import { evaluateFlagBatch } from "@/lib/admin/feature-flags"

export async function POST(req: NextRequest) {
  return withErrorHandler(async () => {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { keys, context } = body

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { error: "keys must be a non-empty array of flag keys" },
        { status: 400 }
      )
    }

    if (keys.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 flag keys per request" },
        { status: 400 }
      )
    }

    const evaluationContext = {
      tenantId: context?.tenantId ?? undefined,
      userId: context?.userId ?? session.user.id,
      orgId: context?.orgId ?? undefined,
    }

    const flags = await evaluateFlagBatch(keys, evaluationContext)

    return NextResponse.json({ flags })
  })
}
