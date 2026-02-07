import { redirect } from "next/navigation";

type Props = { params: { locale: string } };

export default function LocalizedAdminRedirect({ params: _params }: Props) {
  redirect("/admin");
}
