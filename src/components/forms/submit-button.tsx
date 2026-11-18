import { Loader2Icon } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";

type SubmitButtonProps = Omit<ButtonProps, "type" | "asChild"> & {
  pending?: boolean;
  pendingLabel?: string;
};

/** Submit button that disables itself and announces progress while pending. */
export function SubmitButton({
  pending = false,
  pendingLabel = "Saving…",
  disabled,
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Loader2Icon className="animate-spin" aria-hidden="true" />
          <span>{pendingLabel}</span>
        </>
      ) : (
        children
      )}
    </Button>
  );
}
