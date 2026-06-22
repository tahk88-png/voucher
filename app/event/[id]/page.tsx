import { redirect } from "next/navigation"

export default async function EventAliasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/e/${id}`)
}

