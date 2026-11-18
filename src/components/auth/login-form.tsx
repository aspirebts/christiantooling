"use client";

import { useState } from "react";
import Link from "next/link";
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
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { signIn } from "@/server/actions/auth";

import { applyActionErrors } from "./apply-field-errors";

type LoginFormProps = {
  next?: string;
  disabled?: boolean;
  initialError?: string | null;
};

export function LoginForm({ next, disabled = false, initialError = null }: LoginFormProps) {
  const [formError, setFormError] = useState<string | null>(initialError);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginInput) {
    setFormError(null);
    // On success the action redirects, so a returned value always means failure.
    const result = await signIn(values, next);
    setFormError(applyActionErrors(result, form.setError, ["email", "password"]));
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
        {formError ? <FormFeedback status="error" message={formError} /> : null}
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-slate underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <SubmitButton pending={form.formState.isSubmitting} pendingLabel="Signing in…" size="lg">
            Sign in
          </SubmitButton>
        </fieldset>
      </form>
    </Form>
  );
}
