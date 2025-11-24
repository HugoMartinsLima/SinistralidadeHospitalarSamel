# 🎯 PROMPT PARA LOVABLE - Dropdown de Empresas/Contratos

## Cole este prompt no Lovable:

---

Preciso que o dropdown "Todas as Empresas" busque os dados da API em vez de usar dados fixos.

**API Endpoint:**
```
GET https://sua-url.ngrok-free.dev/api/contratos
```

**Parâmetros de Query Opcionais:**
- `limit`: Número máximo de resultados (padrão: 50)
- `offset`: Paginação - quantos registros pular (padrão: 0)
- `search`: Buscar por número de contrato ou razão social

**Resposta da API:**
```json
{
  "data": [
    {
      "nrContrato": 2455,
      "cdCgcEstipulante": "12345678000190",
      "dsEstipulante": "ACME CORPORATION LTDA",
      "cdClassifContrato": 1,
      "dsClassificacao": "Ativo"
    },
    {
      "nrContrato": 3501,
      "cdCgcEstipulante": "98765432000110",
      "dsEstipulante": "EMPRESA TESTE LTDA",
      "cdClassifContrato": 2,
      "dsClassificacao": "Inativo"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150
  }
}
```

**Campos importantes:**
- `nrContrato`: Número do contrato (use como value no Select)
- `dsEstipulante`: Razão social da empresa (mostre no dropdown)
- `cdClassifContrato`: Código de classificação do contrato
- `dsClassificacao`: Descrição da classificação

---

## Requisitos:

1. ✅ Fazer fetch da API quando o componente carregar
2. ✅ Sempre incluir header: `'ngrok-skip-browser-warning': 'true'`
3. ✅ Manter a opção "Todas as Empresas" como primeira opção do dropdown
4. ✅ Popular as demais opções com os dados vindos de `data[].dsEstipulante`
5. ✅ Usar `data[].nrContrato` como valor do SelectItem
6. ✅ Implementar busca em tempo real usando o parâmetro `search`
7. ✅ Mostrar estado de loading enquanto carrega
8. ✅ Tratar erros caso a API falhe
9. ✅ Implementar paginação infinita ou carregar todas as empresas (limit=1000)

---

## Exemplo de Código:

### 1. Hook de Query com Busca

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

const [searchTerm, setSearchTerm] = useState("");

