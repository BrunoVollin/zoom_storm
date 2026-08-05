import { z } from "zod";

/** Mirrors products-service's CreateProductSchema/UpdateProductSchema. Price and weight
 * are entered in the form as reais/kg and converted to the backend's integer-cents /
 * gram-agnostic units by the caller before submitting. The form manages a single
 * (the default) variant inline — additional variants can be managed via the API. */
export const ProductFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  category: z.string().min(1, "Categoria é obrigatória"),
  transportHeight: z.coerce.number().int().min(0, "Altura não pode ser negativa"),
  transportWidth: z.coerce.number().int().min(0, "Largura não pode ser negativa"),
  transportLength: z.coerce.number().int().min(0, "Comprimento não pode ser negativo"),
  weight: z.coerce.number().min(0, "Peso não pode ser negativo"),
  brand: z.string().optional(),
  tags: z.string().optional(),
  thumbnail: z.string().optional(),
  discountPercentage: z.coerce.number().min(0).max(100).optional(),
  sku: z.string().min(1, "SKU é obrigatório"),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  stock: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
});

export type ProductFormValues = z.infer<typeof ProductFormSchema>;
