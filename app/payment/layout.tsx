// Messages and locale come from the root layout's NextIntlClientProvider,
// so payment pages follow the visitor's language like the rest of the app.
export default function PaymentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
