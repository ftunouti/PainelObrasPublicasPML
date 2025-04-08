export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }
  
    try {
      const apiResponse = await fetch('https://obras-ng.ciga.sc.gov.br/api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body)
      });
  
      const contentType = apiResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta não é JSON');
      }
  
      const data = await apiResponse.json();
      
      // Validação adicional da estrutura
      if (!data.data) {
        throw new Error('Estrutura de dados inválida');
      }
  
      res.status(200).json(data);
    } catch (error) {
      console.error('Erro no proxy:', {
        error: error.message,
        stack: error.stack,
        requestBody: req.body
      });
      
      res.status(500).json({ 
        error: 'Erro interno no servidor',
        details: error.message 
      });
    }
  }