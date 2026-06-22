import { redirect } from "next/navigation";

type Props = { params: Promise<{ locale: string; path?: string[] }> };

export default async function LocalizedAdminCatchAll({ params }: Props) {
  const { path } = await params;
  const tail = path?.join("/") ?? "";
  redirect(tail ? `/admin/${tail}` : "/admin");
}
