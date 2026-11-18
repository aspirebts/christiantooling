"use client";

import { useState } from "react";
import { MailCheckIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { signUp } from "@/server/actions/auth";

import { applyActionErrors } from "./apply-field-errors";
import { ResendVerification } from "./resend-verification";

export function RegisterForm({ disabled = false }: { disabled?: boolean }) {
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterInput) {
    setFormError(null);
    const result = await signUp(values);
    if (result.ok) {
      setConfirmationSentTo(values.email);
      return;
    }
    setFormError(
      applyActionErrors(result, form.setError, [
        "displayName",
        "email",
        "password",
        "confirmPassword",
      ]),
    );
  }

  if (confirmationSentTo) {
    return (
      <div className="flex flex-col items-center gap-4 text-center" role="status">
        <span className="flex size-12 items-center justify-center rounded-full bg-success-muted text-success">
          <MailCheckIcon className="size-6" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-ink">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If this address can be registered, we have sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{confirmationSentTo}</span>. Open it to
            activate your account.
          </p>
        </div>
        <ResendVerification email={confirmationSentTo} />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {formError ? <FormFeedback status="error" message={formError} /> : null}
        <fieldset disabled={disabled} className="flex flex-col gap-5">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormDescription>How you would like to appear on ChristianTooling.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
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
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton
            pending={form.formState.isSubmitting}
            pendingLabel="Creating account…"
            size="lg"
          >
            Create account
          </SubmitButton>
        </fieldset>
      </form>
    </Form>
  );
}
