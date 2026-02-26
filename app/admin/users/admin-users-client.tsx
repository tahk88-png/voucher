"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WarmCard } from "@/components/warm-card"
import { Input } from "@/components/ui/input"
import { Search, Ban, CheckCircle, KeyRound, AlertCircle } from "lucide-react"

interface UserRow {
  id: string
  email: string
  name: string | null
  status: string
  createdAt: string
  _count: {
    voucherPurchases: number
    redemptions: number
    merchantMembers: number
  }
}

interface AdminUsersClientProps {
  initialUsers: UserRow[]
  total: number
  page: number
  pages: number
  search: string
}

export default function AdminUsersClient({
  initialUsers,
  total,
  page,
  pages,
  search,
}: AdminUsersClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [searchInput, setSearchInput] = useState(search)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput.trim()) params.set("q", searchInput.trim())
    router.push(`/admin/users?${params.toString()}`)
  }

  async function handleAction(userId: string, action: string) {
    setLoading(userId)
    setError("")
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Action failed")
        return
      }
      router.refresh()
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B7355]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="pl-10"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-[var(--r-sm)] text-sm font-medium text-[var(--text)] bg-[var(--primary)] hover:brightness-105 transition-all"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="p-2.5 rounded-[var(--r-sm)] bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <WarmCard padding="none" className="bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[rgba(139,115,85,0.15)] bg-[#FFF9ED]/50">
                <th className="text-left px-4 py-3 font-semibold text-[#8B7355]">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-[#8B7355]">Email</th>
                <th className="text-center px-4 py-3 font-semibold text-[#8B7355]">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Purchases</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Merchant?</th>
                <th className="text-right px-4 py-3 font-semibold text-[#8B7355]">Joined</th>
                <th className="text-center px-4 py-3 font-semibold text-[#8B7355]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.map((user) => (
                <tr key={user.id} className="border-b border-[rgba(139,115,85,0.08)] hover:bg-[#FFF9ED]/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-[#2D2721]">{user.name || "—"}</td>
                  <td className="px-4 py-3 text-[#6B5744]">{user.email}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      user.status === "active"
                        ? "bg-green-50 text-green-700"
                        : user.status === "disabled"
                        ? "bg-red-50 text-red-700"
                        : "bg-yellow-50 text-yellow-700"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#2D2721]">{user._count.voucherPurchases}</td>
                  <td className="px-4 py-3 text-right text-[#2D2721]">{user._count.merchantMembers > 0 ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right text-[#6B5744]">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {user.status === "active" ? (
                        <button
                          onClick={() => handleAction(user.id, "ban")}
                          disabled={loading === user.id}
                          className="p-1.5 rounded-[var(--r-sm)] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                          title="Ban user"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAction(user.id, "unban")}
                          disabled={loading === user.id}
                          className="p-1.5 rounded-[var(--r-sm)] text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                          title="Unban user"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleAction(user.id, "reset_password")}
                        disabled={loading === user.id}
                        className="p-1.5 rounded-[var(--r-sm)] text-[#8B7355] hover:bg-[#FFF9ED] transition-colors disabled:opacity-50"
                        title="Reset password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WarmCard>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <button
              onClick={() => {
                const params = new URLSearchParams()
                if (search) params.set("q", search)
                params.set("page", String(page - 1))
                router.push(`/admin/users?${params.toString()}`)
              }}
              className="px-3 py-1.5 rounded-[var(--r-sm)] text-sm border border-[rgba(139,115,85,0.15)] hover:bg-[#FFF9ED] transition-colors"
            >
              Previous
            </button>
          )}
          <span className="text-sm text-[#6B5744]">Page {page} of {pages}</span>
          {page < pages && (
            <button
              onClick={() => {
                const params = new URLSearchParams()
                if (search) params.set("q", search)
                params.set("page", String(page + 1))
                router.push(`/admin/users?${params.toString()}`)
              }}
              className="px-3 py-1.5 rounded-[var(--r-sm)] text-sm border border-[rgba(139,115,85,0.15)] hover:bg-[#FFF9ED] transition-colors"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  )
}
