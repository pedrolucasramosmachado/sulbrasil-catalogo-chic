interface ShippingRequest {
  origin_cep: string;
  destination_cep: string;
  product_ids: string[];
  product_quantities?: Record<string, number>;
}

interface ShippingResult {
  carrier: string;
  service: string;
  price: number;
  delivery_days: number;
  error?: string;
}

const DEFAULT_HEIGHT = 6;
const DEFAULT_WIDTH = 16;
const DEFAULT_LENGTH = 24;
const DEFAULT_WEIGHT_KG = 0.15;

async function calculateMelhorEnvio(
  originCep: string,
  destinationCep: string,
  weightKg: number,
  token: string
): Promise<ShippingResult[]> {
  const results: ShippingResult[] = [];

  try {
    const apiUrl = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';
    
    const requestBody = {
      from: { postal_code: originCep },
      to: { postal_code: destinationCep },
      products: [
        {
          id: "package",
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          length: DEFAULT_LENGTH,
          weight: weightKg,
          insurance_value: 0,
          quantity: 1,
        },
      ],
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'SulBrasil Catalogo (contato@sulbrasil.com.br)',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro na API MelhorEnvio');
    }

    if (Array.isArray(data)) {
      for (const option of data) {
        // Filter for Correios services (1 = PAC, 2 = SEDEX)
        const isSupported = [1, 2].includes(option.id) || 
                          option.name?.includes('PAC') || 
                          option.name?.includes('SEDEX');

        if (isSupported) {
          const serviceName = option.id === 1 || option.name?.toUpperCase().includes('PAC') ? 'PAC' : 'SEDEX';
          
          if (option.error) {
            results.push({
              carrier: 'Correios',
              service: serviceName,
              price: 0,
              delivery_days: 0,
              error: option.error,
            });
          } else {
            results.push({
              carrier: 'Correios',
              service: serviceName,
              price: parseFloat(option.custom_price || option.price) || 0,
              delivery_days: parseInt(option.custom_delivery_time || option.delivery_time) || 0,
            });
          }
        }
      }
    }

    if (results.length === 0) {
      return [
        { carrier: 'Correios', service: 'SEDEX', price: 0, delivery_days: 0, error: 'Nenhuma opção disponível' },
        { carrier: 'Correios', service: 'PAC', price: 0, delivery_days: 0, error: 'Nenhuma opção disponível' },
      ];
    }

    return results;
  } catch (error: any) {
    return [
      { carrier: 'Correios', service: 'SEDEX', price: 0, delivery_days: 0, error: error.message },
      { carrier: 'Correios', service: 'PAC', price: 0, delivery_days: 0, error: error.message },
    ];
  }
}

export const onRequest: PagesFunction = async (context) => {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  return context.next();
};

export const onRequestPost: PagesFunction<{ MELHORENVIO_TOKEN: string }> = async (context) => {
  const { request, env } = context;

  try {
    const body: any = await request.json();

    const { origin_cep, destination_cep, total_weight_kg } = body;

    if (!origin_cep || !destination_cep) {
      return new Response(JSON.stringify({ error: 'Dados incompletos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const weightKg = parseFloat(total_weight_kg) || DEFAULT_WEIGHT_KG;

    console.log(`Calculando frete para: ${destination_cep}, Peso: ${weightKg}kg`);

    const results = await calculateMelhorEnvio(
      origin_cep.replace(/\D/g, ''),
      destination_cep.replace(/\D/g, ''),
      weightKg,
      env.MELHORENVIO_TOKEN
    );

    console.log(`Resultados obtidos: ${results.length}`);

    return new Response(JSON.stringify({
      success: true,
      results,
    }), {
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: any) {
    console.error('Erro no cálculo de frete:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};

