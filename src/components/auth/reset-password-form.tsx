"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { updatePassword } from "@/server/actions/auth";

import { applyActionErrors } from "./apply-field-errors";

export function ResetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setFormError(null);
    const result = await updatePassword(values);
    if (result.ok) {
      setDone(true);
      return;
    }
    setFormError(applyActionErrors(result, form.setError, ["password", "confirmPassword"]));
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <CircleCheckIcon className="size-10 text-success" aria-hidden="true" />
        <p className="font-semibold text-ink">Your password has been updated.</p>
        <Button asChild size="lg" className="w-full">
          <Link href="/dashboard">Continue to your dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {formError ? <FormFeedback status="error" message={formError} /> : null}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormDescription>
                At least 8 characters, including a letter and a number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Updating…" size="lg">
          Update password
        </SubmitButton>
      </form>
    </Form>
  );
}
