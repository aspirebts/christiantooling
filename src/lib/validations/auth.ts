import { z } from "zod";

/**
 * Auth form schemas, shared by client forms (instant feedback) and Server
 * Actions (authoritative validation). Password rules mirror supabase/config.toml
 * (minimum 8 characters, letters and digits); 72 is bcrypt's input limit.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(320, "Email address is too long.")
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");

export const loginSchema = z.object({
  email: emailSchema,
  // Existing passwords are checked by Supabase; only require a value here.
  password: z.string().min(1, "Enter your password.").max(72, "Use 72 characters or fewer."),
});

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(1, "Tell us what to call you.")
      .max(80, "Use 80 characters or fewer."),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((values) => values.password !== values.currentPassword, {
    path: ["password"],
    message: "Choose a password different from your current one.",
  });

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
