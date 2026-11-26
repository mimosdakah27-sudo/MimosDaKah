"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { X, Check, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { 
  productFormSchema, 
  step1Schema, 
  step2Schema, 
  step4Schema, 
  step5Schema, 
  type FormDataState, 
  type ProductRow 
} from "../types/admin-types";
import { useAdminProduct } from "../hooks/use-admin-product";

// Sub-etapas
import { StepBasicInfo } from "./steps/step-basic-info";
import { StepVariants } from "./steps/step-variants";
import { StepDescriptionLogistics } from "./steps/step-description-logistics";
import { StepPricingWarranty } from "./steps/step-pricing-warranty";

interface ProductFormProps {
  product: ProductRow | null;
  onClose: () => void;
  onSaved: () => void;
}

const STEPS = [
  { id: 1, label: "Informações básicas" },
  { id: 2, label: "Variações e fotos" },
  { id: 4, label: "Descrição e logística" },
  { id: 5, label: "Preço e garantia" },
];

export function ProductForm(props: ProductFormProps) {
  const { onClose, product, onSaved } = props;
  const editorTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => { editorTitle.current?.focus(); }, []);
  const [currentStep, setCurrentStep] = useState(1);

  const { initialValues, saving, isEdit, handleSaveSubmit } = useAdminProduct(product, onSaved);

  const methods = useForm<FormDataState>({
    resolver: yupResolver(productFormSchema) as any,
    defaultValues: initialValues,
    values: initialValues,
    mode: "onSubmit",
  });

  const { handleSubmit, trigger } = methods;

  // Validação modularizada por etapa utilizando os schemas individuais do Yup
  const handleNext = async () => {
    let isValid = true;
    let currentSchema;

    if (currentStep === 1) currentSchema = step1Schema;
    else if (currentStep === 2) currentSchema = step2Schema;
    else if (currentStep === 4) currentSchema = step4Schema;
    else if (currentStep === 5) currentSchema = step5Schema;

    if (currentSchema) {
      try {
        const formData = methods.getValues();
        await currentSchema.validate(formData, { abortEarly: false });
        isValid = true;
        methods.clearErrors();
      } catch (err: any) {
        isValid = false;
        if (err.inner) {
          err.inner.forEach((error: any) => {
            if (error.path) {
              methods.setError(error.path, {
                type: "manual",
                message: error.message,
              });
            }
          });
        }
      }
    }

    // --- LOGS DE DIAGNÓSTICO ---
    console.group(`🔍 Validação da Etapa ${currentStep}`);
    console.log("O formulário passou na validação da etapa?", isValid);
    console.log("Erros atuais capturados pelo Yup/RHF:", methods.formState.errors);
    console.groupEnd();
    // ---------------------------

    if (isValid && currentStep < 5) {
      // Pula direto da etapa 2 para a 4, já que a etapa 3 antiga foi removida
      if (currentStep === 2) {
        setCurrentStep(4);
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentStep === 4) {
      setCurrentStep(2);
    } else if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const onSubmit = (data: FormDataState) => {
    handleSaveSubmit(data);
  };

  return (
    <Card className="mx-auto w-full max-w-4xl gap-0 py-0">
      <CardHeader className="border-b bg-brand-surface p-4 sm:p-6">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 ref={editorTitle} tabIndex={-1} className="text-xl font-semibold text-brand-ink outline-none">
            {isEdit ? "Editar mimo" : "Novo mimo"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-10 items-center gap-1 rounded-lg px-2 text-sm text-brand-muted hover:bg-brand-tint"
            disabled={saving}
          >
            <X className="h-4 w-4" /> Cancelar
          </button>
        </div>

        {/* Stepper Header Tabs */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STEPS.map((step) => {
            const isActive = currentStep === step.id;
            const isPassed = currentStep > step.id;

            return (
              <button
                key={step.id}
                aria-current={isActive ? "step" : undefined}
                type="button"
                onClick={async () => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  } else if (step.id > currentStep) {
                    const isValid = await trigger();
                    if (isValid) setCurrentStep(step.id);
                  }
                }}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs font-medium sm:text-sm",
                  isActive && "bg-primary text-primary-foreground border-primary",
                  isPassed && "bg-secondary/80 text-foreground border-border/80",
                  !isActive && !isPassed && "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted"
                )}
              >
                {isPassed ? <Check className="h-3 w-3 text-primary shrink-0" /> : <span>{step.id === 4 ? "3" : step.id === 5 ? "4" : step.id}.</span>}
                {step.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        <FormProvider {...methods}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            {currentStep === 1 && <StepBasicInfo />}
            {currentStep === 2 && <StepVariants />}
            {currentStep === 4 && <StepDescriptionLogistics />}
            {currentStep === 5 && <StepPricingWarranty />}

            {/* Rodapé Otimizado */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50 gap-2">
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrev}
                  className="gap-2"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Voltar
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {currentStep === 1 ? "1 / 4" : currentStep === 2 ? "2 / 4" : currentStep === 4 ? "3 / 4" : "4 / 4"}
                </span>

                {currentStep < 5 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="min-w-28"
                  >
                    Continuar <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={saving}
                    onClick={handleSubmit(onSubmit)}
                    className="min-w-28"
                  >
                    {saving ? "Salvando..." : "Salvar alterações"}
                  </Button>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
}