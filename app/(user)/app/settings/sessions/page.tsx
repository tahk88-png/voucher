import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { describeDevice } from "./device"
import SessionsClient from "./sessions-client"

export default async function SessionsPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }
  const requestHeaders = await headers()
  const currentDevice = describeDevice(requestHeaders.get("user-agent"))
  return <SessionsClient currentDevice={currentDevice} />
}
