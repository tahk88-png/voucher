"use client"

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { WarmButton } from "@/components/warm-button"
import { WarmCard } from "@/components/warm-card"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import type { Product } from "@prisma/client"

interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

export default function ShopClient({
  merchantId,
  currency,
  products,
}: {
  merchantId: string
  currency: string
  products: Product[]
}) {
  const t = useTranslations("shop.shopClient")
  const { toast } = useToast()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  )

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const submitCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/commerce/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "product",
          merchantId,
          currency,
          items: cart.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      })

      if (!res.ok) {
        throw new Error("Checkout failed")
      }
      const data = await res.json()
      toast({
        title: t("intentCreatedTitle"),
        description: t("intentCreatedDescription", {
          id: data.intentId,
          amount: formatCurrency(data.total, currency),
        }),
      })
      setCart([])
    } catch (error) {
      toast({
        title: t("checkoutErrorTitle"),
        description: t("checkoutErrorDescription"),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="grid gap-6 sm:grid-cols-2">
        {products.length === 0 ? (
          <WarmCard padding="lg" className="bg-[var(--surface)] col-span-full text-center">
            <p className="text-[var(--text-muted)]">{t("empty")}</p>
          </WarmCard>
        ) : (
          products.map((product) => (
            <WarmCard key={product.id} padding="lg" className="bg-[var(--surface)]">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <p className="font-semibold text-[var(--text)]">{product.name}</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {product.description || t("productHighlight")}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-[var(--text)]">
                    {formatCurrency(product.price, product.currency || currency)}
                  </span>
                  <WarmButton onClick={() => addToCart(product)}>{t("add")}</WarmButton>
                </div>
              </div>
            </WarmCard>
          ))
        )}
      </div>
      <WarmCard padding="lg" className="bg-[var(--surface)] h-fit">
        <h2 className="text-lg font-semibold text-[var(--text)] mb-4">{t("cart")}</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">{t("cartEmpty")}</p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{item.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t("lineQuantity", { quantity: item.quantity, price: formatCurrency(item.price, currency) })}
                  </p>
                </div>
                <button
                  className="text-xs text-[var(--danger)] hover:underline"
                  onClick={() => removeFromCart(item.id)}
                >
                  {t("remove")}
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)]/60 pt-4">
          <span className="text-sm font-semibold text-[var(--text)]">{t("total")}</span>
          <span className="text-lg font-bold text-[var(--text)]">
            {formatCurrency(total, currency)}
          </span>
        </div>
        <WarmButton
          className="w-full mt-4"
          onClick={submitCheckout}
          disabled={cart.length === 0 || isSubmitting}
        >
          {isSubmitting ? t("creatingIntent") : t("checkoutIntent")}
        </WarmButton>
      </WarmCard>
    </div>
  )
}
