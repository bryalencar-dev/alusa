-- CreateIndex
CREATE INDEX "Billing_status_idx" ON "Billing"("status");

-- CreateIndex
CREATE INDEX "Billing_dueDate_idx" ON "Billing"("dueDate");

-- CreateIndex
CREATE INDEX "Evento_status_idx" ON "Evento"("status");

-- CreateIndex
CREATE INDEX "InscricaoEvento_status_idx" ON "InscricaoEvento"("status");

-- CreateIndex
CREATE INDEX "Matricula_status_idx" ON "Matricula"("status");

-- CreateIndex
CREATE INDEX "Matricula_createdAt_idx" ON "Matricula"("createdAt");

-- CreateIndex
CREATE INDEX "Presenca_status_idx" ON "Presenca"("status");
