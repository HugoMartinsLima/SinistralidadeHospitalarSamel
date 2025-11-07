# 🎯 PROMPT PARA LOVABLE - Dropdown de Grupos de Receita

## Cole este prompt no Lovable:

---

Preciso que o dropdown "Todas" (que está na tela) busque os dados da API em vez de usar dados fixos.

**API Endpoint:**
```
GET https://unhalted-tanja-unvinous.ngrok-free.dev/api/grupos-receita
```

**Resposta da API:**
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

**Requisitos:**
1. Fazer fetch da API quando o componente carregar
2. Sempre incluir header: `'ngrok-skip-browser-warning': 'true'`
3. Manter a opção "Todas" como primeira opção do dropdown
4. Popular as demais opções com os dados vindos de `data[].dsGrupoReceita`
5. Mostrar estado de loading enquanto carrega
6. Tratar erros caso a API falhe

**Exemplo de código:**
```typescript
const { data: grupos, isLoading } = useQuery({
  queryKey: ['/api/grupos-receita'],
  queryFn: async () => {
    const response = await fetch('https://unhalted-tanja-unvinous.ngrok-free.dev/api/grupos-receita', {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const result = await response.json();
    return result.data;
  }
});
```

**Estrutura do Select:**
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Todas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todas">Todas</SelectItem>
    {grupos?.map((grupo: { dsGrupoReceita: string }) => (
      <SelectItem key={grupo.dsGrupoReceita} value={grupo.dsGrupoReceita}>
        {grupo.dsGrupoReceita}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

Mantenha o design e estilo do dropdown igual está agora, apenas substitua os dados fixos pelos dados dinâmicos da API.

---

## 📝 Notas Adicionais

- A URL da API pode mudar quando o Ngrok reiniciar
- URL atual: `https://unhalted-tanja-unvinous.ngrok-free.dev`
- Sempre verificar se o header `ngrok-skip-browser-warning` está presente
- Os dados são retornados já ordenados alfabeticamente

---

## ✅ Checklist de Implementação

Após implementar, verificar:
- [ ] Dropdown mostra "Todas" como primeira opção
- [ ] Dropdown mostra os grupos vindos da API
- [ ] Loading state funciona
- [ ] Não há erros no console
- [ ] Dados aparecem corretamente
- [ ] Seleção de um grupo funciona normalmente

---

## 🧪 Testando a API Primeiro

Antes de integrar, teste a API diretamente no navegador:
```
https://unhalted-tanja-unvinous.ngrok-free.dev/api/grupos-receita
```

Deve retornar JSON com os grupos de receita.

Se não funcionar:
1. Verifique se o servidor está rodando no Windows
2. Verifique se o Ngrok está ativo
3. Verifique a URL correta do Ngrok

---

## 📊 Dados Retornados (Referência)

Campos da resposta:
- `data`: Array de grupos
  - `dsGrupoReceita`: Nome do grupo (string)
- `total`: Quantidade total de grupos (number)

Exemplo completo:
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
