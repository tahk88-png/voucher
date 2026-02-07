import * as React from "react";
import { WarmButton } from "@/components/warm-button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends React.ComponentProps<typeof WarmButton> {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton = React.forwardRef<
  HTMLButtonElement,
  LoadingButtonProps
>(({ loading, loadingText, children, disabled, ...props }, ref) => {
  return (
    <WarmButton ref={ref} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText || children : children}
    </WarmButton>
  );
});

LoadingButton.displayName = "LoadingButton";
