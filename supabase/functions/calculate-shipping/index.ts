import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShippingRequest {
  origin_cep: string;
  destination_cep: string;
  product_ids: string[];
  carrier?: 'sedex' | 'pac' | 'loggi' | 'all';
}

interface ShippingResult {
  carrier: string;
  service: string;
  price: number;
  delivery_days: number;
  error?: string;
}

// Default package dimensions (cm) and weight (kg)
const DEFAULT_HEIGHT = 6;
const DEFAULT_WIDTH = 16;
const DEFAULT_LENGTH = 24;
const DEFAULT_WEIGHT_KG = 0.15;

// MelhorEnvio API calculation
async function calculateMelhorEnvio(
  originCep: string,
  destinationCep: string,
  weightKg: number
): Promise<ShippingResult[]> {
  const results: ShippingResult[] = [];
  const MELHORENVIO_TOKEN = Deno.env.get('MELHORENVIO_TOKEN');

  if (!MELHORENVIO_TOKEN) {
    console.error('MELHORENVIO_TOKEN not configured');
    return [
      {
        carrier: 'Correios',
        service: 'SEDEX',
        price: 0,
        delivery_days: 0,
        error: 'Token MelhorEnvio não configurado',
      },
      {
        carrier: 'Correios',
        service: 'PAC',
        price: 0,
        delivery_days: 0,
        error: 'Token MelhorEnvio não configurado',
      },
    ];
  }

  try {
    // MelhorEnvio Shipment Calculate endpoint
    // Use sandbox for testing, production URL: https://melhorenvio.com.br/api/v2/me/shipment/calculate
    const apiUrl = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';
    
    const requestBody = {
      from: {
        postal_code: originCep,
      },
      to: {
        postal_code: destinationCep,
      },
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

    console.log('MelhorEnvio request:', JSON.stringify(requestBody));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MELHORENVIO_TOKEN}`,
        'User-Agent': 'SulBrasil Catalogo (contato@sulbrasil.com.br)',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log('MelhorEnvio response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('MelhorEnvio API error:', data);
      throw new Error(data.message || 'Erro na API MelhorEnvio');
    }

    // Parse response - MelhorEnvio returns an array of shipping options
    if (Array.isArray(data)) {
      for (const option of data) {
        // Filter for Correios services (SEDEX and PAC)
        // Service IDs: 1 = PAC, 2 = SEDEX
        if (option.id === 1 || option.id === 2 || option.name?.includes('PAC') || option.name?.includes('SEDEX')) {
          if (option.error) {
            results.push({
              carrier: option.company?.name || 'Correios',
              service: option.name || (option.id === 1 ? 'PAC' : 'SEDEX'),
              price: 0,
              delivery_days: 0,
              error: option.error,
            });
          } else {
            results.push({
              carrier: option.company?.name || 'Correios',
              service: option.name || (option.id === 1 ? 'PAC' : 'SEDEX'),
              price: parseFloat(option.custom_price || option.price) || 0,
              delivery_days: parseInt(option.custom_delivery_time || option.delivery_time) || 0,
            });
          }
        }
      }
    }

    // If no results, return error
    if (results.length === 0) {
      return [
        {
          carrier: 'Correios',
          service: 'SEDEX',
          price: 0,
          delivery_days: 0,
          error: 'Nenhuma opção disponível para este CEP',
        },
        {
          carrier: 'Correios',
          service: 'PAC',
          price: 0,
          delivery_days: 0,
          error: 'Nenhuma opção disponível para este CEP',
        },
      ];
    }

    return results;
  } catch (error) {
    console.error('Error calculating MelhorEnvio:', error);
    return [
      {
        carrier: 'Correios',
        service: 'SEDEX',
        price: 0,
        delivery_days: 0,
        error: `Erro: ${error.message}`,
      },
      {
        carrier: 'Correios',
        service: 'PAC',
        price: 0,
        delivery_days: 0,
        error: `Erro: ${error.message}`,
      },
    ];
  }
}

// Loggi API calculation
async function calculateLoggi(
  originCep: string,
  destinationCep: string,
  weightKg: number
): Promise<ShippingResult> {
  try {
    const LOGGI_API_KEY = Deno.env.get('LOGGI_API_KEY');
    const LOGGI_COMPANY_ID = Deno.env.get('LOGGI_COMPANY_ID');
    
    if (!LOGGI_API_KEY || !LOGGI_COMPANY_ID) {
      // Simulated calculation when API keys are not configured
      console.log('Loggi API keys not configured, using simulation');
      const basePrice = 15.0;
      const pricePerKg = 4.0;
      const estimatedPrice = basePrice + (weightKg * pricePerKg);
      
      return {
        carrier: 'Loggi',
        service: 'Express',
        price: parseFloat(estimatedPrice.toFixed(2)),
        delivery_days: 5,
        error: 'Usando estimativa (API não configurada)',
      };
    }
    
    // Loggi GraphQL API endpoint
    const loggiEndpoint = 'https://staging.loggi.com/graphql';
    
    const query = `
      mutation estimateCreatePackage($input: CreatePackageInput!) {
        createPackage(input: $input) {
          pk
          status
          totalPrice
        }
      }
    `;
    
    const response = await fetch(loggiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOGGI_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          input: {
            companyId: LOGGI_COMPANY_ID,
            pickupAddress: { cep: originCep },
            deliveryAddress: { cep: destinationCep },
            packages: [{
              weight: weightKg,
            }],
          },
        },
      }),
    });
    
    if (!response.ok) {
      throw new Error('Loggi API request failed');
    }
    
    const data = await response.json();
    
    return {
      carrier: 'Loggi',
      service: 'Express',
      price: data?.data?.createPackage?.totalPrice || 0,
      delivery_days: 5,
    };
  } catch (error) {
    console.error('Error calculating Loggi:', error);
    
    return {
      carrier: 'Loggi',
      service: 'Express',
      price: 0,
      delivery_days: 0,
      error: 'Erro ao calcular Loggi',
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Usuário não autenticado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { origin_cep, destination_cep, product_ids, carrier = 'all' }: ShippingRequest = await req.json();

    // Validate CEPs
    const cleanOriginCep = origin_cep.replace(/\D/g, '');
    const cleanDestinationCep = destination_cep.replace(/\D/g, '');
    
    if (cleanOriginCep.length !== 8 || cleanDestinationCep.length !== 8) {
      return new Response(
        JSON.stringify({ error: 'CEP inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch products and calculate total weight
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, weight_kg')
      .in('id', product_ids);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar produtos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total weight (default to 0.15kg / 150g if not specified)
    const totalWeightKg = products?.reduce((sum, p) => {
      return sum + (p.weight_kg || DEFAULT_WEIGHT_KG);
    }, 0) || DEFAULT_WEIGHT_KG;

    console.log(`Calculating shipping for ${products?.length || 0} products, total weight: ${totalWeightKg}kg`);

    const results: ShippingResult[] = [];

    // Calculate using MelhorEnvio API for SEDEX and PAC
    if (carrier === 'all' || carrier === 'sedex' || carrier === 'pac') {
      const melhorEnvioResults = await calculateMelhorEnvio(cleanOriginCep, cleanDestinationCep, totalWeightKg);
      results.push(...melhorEnvioResults);
    }

    // Calculate Loggi if requested
    if (carrier === 'all' || carrier === 'loggi') {
      const loggiResult = await calculateLoggi(cleanOriginCep, cleanDestinationCep, totalWeightKg);
      results.push(loggiResult);
    }

    return new Response(
      JSON.stringify({
        success: true,
        origin_cep: cleanOriginCep,
        destination_cep: cleanDestinationCep,
        total_weight_kg: totalWeightKg,
        products_count: products?.length || 0,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Shipping calculation error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao calcular frete' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
