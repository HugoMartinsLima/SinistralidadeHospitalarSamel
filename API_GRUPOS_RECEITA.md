# 📊 Endpoint: Grupos de Receita

## Descrição

Endpoint para buscar os grupos de receita ativos do sistema hospitalar.

---

## 🔗 URL

```
GET /api/grupos-receita
```

---

## 📥 Parâmetros

**Nenhum parâmetro é necessário** - retorna todos os grupos ativos automaticamente.

---

## 📤 Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "data": [
    { "dsGrupoReceita": "Análises Clínicas" },
    { "dsGrupoReceita": "Cirúrgico" },
    { "dsGrupoReceita": "Consultas Eletivas" },
    { "dsGrupoReceita": "Diárias de UTI's" },
    { "dsGrupoReceita": "Exames de Imagem" },
    { "dsGrupoReceita": "Oncologia" },
    { "dsGrupoReceita": "Pronto Atendimento" },
    { "dsGrupoReceita": "Terapias Clínicas" }
  ],
  "total": 8
}
```

**Campos:**
- `data`: Array de objetos contendo os grupos de receita
  - `dsGrupoReceita`: Descrição do grupo de receita
- `total`: Quantidade total de grupos retornados

---

## ❌ Resposta de Erro

**Status:** `500 Internal Server Error`

```json
{
  "error": "Erro ao buscar grupos de receita",
  "message": "Mensagem de erro detalhada"
}
```

---

## 📊 SQL Executado

```sql
SELECT DS_GRUPO_RECEITA as "dsGrupoReceita"
FROM GRUPO_RECEITA
WHERE 1=1
AND IE_SITUACAO = 'A'
ORDER BY DS_GRUPO_RECEITA ASC
```

**Observações:**
- Retorna apenas grupos **ativos** (`IE_SITUACAO = 'A'`)
- Ordenado alfabeticamente pelo nome do grupo

---

## 💻 Exemplos de Uso

### Navegador
```
https://sua-url.ngrok-free.dev/api/grupos-receita
```

### JavaScript/TypeScript
```typescript
// Buscar grupos de receita
async function buscarGruposReceita() {
  const response = await fetch('https://sua-url.ngrok-free.dev/api/grupos-receita', {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  
  const resultado = await response.json();
  console.log('Total de grupos:', resultado.total);
  console.log('Grupos:', resultado.data);
  
  return resultado.data;
}

// Usar no dropdown
buscarGruposReceita().then(grupos => {
  grupos.forEach(grupo => {
    console.log(`- ${grupo.dsGrupoReceita}`);
  });
});
```

### cURL
```bash
curl -X GET "https://sua-url.ngrok-free.dev/api/grupos-receita" \
  -H "ngrok-skip-browser-warning: true"
```

---

## 🎨 Uso no Lovable (Dropdown)

### Exemplo de Integração

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface GrupoReceita {
  dsGrupoReceita: string;
}

function FiltroGrupoReceita() {
  // Buscar grupos de receita
  const { data: grupos, isLoading } = useQuery({
    queryKey: ['/api/grupos-receita'],
    queryFn: async () => {
      const response = await fetch('https://sua-url.ngrok-free.dev/api/grupos-receita', {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const result = await response.json();
      return result.data as GrupoReceita[];
    }
  });

  if (isLoading) {
    return <div>Carregando grupos...</div>;
  }

  return (
    <Select>
      <SelectTrigger>
        <SelectValue placeholder="Selecione um grupo" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todas</SelectItem>
        {grupos?.map((grupo) => (
          <SelectItem 
            key={grupo.dsGrupoReceita} 
            value={grupo.dsGrupoReceita}
          >
            {grupo.dsGrupoReceita}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default FiltroGrupoReceita;
```

---

## 📝 Notas Técnicas

- ✅ **Read-Only**: Endpoint apenas para leitura (GET)
- ✅ **Cache**: Recomenda-se cachear os resultados (dados raramente mudam)
- ✅ **Performance**: Consulta rápida (sem JOINs complexos)
- ✅ **CORS**: Configurado para aceitar requisições do Lovable
- ✅ **Ngrok Header**: Sempre incluir `ngrok-skip-browser-warning: true`

---

## 🔄 Atualização dos Dados

Os grupos de receita são gerenciados diretamente no banco Oracle através da tabela `GRUPO_RECEITA`. 

Para adicionar/remover grupos:
1. Acessar o Oracle Database
2. Inserir/Atualizar registros na tabela `GRUPO_RECEITA`
3. Definir `IE_SITUACAO = 'A'` para grupos ativos
4. A API retornará automaticamente os novos dados

---

## 🧪 Testando o Endpoint

### 1. No Windows (CMD/PowerShell):
```bash
curl https://sua-url.ngrok-free.dev/api/grupos-receita
```

### 2. No Navegador:
Abra a URL diretamente no navegador:
```
https://sua-url.ngrok-free.dev/api/grupos-receita
```

### 3. No Postman/Insomnia:
- **Método:** GET
- **URL:** `https://sua-url.ngrok-free.dev/api/grupos-receita`
- **Header:** `ngrok-skip-browser-warning: true`

---

## ✅ Checklist de Integração

- [ ] Endpoint testado e funcionando
- [ ] CORS configurado corretamente
- [ ] Header `ngrok-skip-browser-warning` adicionado nas requisições
- [ ] Dados retornados corretamente formatados
- [ ] Dropdown no Lovable funcionando
- [ ] Tratamento de loading state implementado
- [ ] Tratamento de erros implementado

---

## 🔗 Endpoints Relacionados

- `GET /api/contratos` - Listar contratos
- `GET /api/contratos/:nrContrato` - Buscar contrato específico
- `GET /api/health` - Verificar status da API

---

## 📧 Suporte

Se encontrar problemas:
1. Verifique se o servidor está rodando (`npm run dev`)
2. Confirme que o Ngrok está ativo
3. Teste o endpoint `/api/health` primeiro
4. Verifique os logs do servidor no terminal

**Última atualização:** 07/11/2025
