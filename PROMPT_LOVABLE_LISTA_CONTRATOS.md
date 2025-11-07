# 🚀 Prompt para Lovable - Tela de Lista de Contratos

Cole este prompt completo no Lovable:

---

## PROMPT PARA COPIAR E COLAR:

```
Crie uma tela de listagem de contratos com as seguintes especificações:

## Dados da API

Conectar à API REST:
- URL base: https://unhalted-tanja-unvinous.ngrok-free.dev
- Endpoint: GET /api/contratos
- IMPORTANTE: Adicionar header 'ngrok-skip-browser-warning': 'true' em todas as requisições

## Estrutura dos Dados

A API retorna:
```json
{
  "data": [
    {
      "nrContrato": 1270,
      "cdCgcEstipulante": "04347163000148",
      "dsEstipulante": "MOTO HONDA DA AMAZONIA LTDA"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150
  }
}
```

## Interface Desejada

1. **Campo de Busca no Topo:**
   - Placeholder: "Buscar empresa..."
   - Busca em tempo real (debounce de 300ms)
   - Pesquisa por número do contrato OU nome da empresa
   - Ícone de lupa dentro do campo

2. **Lista de Contratos:**
   - Mostrar todos os contratos em uma lista ou tabela
   - Colunas:
     - Número do Contrato (nrContrato)
     - Nome da Empresa (dsEstipulante)
   - Ordenar alfabeticamente por nome da empresa
   - Design limpo e moderno
   - Efeito hover nos itens da lista

3. **Estados da Interface:**
   - Loading: Mostrar skeleton/spinner enquanto carrega
   - Vazio: "Nenhum contrato encontrado" quando não há resultados
   - Erro: Mensagem amigável se a API falhar

4. **Funcionalidades:**
   - Ao digitar no campo de busca, enviar query parameter ?search=texto para a API
   - A API já faz o filtro no backend (não precisa filtrar no frontend)
   - Exemplo de URL: https://unhalted-tanja-unvinous.ngrok-free.dev/api/contratos?search=honda

## Exemplo de Código React (estrutura básica):

```typescript
const [searchTerm, setSearchTerm] = useState('');

// Query com React Query
const { data, isLoading, error } = useQuery({
  queryKey: ['/api/contratos', searchTerm],
  queryFn: async () => {
    const url = searchTerm 
      ? `https://unhalted-tanja-unvinous.ngrok-free.dev/api/contratos?search=${searchTerm}`
      : 'https://unhalted-tanja-unvinous.ngrok-free.dev/api/contratos';
    
    const response = await fetch(url, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (!response.ok) throw new Error('Erro ao buscar contratos');
    return response.json();
  }
});
```

## Design

- Use componentes shadcn/ui (Input, Card, Table ou List)
- Cores: Tema moderno e profissional
- Responsivo: Funcionar bem em desktop e mobile
- Acessibilidade: Labels corretos, navegação por teclado

## Comportamento da Busca

- Quando o usuário digitar, fazer debounce de 300ms antes de chamar a API
- Limpar a busca deve mostrar todos os contratos novamente
- Se não encontrar resultados, mostrar mensagem "Nenhuma empresa encontrada para '{termo buscado}'"

Implemente essa tela completa com boa experiência de usuário.
```

---

## 📋 CHECKLIST ANTES DE ENVIAR AO LOVABLE:

- [ ] Verifique se sua URL do Ngrok está correta e ativa
- [ ] Teste o endpoint no navegador: https://unhalted-tanja-unvinous.ngrok-free.dev/api/contratos
- [ ] Confirme que `npm run dev` está rodando no Windows
- [ ] Confirme que o Ngrok está rodando e apontando para localhost:5000

---

## 🎨 CUSTOMIZAÇÕES OPCIONAIS:

Se quiser adicionar mais funcionalidades, peça ao Lovable:

### Paginação:
```
Adicione paginação à lista:
- Botões "Anterior" e "Próximo"
- Mostrar "Exibindo X de Y contratos"
- Usar os parâmetros ?limit=20&offset=0
```

### Filtro por CGC/CNPJ:
```
Adicione um filtro adicional para buscar por CNPJ (cdCgcEstipulante)
```

### Exportar para Excel:
```
Adicione um botão para exportar a lista para Excel/CSV
```

### Detalhes do Contrato:
```
Ao clicar em um contrato, mostrar detalhes em um modal ou página separada
Usar o endpoint: GET /api/contratos/:nrContrato
```

---

## 🔧 TROUBLESHOOTING:

### Se a API não conectar:

1. **Erro de CORS:**
   - Certifique-se de adicionar o header: `'ngrok-skip-browser-warning': 'true'`

2. **URL do Ngrok expirou:**
   - Ngrok muda a URL toda vez que reinicia
   - Atualize a URL no código do Lovable

3. **API não responde:**
   - Verifique se `npm run dev` está rodando
   - Verifique se Ngrok está ativo
   - Teste direto no navegador primeiro

---

## 📱 EXEMPLO VISUAL DO RESULTADO ESPERADO:

```
┌─────────────────────────────────────────────┐
│  Contratos                                  │
├─────────────────────────────────────────────┤
│  🔍 [Buscar empresa...]                     │
├─────────────────────────────────────────────┤
│                                             │
│  Nº Contrato    Nome da Empresa            │
│  ──────────────────────────────────────────│
│  1270           MOTO HONDA DA AMAZONIA     │
│  2444           2E DESPACHOS ADUANEIROS    │
│  3501           EMPRESA TESTE LTDA         │
│  ...                                        │
│                                             │
└─────────────────────────────────────────────┘
```

---

## ✅ RESULTADO FINAL:

Após implementar, você terá:
- ✅ Lista completa de contratos do Oracle
- ✅ Busca em tempo real por número ou nome
- ✅ Interface moderna e responsiva
- ✅ Carregamento e tratamento de erros
- ✅ Integração perfeita com sua API