const { data: empresasData, isLoading, isError } = useQuery({
  queryKey: ['/api/contratos', searchTerm],
  queryFn: async () => {
    const params = new URLSearchParams({
      limit: '1000', // Carregar muitas empresas
      offset: '0'
    });
    
    if (searchTerm) {
      params.append('search', searchTerm);
    }
    
    const response = await fetch(
      `https://sua-url.ngrok-free.dev/api/contratos?${params}`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Erro ao buscar empresas');
    }
    
    const result = await response.json();
    return result.data; // Retorna apenas o array de empresas
  },
  staleTime: 5 * 60 * 1000, // Cache de 5 minutos
});
```

### 2. Componente Select com Busca

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

<div className="space-y-2">
  {/* Select Principal */}
  <Select 
    value={selectedEmpresa} 
    onValueChange={setSelectedEmpresa}
  >
    <SelectTrigger data-testid="select-empresa">
      <SelectValue placeholder="Todas as Empresas" />
    </SelectTrigger>
    <SelectContent>
      {/* Input de busca dentro do dropdown */}
      <div className="p-2 sticky top-0 bg-background border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="input-search-empresa"
            placeholder="Buscar empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
            onClick={(e) => e.stopPropagation()} // Previne fechar dropdown
          />
        </div>
      </div>

      {/* Opção "Todas" */}
      <SelectItem value="todas" data-testid="select-item-todas">
        Todas as Empresas
      </SelectItem>

      {/* Loading */}
      {isLoading && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Carregando empresas...
        </div>
      )}

      {/* Erro */}
      {isError && (
        <div className="p-4 text-center text-sm text-destructive">
          Erro ao carregar empresas
        </div>
      )}

      {/* Lista de Empresas */}
      {!isLoading && !isError && empresasData?.length === 0 && (
        <div className="p-4 text-center text-sm text-muted-foreground">
          Nenhuma empresa encontrada.
        </div>
      )}

      {!isLoading && !isError && empresasData?.map((empresa: any) => (
        <SelectItem 
          key={empresa.nrContrato} 
          value={String(empresa.nrContrato)}
          data-testid={`select-item-empresa-${empresa.nrContrato}`}
        >
          {empresa.dsEstipulante}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

### 3. Versão Simplificada (Sem Busca)

Se não precisar de busca em tempo real, use esta versão mais simples:

```tsx
const { data: empresas, isLoading } = useQuery({
  queryKey: ['/api/contratos'],
  queryFn: async () => {
    const response = await fetch(
      'https://sua-url.ngrok-free.dev/api/contratos?limit=1000',
      {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );
    const result = await response.json();
    return result.data;
  }
});

<Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
  <SelectTrigger>
    <SelectValue placeholder="Todas as Empresas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todas">Todas as Empresas</SelectItem>
    
    {isLoading ? (
      <div className="p-4 text-center">Carregando...</div>
    ) : (
      empresas?.map((empresa: any) => (
        <SelectItem 
          key={empresa.nrContrato} 
          value={String(empresa.nrContrato)}
        >
          {empresa.dsEstipulante}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>
```

---

## 📝 Notas Importantes

1. **URL da API**: Substitua `https://sua-url.ngrok-free.dev` pela URL atual do Ngrok
2. **Header obrigatório**: Sempre incluir `'ngrok-skip-browser-warning': 'true'`
3. **Valor do Select**: Use `String(empresa.nrContrato)` pois SelectItem espera string
4. **Ordenação**: A API já retorna ordenado por razão social (dsEstipulante)
5. **Busca**: O parâmetro `search` busca tanto por número de contrato quanto por razão social
6. **Performance**: Com `limit=1000`, carrega até 1000 empresas de uma vez
7. **Cache**: `staleTime` de 5 minutos evita requisições desnecessárias

---

## ✅ Checklist de Implementação

Após implementar, verificar:

- [ ] Dropdown mostra "Todas as Empresas" como primeira opção
- [ ] Empresas são carregadas da API corretamente
- [ ] Razão social aparece no dropdown
- [ ] Ao selecionar, o valor é o número do contrato
- [ ] Busca filtra empresas corretamente (se implementada)
- [ ] Loading state aparece durante carregamento
- [ ] Mensagem de erro aparece se API falhar
- [ ] "Nenhuma empresa encontrada" aparece quando busca não retorna resultados
- [ ] Header ngrok está presente em todas as requisições
- [ ] Dropdown mantém design e estilo do projeto

---

## 🔧 Troubleshooting

**Problema**: "Nenhuma empresa encontrada"
- ✅ Verificar se API está respondendo
- ✅ Verificar header `ngrok-skip-browser-warning`
- ✅ Verificar console do navegador para erros de CORS
- ✅ Testar URL diretamente no navegador

**Problema**: Empresas não aparecem
- ✅ Verificar estrutura de resposta: `result.data` (não `result` diretamente)
- ✅ Verificar se `empresasData` está definido antes de fazer `.map()`
- ✅ Adicionar `console.log(empresasData)` para debug

**Problema**: Busca não funciona
- ✅ Verificar se `searchTerm` está no `queryKey` do useQuery
- ✅ Verificar se parâmetro `search` está sendo enviado corretamente
- ✅ Debounce pode ajudar: `useDebouncedValue(searchTerm, 300)`

---

## 🎨 Customização Adicional

### Mostrar número do contrato junto com razão social:

```tsx
<SelectItem value={String(empresa.nrContrato)}>
  {empresa.nrContrato} - {empresa.dsEstipulante}
</SelectItem>
```

### Mostrar classificação:

```tsx
<SelectItem value={String(empresa.nrContrato)}>
  <div className="flex flex-col">
    <span>{empresa.dsEstipulante}</span>
    <span className="text-xs text-muted-foreground">
      {empresa.dsClassificacao}
    </span>
  </div>
</SelectItem>
```

### Filtrar apenas contratos ativos no frontend:

```tsx
const empresasAtivas = empresasData?.filter(
  (emp: any) => emp.cdClassifContrato !== 3
);
```

---

Mantenha o design e estilo do dropdown igual está agora, apenas substitua os dados fixos pelos dados dinâmicos da API.
