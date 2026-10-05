import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('validation:emailInvalid'),
  password: z.string().min(1, 'validation:passwordRequired'),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, 'validation:fullNameInvalid').regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, 'validation:fullNameInvalid'),
  email: z.string().email('validation:emailInvalid'),
  password: z.string().min(8, 'validation:passwordWeak').regex(/[A-Z]/, 'validation:passwordWeak').regex(/[0-9]/, 'validation:passwordWeak').regex(/[!@#$%^&*]/, 'validation:passwordWeak'),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'validation:fullNameInvalid'),
  shippingAddress: z.string().min(10, 'orders:address'),
});

export const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  categoryId: z.number().int().positive().optional(),
  image: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type ProductInput = z.infer<typeof productSchema>;