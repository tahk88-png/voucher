import { redirect } from "next/navigation"

export default function VoucherAliasPage({ params }: { params: { id: string } }) {
  redirect(`/v/${params.id}`)
}

