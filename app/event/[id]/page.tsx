import { redirect } from "next/navigation"

export default function EventAliasPage({ params }: { params: { id: string } }) {
  redirect(`/e/${params.id}`)
}

