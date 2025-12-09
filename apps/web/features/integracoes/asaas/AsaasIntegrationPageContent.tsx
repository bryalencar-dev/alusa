"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AsaasIntegrationPanel } from "./AsaasIntegrationPanel";

export function AsaasIntegrationPageContent() {
  return (
    <motion.div
      className="space-y-6 rounded-lg bg-white p-6 md:p-8 shadow-sm"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="space-y-1">
        <Link
          href="/admin/configuracoes/integracoes"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-accent"
        >
          <ChevronLeftIcon className="h-4 w-4" /> Voltar para integrações
        </Link>
        <h2 className="text-xl md:text-2xl font-medium tracking-tight text-gray-900">
          Integração Asaas
        </h2>
        <p className="text-sm text-gray-600">
          Conecte sua conta Asaas para liberar cobranças automáticas, webhooks e notificações financeiras sem retrabalho.
        </p>
      </div>
      <div className="space-y-4">
        <AsaasIntegrationPanel />
        <Card className="rounded-2xl border border-gray-200 shadow-sm">
          <CardHeader className="px-6 pt-6 pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">Como gerar o token no Asaas</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Siga o passo a passo oficial para criar uma credencial de API antes de salvar aqui na plataforma.
                </CardDescription>
              </div>
              <Link
                href="https://www.youtube.com/watch?v=tULtfD8vEfg&list=PLr_JZjqvZaCertyYdDGzgGLMkhMUtqnMY"
                target="_blank"
                className="text-xs font-semibold text-brand-accent underline"
              >
                Abrir no YouTube
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-black shadow-inner">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  title="Tutorial - Token API Asaas"
                  src="https://www.youtube.com/embed/tULtfD8vEfg"
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
