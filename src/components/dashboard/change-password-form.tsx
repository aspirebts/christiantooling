"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { applyActionErrors } from "@/components/auth/apply-field-errors";
import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
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
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validations/auth";
import { changePassword } from "@/server/actions/account";

type Feedback = { status: "success" | "error"; message: string } | null;

const EMPTY: ChangePasswordInput = { currentPassword: "", password: "", confirmPassword: "" };

export function ChangePasswordForm() {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY,
  });

  async function onSubmit(values: ChangePasswordInput) {
    setFeedback(null);
    const result = await changePassword(values);
    if (result.ok) {
      setFeedback({ status: "success", message: result.message ?? "Password changed." });
      form.reset(EMPTY);
      return;
    }
    const message = applyActionErrors(result, form.setError, [
      "currentPassword",
      "password",
      "confirmPassword",
    ]);
    if (message) setFeedback({ status: "error", message });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        noValidate
        className="flex max-w-md flex-col gap-5"
      >
        {feedback ? <FormFeedback status={feedback.status} message={feedback.message} /> : null}
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <div>
          <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Updating…">
            Change password
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
