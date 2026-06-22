import { redirect } from "next/navigation"

// In the old design/prototype repo the gift card route used an `:id` param.
// In this Next app, the public route uses the gift-card code under `/g/[code]`.
export default async function GiftCardAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/g/${id}`)
}

