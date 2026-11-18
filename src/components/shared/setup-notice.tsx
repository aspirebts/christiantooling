import { DatabaseIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type SetupNoticeProps = {
  /** What is unavailable, e.g. "Sign-in" or "Practice categories". */
  feature: string;
};

/**
 * Explains safe local mode to developers. Rendered only when Supabase
 * credentials are missing, so production visitors never see it.
 */
export function SetupNotice({ feature }: SetupNoticeProps) {
  return (
    <Alert variant="info">
      <DatabaseIcon aria-hidden="true" />
      <AlertTitle>{feature} needs Supabase</AlertTitle>
      <AlertDescription>
        <p>
          This environment is running in safe local mode. Add{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
          <code className="font-mono text-xs">.env.local</code> and apply the migrations. See the
          README.
        </p>
      </AlertDescription>
    </Alert>
  );
}
