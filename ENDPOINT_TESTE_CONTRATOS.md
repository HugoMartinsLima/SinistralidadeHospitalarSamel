# 🧪 Endpoint de Teste - Contratos (Sem Oracle)

Use este código temporariamente para testar se o problema é o Oracle ou o Ngrok.

---

## 📝 ADICIONAR NO server/routes.ts

Adicione esta rota ANTES da rota original de contratos:

```typescript
// ============================================
// ROTA DE TESTE - Contratos (sem Oracle)
// ============================================

app.get("/api/contratos-teste", async (req, res) => {
  try {
    console.log('🧪 Endpoint de teste /api/contratos-teste chamado');
    
    // Dados fixos para teste (sem consultar Oracle)
    const dadosTeste = {
      data: [
        {
          nrContrato: 1270,
          cdCgcEstipulante: "04347163000148",
          dsEstipulante: "MOTO HONDA DA AMAZONIA LTDA"
        },
        {
          nrContrato: 2444,
          cdCgcEstipulante: "08281892000158",
          dsEstipulante: "2E DESPACHOS ADUANEIROS LTDA"
        }
      ],
      pagination: {
        limit: 50,
        offset: 0,
        total: 2
      }
    };
    
    console.log('✅ Retornando dados de teste:', dadosTeste.data.length, 'contratos');
    
    res.json(dadosTeste);
  } catch (error) {
    console.error('❌ Erro no endpoint de teste:', error);
    res.status(500).json({
      error: "Erro no endpoint de teste",
      message: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});
```

---

## 🧪 COMO TESTAR:

### 1. Adicione a rota acima no seu código
### 2. Reinicie o servidor (`npm run dev`)
### 3. Teste localmente:

```
http://localhost:5000/api/contratos-teste
```

**Deve retornar os dados de teste imediatamente!**

### 4. Teste via Ngrok:

```
https://sua-url.ngrok-free.app/api/contratos-teste
```

**✅ Se funcionar:** O problema é a conexão com Oracle  
**❌ Se não funcionar:** O problema é o Ngrok ou configuração do servidor

---

## 🎯 PRÓXIMOS PASSOS:

**Se `/api/contratos-teste` funcionar pelo Ngrok:**
- O problema é a query SQL ou conexão Oracle
- Precisamos verificar timeout, credenciais, ou estrutura da tabela

**Se `/api/contratos-teste` NÃO funcionar pelo Ngrok:**
- O problema é configuração do Ngrok ou firewall
- Verifique se está apontando para a porta correta (5000)
- Verifique firewall do Windows

---

## 🔍 CHECKLIST DE DEBUG:

- [ ] `/api/health` funciona localmente
- [ ] `/api/health` funciona via Ngrok
- [ ] `/api/contratos-teste` funciona localmente
- [ ] `/api/contratos-teste` funciona via Ngrok
- [ ] `/api/contratos` funciona localmente
- [ ] `/api/contratos` funciona via Ngrok

Marque cada um e me diga quais funcionam!
