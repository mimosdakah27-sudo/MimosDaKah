export interface CustomerOption {
  user_id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface ProductOption {
  id: string;
  nome: string;
  preco: number | null;
  imagem_url: string | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
}

export interface CreateQuotePayload {
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productId: string;
  productName: string;
  productImage?: string;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  price: number; // Preço unitário
  quantity: number; // <--- NOVO
  observation?: string;
}