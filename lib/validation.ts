import { z } from 'zod';

export const loginSchema = z.object({
  password: z.string().trim().min(1).max(256),
});

export const emailCaptureSchema = z.object({
  email: z.string().trim().email().max(254),
  source: z.string().trim().min(1).max(64).regex(/^[a-z0-9/_-]+$/i),
});
