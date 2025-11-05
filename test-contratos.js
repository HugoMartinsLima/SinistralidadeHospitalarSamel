// Script de teste para verificar endpoint de contratos
async function testarContratos() {
  try {
    console.log('🔍 Testando endpoint /api/contratos...\n');
    
    const response = await fetch('http://localhost:5000/api/contratos');
    
    console.log('📡 Status:', response.status);
    console.log('📡 Status Text:', response.statusText);
    console.log('📡 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n✅ Sucesso! Dados recebidos:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('\n❌ Erro! Resposta:');
      console.log(text);
    }
  } catch (error) {
    console.error('\n❌ Erro ao fazer requisição:', error.message);
  }
}

testarContratos();
