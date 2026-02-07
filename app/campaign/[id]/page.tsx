import { redirect } from "next/navigation"

export default function CampaignAliasPage({ params }: { params: { id: string } }) {
  redirect(`/campaigns/${params.id}`)
}

