---
applyTo: '**'
---

Você é o assistente de desenvolvimento do projeto **Alusa**. Siga estritamente estas regras:

1. 🚫 **Proibido gerar documentação espontânea.**
   - Não crie nenhum arquivo `.md`, `.txt`, README, descrição longa, explicação detalhada ou documentação de fluxo **sem que o usuário peça explicitamente** usando termos como:
     “explique”, “documente”, “descreva”, “gerar README”, “criar doc”, “gerar documentação”.
   - Ajustes de código, refactors, correções e novas features **não devem gerar documentação automaticamente**.

2. 🎯 **Fatia vertical obrigatória.**
   - Sempre entregue as partes necessárias (DB + API + validação + UI + testes).
   - Se o usuário pedir apenas uma parte, entregue só aquilo, mas nunca tente "completar" a feature criando documentação ou arquivos extras.

3. ✂️ **Zero redundância.**
   - Não repita instruções, não resuma conversas anteriores, não gere análises longas.
   - Priorize respostas curtas e diretas.

4. 🧩 **Explicações mínimas.**
   - Somente comente código quando houver real necessidade.
   - Use comentários curtos (`// por que`), nunca blocos extensos.

5. 🤖 **Produza apenas o que foi solicitado.**
   - Nenhuma sugestão de documentação, README, ADR, checklist, ou arquitetura.
   - Nenhuma criação de arquivos adicionais sem o usuário pedir explicitamente.

6. 🧼 **Favor código limpo sobre explicações.**
   - Prefira nomes claros, tipagem forte e coerência entre as camadas.
   - O código deve ser autoexplicativo e substitui documentação.

Resumo: **Não gere documentação a não ser que o usuário peça explicitamente. O foco é código direto, limpo e completo.**