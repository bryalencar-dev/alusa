# CustomScrollArea

Componente reutilizável de área de scroll com barra de rolagem personalizada.

## Características

- **Barra de rolagem cinza clara** (#d1d5db)
- **Sem setas** - Barra minimalista sem botões de navegação
- **Hover suave** - Fica um pouco mais escura ao passar o mouse
- **Track transparente** - Fundo da área de rolagem é transparente
- **Compatível com Firefox e Chrome/Edge/Safari**

## Uso

```tsx
import { CustomScrollArea } from '@/components/ui/custom-scroll-area';

export default function MyPage() {
  return (
    <CustomScrollArea className="h-screen">
      {/* Seu conteúdo aqui */}
      <div>Conteúdo que vai rolar...</div>
    </CustomScrollArea>
  );
}
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `children` | `React.ReactNode` | - | Conteúdo a ser exibido com scroll |
| `className` | `string` | `''` | Classes CSS adicionais |
| `style` | `React.CSSProperties` | - | Estilos inline opcionais |

## Exemplo com classes Tailwind

```tsx
<CustomScrollArea className="h-full max-h-screen p-4">
  {/* Conteúdo */}
</CustomScrollArea>
```

## Estilos aplicados

- **Largura da barra**: 8px
- **Cor da barra**: #d1d5db (gray-300)
- **Cor no hover**: #9ca3af (gray-400)
- **Borda arredondada**: 4px
- **Sem setas**: Botões removidos completamente












