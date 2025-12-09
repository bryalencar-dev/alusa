import { z } from 'zod';

export const schoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  cpfCnpj: z.string(),
  status: z.string(),
  ownerUserId: z.string().nullable().optional(),
  address: z
    .object({
      street: z.string().optional(),
      number: z.string().optional(),
      district: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      cep: z.string().optional(),
    })
    .optional(),
});

export type School = z.infer<typeof schoolSchema>;

export const userProfileWithSchoolSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  telefone: z.string().nullable().optional(),
  foto: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  locale: z.string(),
  theme: z.string(),
  notifications: z.object({
    emailProduct: z.boolean(),
    emailSecurity: z.boolean(),
    emailMarketing: z.boolean(),
    whatsapp: z.boolean(),
    sms: z.boolean(),
  }),
  school: schoolSchema.nullable(),
});

export type UserProfileWithSchool = z.infer<typeof userProfileWithSchoolSchema>;
