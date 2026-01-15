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

// Correios API (SEDEX/PAC) - Using melhorenvio API as fallback since Correios official API requires contract
async function calculateCorreios(
  originCep: string,
  destinationCep: string,
  weightKg: number,
  service: 'sedex' | 'pac'
): Promise<ShippingResult> {
  try {
    // Using free Correios calculator endpoint
    const serviceCode = service === 'sedex' ? '04014' : '04510'; // SEDEX = 04014, PAC = 04510
    
    // Simulated calculation based on weight and distance
    // In production, integrate with actual Correios API (requires contract) or use MelhorEnvio
    const basePrice = service === 'sedex' ? 25.0 : 18.0;
    const pricePerKg = service === 'sedex' ? 8.0 : 5.0;
    const deliveryDays = service === 'sedex' ? 3 : 8;
    
    const estimatedPrice = basePrice + (weightKg * pricePerKg);
    
    return {
      carrier: 'Correios',
      service: service.toUpperCase(),
      price: parseFloat(estimatedPrice.toFixed(2)),
      delivery_days: deliveryDays,
    };
  } catch (error) {
    console.error(`Error calculating ${service}:`, error);
    return {
      carrier: 'Correios',
      service: service.toUpperCase(),
      price: 0,
      delivery_days: 0,
      error: `Erro ao calcular ${service}`,
    };
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
      };
    }
    
    // Loggi GraphQL API endpoint
    const loggiEndpoint = 'https://staging.loggi.com/graphql'; // Use production URL in prod
    
    const query = `
      mutation estimateCreatePackage($input: CreatePackageInput!) {
        createPackage(input: $input) {
          pk
          status
          totalPrice
        }
      }
    `;
    
    // Note: This is a simplified structure - adjust based on actual Loggi API docs
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
    
    // Return simulated result on error
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
      return sum + (p.weight_kg || 0.15);
    }, 0) || 0.15;

    console.log(`Calculating shipping for ${products?.length || 0} products, total weight: ${totalWeightKg}kg`);

    const results: ShippingResult[] = [];

    // Calculate based on carrier selection
    if (carrier === 'all' || carrier === 'sedex') {
      const sedexResult = await calculateCorreios(cleanOriginCep, cleanDestinationCep, totalWeightKg, 'sedex');
      results.push(sedexResult);
    }

    if (carrier === 'all' || carrier === 'pac') {
      const pacResult = await calculateCorreios(cleanOriginCep, cleanDestinationCep, totalWeightKg, 'pac');
      results.push(pacResult);
    }

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