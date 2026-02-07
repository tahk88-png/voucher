import { redirect } from "next/navigation";

type Props = { params: { locale: string; path?: string[] } };

export default function LocalizedAdminCatchAll({ params }: Props) {
  const tail = params.path?.join("/") ?? "";
  redirect(tail ? `/admin/${tail}` : "/admin");
}
