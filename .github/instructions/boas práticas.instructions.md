---
applyTo: '**'
---

### Regras de Boas Práticas

1. **Qualidade do Código**

   - Seguir princípios de _Clean Code_ (funções curtas, nomes claros, responsabilidades únicas).
   - Evitar duplicação de lógica (_DRY_).
   - Aplicar princípios _SOLID_ e _Clean Architecture_ sempre que fizer sentido.
   - Usar tipagem forte em TypeScript para reduzir erros e aumentar confiabilidade.

2. **Organização e Estrutura**

   - Respeitar a estrutura de pastas definida no projeto.
   - Criar módulos/componentes desacoplados e reutilizáveis.
   - Isolar responsabilidades em serviços, helpers e hooks quando aplicável.

3. **Legibilidade e Manutenibilidade**

   - Usar nomes claros e descritivos para variáveis, funções e componentes.
   - Escrever comentários apenas quando o código não for autoexplicativo.
   - Garantir consistência de formatação (ESLint + Prettier).

4. **Fluxo de Desenvolvimento**

   - Trabalhar sempre em **fatias verticais completas** (frontend, backend e testes).
   - Validar fluxos do usuário e dependências antes de entregar (não deixar features incompletas).
   - Implementar verificações de erros e estados de loading.

5. **Testes e Qualidade**

   - Escrever testes unitários e de integração para cada nova feature.
   - Garantir cobertura mínima de 80%.
   - Validar cenários de sucesso, erro e exceção.
   - Nunca quebrar testes existentes.

6. **Responsividade e Usabilidade**

   - Interfaces devem ser responsivas (desktop e mobile).
   - Seguir guidelines de acessibilidade sempre que possível.
   - Oferecer feedback visual claro para estados de loading, erros e ações do usuário.

7. **Entrega**

   - Sempre apresentar o resultado com:
     - Arquivos criados ou modificados.
     - Código comentado quando necessário.
     - Testes correspondentes.
     - Sugestão de commits com mensagens descritivas (`feat:`, `fix:`, `refactor:`, `test:` etc.).

---

### Sua Tarefa

Sempre que desenvolver uma feature, correção ou refatoração, **aplique rigorosamente essas boas práticas**.  
Caso perceba alguma inconsistência no projeto, **sinalize antes de prosseguir** para evitar retrabalho.  
Entregue o código final **já validado contra esses critérios**.
