"use client"

import { useMemo, useState } from "react"
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
        title: "Checkout intent created",
        description: `Intent ${data.intentId} for ${formatCurrency(
          data.total,
          currency
        )}`,
      })
      setCart([])
    } catch (error) {
      toast({
        title: "Checkout error",
        description: "Unable to create checkout intent.",
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
          <WarmCard padding="lg" className="bg-white col-span-full text-center">
            <p className="text-[#6B5744]">No products available yet.</p>
          </WarmCard>
        ) : (
          products.map((product) => (
            <WarmCard key={product.id} padding="lg" className="bg-white">
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <p className="font-semibold text-[#2D2721]">{product.name}</p>
                  <p className="text-sm text-[#6B5744] mt-1">
                    {product.description || "Product highlight"}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-[#2D2721]">
                    {formatCurrency(product.price, product.currency || currency)}
                  </span>
                  <WarmButton onClick={() => addToCart(product)}>Add</WarmButton>
                </div>
              </div>
            </WarmCard>
          ))
        )}
      </div>
      <WarmCard padding="lg" className="bg-white h-fit">
        <h2 className="text-lg font-semibold text-[#2D2721] mb-4">Cart</h2>
        {cart.length === 0 ? (
          <p className="text-sm text-[#6B5744]">Cart is empty.</p>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#2D2721]">{item.name}</p>
                  <p className="text-xs text-[#6B5744]">
                    {item.quantity} x {formatCurrency(item.price, currency)}
                  </p>
                </div>
                <button
                  className="text-xs text-[#E17B5C] hover:underline"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-[#E7DCC7]/60 pt-4">
          <span className="text-sm font-semibold text-[#2D2721]">Total</span>
          <span className="text-lg font-bold text-[#2D2721]">
            {formatCurrency(total, currency)}
          </span>
        </div>
        <WarmButton
          className="w-full mt-4"
          onClick={submitCheckout}
          disabled={cart.length === 0 || isSubmitting}
        >
          {isSubmitting ? "Creating intent..." : "Checkout intent"}
        </WarmButton>
      </WarmCard>
    </div>
  )
}
