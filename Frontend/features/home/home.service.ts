import { newsletterSchema } from '@/validate/schemas';

export async function subscribeNewsletter(
  email: string
): Promise<{ success: boolean; message?: string }> {
  const parsed = newsletterSchema.safeParse({ email });
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0].message };
  }
  return { success: true, message: 'Subscribed — check your inbox for a 10% off code!' };
}