export type CheckoutCustomerDraft = {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
};

export type CheckoutAddressDraft = {
  zip_code: string;
  street: string;
  number: string;
  without_number: boolean;
  complement: string;
  reference: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type CheckoutDraft = {
  version: 1;

  step: "customer" | "address" | "shipping" | "review";

  customerData: CheckoutCustomerDraft;

  addressData: CheckoutAddressDraft;

  /**
   * Quando true, significa que o endereço digitado
   * antes do login deve ser salvo em user_addresses
   * depois que o usuário estiver autenticado.
   */
  saveAddressAfterLogin: boolean;
};

const STORAGE_KEY = "checkout_draft";

const CURRENT_VERSION = 1;

/**
 * Retorna um objeto vazio válido para os dados do cliente.
 */
export function createEmptyCustomerDraft(): CheckoutCustomerDraft {
  return {
    id: "",
    name: "",
    phone: "",
    email: "",
    document: "",
  };
}

/**
 * Retorna um objeto vazio válido para o endereço.
 */
export function createEmptyAddressDraft(): CheckoutAddressDraft {
  return {
    zip_code: "",
    street: "",
    number: "",
    without_number: false,
    complement: "",
    reference: "",
    neighborhood: "",
    city: "",
    state: "",
  };
}

/**
 * Cria um checkout draft completo.
 *
 * Isso evita salvar objetos incompletos no sessionStorage.
 */
export function createCheckoutDraft(
  data?: Partial<CheckoutDraft>,
): CheckoutDraft {
  return {
    version: CURRENT_VERSION,

    step: data?.step || "customer",

    customerData: {
      ...createEmptyCustomerDraft(),
      ...(data?.customerData || {}),
    },

    addressData: {
      ...createEmptyAddressDraft(),
      ...(data?.addressData || {}),
    },

    saveAddressAfterLogin:
      Boolean(data?.saveAddressAfterLogin),
  };
}

/**
 * Salva o estado atual do checkout.
 */
export function saveCheckoutDraft(
  draft: Partial<CheckoutDraft>,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const normalizedDraft = createCheckoutDraft(draft);

    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(normalizedDraft),
    );
  } catch (error) {
    console.error(
      "[CHECKOUT DRAFT] Erro ao salvar rascunho:",
      error,
    );
  }
}

/**
 * Recupera o checkout salvo.
 */
export function getCheckoutDraft(): CheckoutDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    /**
     * Compatibilidade com versões antigas
     * do draft que não possuíam version.
     */
    const draft = createCheckoutDraft({
      ...parsed,

      version: CURRENT_VERSION,

      step:
        parsed.step === "customer" ||
        parsed.step === "address" ||
        parsed.step === "shipping" ||
        parsed.step === "review"
          ? parsed.step
          : "customer",

      customerData: {
        ...createEmptyCustomerDraft(),
        ...(parsed.customerData || {}),
      },

      addressData: {
        ...createEmptyAddressDraft(),
        ...(parsed.addressData || {}),
      },

      saveAddressAfterLogin:
        Boolean(parsed.saveAddressAfterLogin),
    });

    return draft;
  } catch (error) {
    console.error(
      "[CHECKOUT DRAFT] Erro ao recuperar rascunho:",
      error,
    );

    /**
     * Se o conteúdo estiver corrompido,
     * removemos para não deixar o checkout
     * preso em um estado inválido.
     */
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora erro de limpeza.
    }

    return null;
  }
}

/**
 * Atualiza somente os campos informados,
 * preservando todo o restante do checkout.
 */
export function updateCheckoutDraft(
  updates: Partial<CheckoutDraft>,
) {
  if (typeof window === "undefined") {
    return;
  }

  const current = getCheckoutDraft();

  const updatedDraft = createCheckoutDraft({
    ...(current || {}),
    ...updates,

    customerData: {
      ...createEmptyCustomerDraft(),
      ...(current?.customerData || {}),
      ...(updates.customerData || {}),
    },

    addressData: {
      ...createEmptyAddressDraft(),
      ...(current?.addressData || {}),
      ...(updates.addressData || {}),
    },
  });

  saveCheckoutDraft(updatedDraft);
}

/**
 * Atualiza os dados do cliente sem apagar
 * os dados do endereço.
 */
export function updateCheckoutCustomerDraft(
  customerData: Partial<CheckoutCustomerDraft>,
) {
  const current = getCheckoutDraft();

  saveCheckoutDraft({
    ...(current || {}),

    customerData: {
      ...createEmptyCustomerDraft(),
      ...(current?.customerData || {}),
      ...customerData,
    },
  });
}

/**
 * Atualiza os dados do endereço sem apagar
 * os dados do cliente.
 */
export function updateCheckoutAddressDraft(
  addressData: Partial<CheckoutAddressDraft>,
) {
  const current = getCheckoutDraft();

  saveCheckoutDraft({
    ...(current || {}),

    addressData: {
      ...createEmptyAddressDraft(),
      ...(current?.addressData || {}),
      ...addressData,
    },
  });
}

/**
 * Remove completamente o checkout temporário.
 *
 * Deve ser chamado somente depois que o pedido
 * foi criado com sucesso.
 */
export function clearCheckoutDraft() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error(
      "[CHECKOUT DRAFT] Erro ao limpar rascunho:",
      error,
    );
  }
}