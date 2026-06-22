import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function LocalizedAdminRedirect({ params }: Props) {
  await params;
  redirect("/admin");
}
