import * as yup from "yup";
import type { Database } from "@/types/database";

export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];

export interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[];
}

export interface LocalProductImage {
  id: string;
  url: string;
  file?: File;
  isNewLocal?: boolean;
}

export interface VariantImageState {
  url: string;
  file?: File;
  isNew?: boolean;
}

export interface ProductVariantState {
  id?: string;
  name?: string | null;
  material?: string | null;
  is_principal: boolean;
  imagens: (string | VariantImageState)[];
}

export const step1Schema = yup.object({
  nome: yup
    .string()
    .required("O nome é obrigatório")
    .max(65, "Máximo de 65 caracteres"),
});

export const step2Schema = yup.object({
  variants: yup
    .array()
    .of(
      yup.object({
        id: yup.string().optional(),
        name: yup.string().nullable().optional(), // Deixamos opcional/nullable para abranger ambos os modos
        material: yup.string().nullable().optional(),
        is_principal: yup.boolean().required(),
        imagens: yup
          .array()
          .of(
            yup.mixed().test(
              "is-image-valid",
              "Imagem inválida",
              (value) => typeof value === "string" || (typeof value === "object" && value !== null)
            )
          )
          .min(1, "Adicione ao menos 1 foto")
          .required("Imagens obrigatórias"),
      })
    )
    .min(1, "Adicione ao menos 1 variação")
    .required("Variantes obrigatórias"),
});

export const step4Schema = yup.object({
  descricao: yup
    .string()
    .required("A descrição é obrigatória")
    .min(10, "Mínimo 10 caracteres"),

  weight: yup
    .mixed()
    .transform((_, originalValue) => {
      if (originalValue === "" || originalValue == null) return 0;
      const stringVal = String(originalValue).replace(",", ".");
      const num = Number(stringVal);
      return isNaN(num) ? 0 : num;
    })
    .test(
      "is-valid-weight",
      "Peso é obrigatório e deve ser maior que 0",
      (val) => typeof val === "number" && val > 0
    )
    .required("Peso é obrigatório"),
    
  width: yup
    .number()
    .transform((_, originalValue) => {
      if (originalValue === "" || originalValue == null) return 0;
      return Number(String(originalValue).replace(",", ".")) || 0;
    })
    .typeError("Largura inválida")
    .min(1, "Mínimo 1cm")
    .required("Largura é obrigatória"),
    
  height: yup
    .number()
    .transform((_, originalValue) => {
      if (originalValue === "" || originalValue == null) return 0;
      return Number(String(originalValue).replace(",", ".")) || 0;
    })
    .typeError("Altura inválida")
    .min(1, "Mínimo 1cm")
    .required("Altura é obrigatória"),
    
  length: yup
    .number()
    .transform((_, originalValue) => {
      if (originalValue === "" || originalValue == null) return 0;
      return Number(String(originalValue).replace(",", ".")) || 0;
    })
    .typeError("Comprimento inválido")
    .min(1, "Mínimo 1cm")
    .required("Comprimento é obrigatório"),
});

// Substitua o trecho correspondente no arquivo admin-types.ts

export const step5Schema = yup.object({
  tipo_venda: yup
    .string()
    .oneOf(["normal", "orcamento", "whatsapp_finalizacao"])
    .default("normal")
    .required("Tipo de venda obrigatório"),

  preco: yup
    .number()
    .transform((value, originalValue) => (originalValue === "" ? 0 : value))
    .typeError("Preço inválido")
    .when("tipo_venda", {
      is: (val: string) => val === "orcamento",
      then: (schema) => schema.min(0).nullable().optional().default(0),
      otherwise: (schema) => schema.min(0.01, "O preço deve ser maior que 0").required("O preço é obrigatório"),
    }),

  preco_promocional: yup
    .number()
    .transform((_, originalValue) =>
      originalValue === "" || originalValue == null ? null : Number(originalValue),
    )
    .typeError("Preço promocional inválido")
    .min(0, "O preço promocional deve ser maior ou igual a 0")
    .nullable()
    .optional(),

  permite_retirada: yup.boolean().default(false),
  destaque: yup.boolean().default(false),
  ativo: yup.boolean().default(true),
  
  garantia_tipo: yup
    .string()
    .oneOf(["vendedor", "fabrica", "nenhuma"])
    .default("vendedor")
    .required("Tipo de garantia obrigatório"),
    
  garantia_dias: yup
    .number()
    .transform((_, originalValue) =>
      originalValue === "" || originalValue == null ? 0 : Number(originalValue),
    )
    .nullable()
    .default(0),
});

export const productFormSchema = yup.object({
  ...step1Schema.fields,
  videos: yup.array().of(yup.mixed<File | string>().defined()).default([]),
  ...step2Schema.fields,
  ...step4Schema.fields,
  ...step5Schema.fields,
  imagem_url: yup.string().optional().default(""),
});

export type FormDataState = yup.InferType<typeof productFormSchema>;