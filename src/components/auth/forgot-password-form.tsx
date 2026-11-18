"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { requestPasswordReset } from "@/server/actions/auth";

import { applyActionErrors } from "./apply-field-errors";

export function ForgotPasswordForm({ disabled = false }: { disabled?: boolean }) {
  const [feedback, setFeedback] = useState<{ status: "success" | "error"; message: string } | null>(
    null,
  );
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setFeedback(null);
    const result = await requestPasswordReset(values);
    if (result.ok) {
      setFeedback({ status: "success", message: result.message ?? "Check your inbox." });
      form.reset();
      return;
    }
    const message = applyActionErrors(result, form.setError, ["email"]);
    if (message) setFeedback({ status: "error", message });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {feedback ? <FormFeedback status={feedback.status} message={feedback.message} /> : null}
        <fieldset disabled={disabled} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" inputMode="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Sending…" size="lg">
            Send reset link
          </SubmitButton>
        </fieldset>
      </form>
    </Form>
  );
}
