import { expect, Page } from "@playwright/test";

// Helper de login centralizado para os testes E2E.
export async function login(page: Page, email = "aluno@example.com", password = "senha123") {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: /Entrar/i }).click();

  // Aguarda sessão NextAuth ficar disponível
  await expect
    .poll(async () => {
      const res = await page.request.get("/api/auth/session", { failOnStatusCode: false });
      if (!res.ok()) return false;
      const json = await res.json().catch(() => ({}));
      return Boolean(json?.user);
    }, { timeout: 15000, intervals: [250, 500, 750, 1000] })
    .toBe(true);

  // Vai manualmente ao /portal e valida cabeçalho único por data-testid
  await page.goto("/portal");
  await expect(page.getByTestId("portal-header")).toBeVisible({ timeout: 10000 });
}
