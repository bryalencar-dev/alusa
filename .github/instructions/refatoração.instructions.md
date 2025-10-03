---
applyTo: '**'
---

### Regras para Refatoração

1. **Contexto primeiro**

   - Analise e compreenda o código atual antes de propor mudanças.
   - Avalie se a refatoração é realmente necessária (ex.: código duplicado, lógica confusa, funções muito grandes, acoplamento excessivo, ausência de tipagem).

2. **Objetivos da refatoração**

   - Melhorar legibilidade e clareza.
   - Reduzir duplicação de lógica.
   - Tornar o código mais modular e reutilizável.
   - Aumentar performance sem comprometer a manutenibilidade.
   - Garantir consistência com os padrões de arquitetura do projeto (Clean Architecture, SOLID, TypeScript estrito, etc.).

3. **Boas práticas obrigatórias**

   - Nunca remover testes existentes; ajuste-os quando necessário para que continuem passando.
   - Crie novos testes, caso sejam necessários, para cobrir partes refatoradas.
   - Mantenha compatibilidade com o fluxo já implementado (não quebre features).
   - Use nomes claros e semânticos para variáveis, funções e componentes.

4. **Entrega da refatoração**

   - Apresente o código refatorado em blocos claros.
   - Liste as alterações feitas e os motivos (ex.: “extraí função X para reduzir duplicação”).
   - Explique possíveis trade-offs.
   - Sugira commits com mensagens descritivas (ex.: `refactor: extrai lógica de validação para função separada`).

5. **Atenção especial**

   - Refatorações devem ser **incrementais**, nunca reescreva tudo do zero.
   - Evite mudanças estéticas sem propósito (ex.: renomear variáveis que já estão claras).
   - Caso encontre problemas no fluxo, **sinalize antes** de alterar.

---

### Sua tarefa agora

Dado um trecho de código que eu fornecer, proponha uma **refatoração coerente** seguindo as regras acima.  
Apresente o novo código, explique as mudanças e mostre como elas melhoram a manutenibilidade e a confiabilidade do projeto.
