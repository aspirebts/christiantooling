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
import { Textarea } from "@/components/ui/textarea";
import { profileSchema, type ProfileInput } from "@/lib/validations/account";
import { updateProfile } from "@/server/actions/account";

type Feedback = { status: "success" | "error"; message: string } | null;

export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  async function onSubmit(values: ProfileInput) {
    setFeedback(null);
    const result = await updateProfile(values);
    if (result.ok) {
      setFeedback({ status: "success", message: result.message ?? "Saved." });
      form.reset(values);
      return;
    }
    const message = applyActionErrors(result, form.setError, [
      "displayName",
      "username",
      "bio",
      "location",
      "websiteUrl",
    ]);
    if (message) setFeedback({ status: "error", message });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {feedback ? <FormFeedback status={feedback.status} message={feedback.message} /> : null}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input autoComplete="username" placeholder="e.g. mary-builds" {...field} />
                </FormControl>
                <FormDescription>
                  Optional. Used for your public profile link later.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="A sentence or two about you and your interests."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input autoComplete="address-level2" placeholder="City, country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website</FormLabel>
                <FormControl>
                  <Input type="url" inputMode="url" placeholder="https://" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end">
          <SubmitButton pending={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
            Save profile
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
