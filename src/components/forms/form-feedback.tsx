import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";

type FormFeedbackProps = {
  status: "success" | "error";
  message: string;
};

/** Form-level result banner (field errors are shown next to their inputs). */
export function FormFeedback({ status, message }: FormFeedbackProps) {
  const isError = status === "error";

  return (
    <Alert variant={isError ? "destructive" : "success"} role={isError ? "alert" : "status"}>
      {isError ? <CircleAlertIcon aria-hidden="true" /> : <CircleCheckIcon aria-hidden="true" />}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
