"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { IntegrationCard } from "./components/IntegrationCard";
import { useAsaasCredentials } from "./asaas/hooks/useAsaasCredentials";

export function IntegracoesFeature() {
  const router = useRouter();
  const { data, loading } = useAsaasCredentials();
  const [isNavigating, setIsNavigating] = useState(false);
  const navigateTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (navigateTimeout.current) {
        clearTimeout(navigateTimeout.current);
      }
    };
  }, []);

  const asaasStatus = useMemo(() => {
    if (loading) return { label: "Verificando…", variant: "default" as const };
    if (data.maskedToken) {
      return { label: "Sincronizado", variant: "success" as const };
    }
    return {
      label: "Configuração pendente",
      variant: "warning" as const,
      helper: "Informe o token para ativar.",
    };
  }, [data.maskedToken, loading]);

  const handleNavigate = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);
    navigateTimeout.current = setTimeout(() => {
      router.push("/admin/configuracoes/integracoes/asaas");
    }, 180);
  }, [isNavigating, router]);

  return (
    <motion.section
      className="space-y-4"
      animate={isNavigating ? { opacity: 0, y: -8, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
    >
      <IntegrationCard
        title="Plataforma de pagamento Asaas"
        description="Sincronize tokens e webhooks para manter cobranças e notificações alinhadas."
        icon={
          <Image
            src="/asaas/asaas-icon.png"
            alt="Asaas"
            width={48}
            height={48}
            className="h-12 w-12 object-cover"
            priority
          />
        }
        status={asaasStatus}
        onClick={handleNavigate}
      />
      {/* Espaço reservado para futuras integrações */}
    </motion.section>
  );
}

export default IntegracoesFeature;
