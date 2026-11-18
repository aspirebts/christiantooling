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
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { preferencesSchema, type PreferencesInput } from "@/lib/validations/account";
import { updatePreferences } from "@/server/actions/account";

type Feedback = { status: "success" | "error"; message: string } | null;

type PreferencesFormProps = {
  defaultValues: PreferencesInput;
  /** Time zones supported by the server, so client and server validation agree. */
  timeZones: string[];
};

export function PreferencesForm({ defaultValues, timeZones }: PreferencesFormProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const form = useForm<PreferencesInput>({
    resolver: zodResolver(preferencesSchema),
    defaultValues,
  });

  async function onSubmit(values: PreferencesInput) {
    setFeedback(null);
    const result = await updatePreferences(values);
    if (result.ok) {
      setFeedback({ status: "success", message: result.message ?? "Saved." });
      form.reset(values);
      return;
    }
    const message = applyActionErrors(result, form.setError, [
      "emailNotifications",
      "newsletterOptIn",
      "timezone",
    ]);
    if (message) setFeedback({ status: "error", message });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
        {feedback ? <FormFeedback status={feedback.status} message={feedback.message} /> : null}
        <FormField
          control={form.control}
          name="emailNotifications"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-6 rounded-lg border p-4">
              <div className="flex flex-col gap-1">
                <FormLabel>Activity emails</FormLabel>
                <FormDescription>
                  Updates about your submissions, ideas and volunteer applications.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newsletterOptIn"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-6 rounded-lg border p-4">
              <div className="flex flex-col gap-1">
                <FormLabel>Ministry newsletter</FormLabel>
                <FormDescription>
                  Occasional news about new tools, projects and impact.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem className="max-w-sm">
              <FormLabel>Time zone</FormLabel>
              <FormControl>
                <NativeSelect {...field}>
                  {timeZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone.replaceAll("_", " ")}
                    </option>
                  ))}
                </NativeSelect>
              </FormControl>
              <FormDescription>Used for reminders and dates in emails.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <SubmitButton pending={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
            Save preferences
          </SubmitButton>
        </div>
      </form>
    </Form>
  );
}
