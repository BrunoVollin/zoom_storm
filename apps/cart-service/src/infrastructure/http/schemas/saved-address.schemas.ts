import { z } from 'zod';

const savedAddressFields = {
  label: z.string().trim().min(1),
  recipient: z.string().trim().min(1),
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  complement: z.string().trim().min(1).optional().nullable(),
  neighborhood: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  zip: z.string().trim().min(1),
};

export const AddSavedAddressSchema = z
  .object({ ...savedAddressFields, isDefault: z.boolean().optional() })
  .strict();

export const UpdateSavedAddressSchema = z.object(savedAddressFields).strict();
