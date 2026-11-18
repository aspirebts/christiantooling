"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { FormFeedback } from "@/components/forms/form-feedback";
import { SubmitButton } from "@/components/forms/submit-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const VARIANTS = ["default", "secondary", "outline", "ghost", "link", "destructive"] as const;
const SIZES = ["sm", "default", "lg"] as const;

/** Buttons report which specimen was pressed, so every control does something. */
export function ButtonSpecimens() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {VARIANTS.map((variant) => (
          <Button
            key={variant}
            variant={variant}
            onClick={() => setLastPressed(`${variant} button`)}
          >
            {variant === "default" ? "Primary" : variant.charAt(0).toUpperCase() + variant.slice(1)}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {SIZES.map((size) => (
          <Button key={size} size={size} onClick={() => setLastPressed(`${size} size`)}>
            Size {size}
          </Button>
        ))}
        <Button size="icon" aria-label="Icon button" onClick={() => setLastPressed("icon button")}>
          <PlusIcon />
        </Button>
        <Button disabled>Disabled</Button>
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {lastPressed
          ? `Last pressed: ${lastPressed}`
          : "Press any button to test focus and hover states."}
      </p>
    </div>
  );
}

export function DialogSpecimen() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>
            Dialogs trap focus, close on Escape and restore focus to the trigger when closed.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Use dialogs for short, focused tasks such as confirming a role change.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Confirm</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const demoSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters."),
  email: z.email("Enter a valid email address."),
  message: z.string().trim().max(200, "Keep it under 200 characters."),
  subscribe: z.boolean(),
});

type DemoValues = z.infer<typeof demoSchema>;

/** Demonstrates validation states. Validates locally only; nothing is sent. */
export function FormSpecimen() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<DemoValues>({
    resolver: zodResolver(demoSchema),
    defaultValues: { name: "", email: "", message: "", subscribe: true },
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className="flex max-w-md flex-col gap-5"
        onSubmit={form.handleSubmit(() => setSubmitted(true))}
      >
        {submitted ? (
          <FormFeedback
            status="success"
            message="Validation passed. This demo form does not send any data."
          />
        ) : null}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
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
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>Helper text explains what the field is for.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="subscribe"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-lg border p-4">
              <FormLabel>Switch control</FormLabel>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div>
          <SubmitButton pending={form.formState.isSubmitting}>Validate form</SubmitButton>
        </div>
      </form>
    </Form>
  );
}
