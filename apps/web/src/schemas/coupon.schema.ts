import { z } from "zod";

export const CouponFormSchema = z
  .object({
    name: z.string().min(1, "Nome é obrigatório"),
    type: z.enum(["PERCENT", "FIXED"]),
    percent: z.coerce.number().min(0.01, "Informe um percentual maior que 0").max(100).optional(),
    amount: z.coerce.number().min(0.01, "Informe um valor maior que 0").optional(),
    start: z.string().min(1, "Data de início é obrigatória"),
    end: z.string().min(1, "Data de término é obrigatória"),
  })
  .superRefine((values, ctx) => {
    if (values.type === "PERCENT" && (values.percent === undefined || Number.isNaN(values.percent))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Percentual é obrigatório para cupons de percentual",
        path: ["percent"],
      });
    }
    if (values.type === "FIXED" && (values.amount === undefined || Number.isNaN(values.amount))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Valor é obrigatório para cupons de valor fixo",
        path: ["amount"],
      });
    }
    if (values.start && values.end && new Date(values.end) <= new Date(values.start)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de término deve ser posterior à data de início",
        path: ["end"],
      });
    }
  });

export type CouponFormValues = z.infer<typeof CouponFormSchema>;
