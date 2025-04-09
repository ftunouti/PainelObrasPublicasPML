// api/proxy.js
export default async function handler(request, response) {
  const { query } = JSON.parse(request.body);

  try {
    const apiResponse = await fetch('https://obras-ng.ciga.sc.gov.br/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await apiResponse.json();
    response.status(200).json(data);
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
}