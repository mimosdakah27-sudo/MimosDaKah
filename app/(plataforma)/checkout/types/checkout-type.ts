import * as yup from "yup";

// types/checkout-type.ts

export interface PlaceOrderPayload {
  _items: {
    product_id: string;
    product_name: string;
    product_image: string;
    quantity: number;
    weight: number;
    width: number;
    height: number;
    length: number;
    variant_id?: string | null;
    name?: string | null;
    tamanho?: string | null;
  }[];
  _shipping_name: string;
  _shipping_address: string;
  _shipping_number?: string | null;
  _shipping_without_number?: boolean;
  _shipping_complement?: string | null;
  _shipping_reference?: string | null;
  _shipping_neighborhood?: string | null;
  _shipping_city: string;
  _shipping_state: string;
  _shipping_zip: string;
  _shipping_phone?: string | null;
  _shipping_email?: string | null;
  _shipping_document: string;
  _shipping_type?: string;           // Adicionado
  _shipping_company_name?: string;   // Adicionado
  _shipping_cost?: number;           // Adicionado
}

export interface CheckoutFormData {
  name: string;
  email: string;
  phone: string | null;
  zip: string;
  address: string;
  without_number: boolean;
  number?: string | null;
  complement?: string | null;
  reference?: string | null;
  neighborhood?: string | null;
  city: string;
  state: string;
  document: string;
}

const validateCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  let remainder;
  for (let i = 1; i <= 9; i++)
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  sum = 0;
  for (let i = 1; i <= 10; i++)
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf.substring(10, 11));
};

export const checkoutSchema: yup.ObjectSchema<CheckoutFormData> = yup.object({
  name: yup.string().required("Nome é obrigatório"),
  email: yup.string().email("E-mail inválido").required("E-mail é obrigatório"),
  phone: yup.string().nullable().defined(),
  zip: yup.string().required("CEP é obrigatório"),
  address: yup.string().required("Endereço é obrigatório"),
  
  without_number: yup.boolean().required().default(false),
  number: yup.string().when("without_number", {
    is: false,
    then: (schema) => schema.required("Número é obrigatório").nullable(),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),

  complement: yup.string().nullable().notRequired(),
  reference: yup.string().nullable().notRequired(),
  neighborhood: yup.string().nullable().notRequired(),
  city: yup.string().required("Cidade é obrigatória"),
  state: yup.string().required("UF é obrigatória"),

  document: yup
    .string()
    .required("CPF é obrigatório")
    .test("is-valid-cpf", "CPF inválido", (val) => validateCPF(val || "")),
});