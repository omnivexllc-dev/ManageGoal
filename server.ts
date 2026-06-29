import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import Stripe from 'stripe';
import { WebCheckoutClient } from '@amazonpay/amazon-pay-api-sdk-nodejs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
let stripeClient: Stripe | null = null;
let amazonPayClient: any = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required to use Stripe.');
    }
    // @ts-ignore - Ignore exact version requirements if mismatch
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' });
  }
  return stripeClient;
}

function getAmazonPayClient(): any {
  if (!amazonPayClient) {
    const publicKeyId = process.env.AMAZON_PAY_PUBLIC_KEY_ID;
    let privateKey = process.env.AMAZON_PAY_PRIVATE_KEY;
    if (!publicKeyId || !privateKey) {
      throw new Error('Amazon Pay credentials are required to use the real Amazon Pay gateway.');
    }
    // Sanitize the private key to support both literal newlines and escaped \\n strings
    privateKey = privateKey.replace(/\\n/g, '\n').trim();
    
    amazonPayClient = new WebCheckoutClient({
      publicKeyId,
      privateKey,
      region: process.env.AMAZON_PAY_REGION || 'na',
      sandbox: process.env.AMAZON_PAY_SANDBOX !== 'false'
    });
  }
  return amazonPayClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Summarization Endpoint
  app.post('/api/ai/summarize', async (req, res) => {
    try {
      const { text, type } = req.body;
      const prompt = `You are a helpful CRM AI assistant. Summarize the following ${type} in 2-3 concise sentences:\n\n${text}`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      res.json({ summary: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'AI generation failed' });
    }
  });

  // Stripe Checkout Endpoint
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const stripe = getStripe();
      const { plan, price } = req.body;
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `ManageGoal CRM - ${plan} Plan`,
                description: `Monthly subscription for ${plan} privileges.`,
              },
              unit_amount: price * 100,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/#pricing`,
      });

      res.json({ id: session.id });
    } catch (error: any) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Stripe Status Endpoint
  app.get('/api/stripe/status', (req, res) => {
    const configured = !!(process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY);
    res.json({
      configured,
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasPublicKey: !!process.env.VITE_STRIPE_PUBLIC_KEY
    });
  });

  // Amazon Pay Status Endpoint
  app.get('/api/amazon-pay/status', (req, res) => {
    const configured = !!(process.env.AMAZON_PAY_PUBLIC_KEY_ID && process.env.AMAZON_PAY_PRIVATE_KEY);
    res.json({ configured });
  });

  // Real Amazon Pay Checkout Session Creation Endpoint
  app.post('/api/amazon-pay/create-checkout-session', async (req, res) => {
    try {
      const client = getAmazonPayClient();
      const { plan, price } = req.body;
      const baseUrl = process.env.APP_URL || 'http://localhost:3000';
      const storeId = process.env.AMAZON_PAY_STORE_ID;

      if (!storeId) {
        throw new Error('AMAZON_PAY_STORE_ID is required to create a checkout session.');
      }

      const payload = {
        webCheckoutDetails: {
          checkoutReviewReturnUrl: `${baseUrl}/amazon-pay-review`,
          checkoutResultReturnUrl: `${baseUrl}/dashboard?gateway=amazonpay`
        },
        storeId,
        scopes: ['name', 'email', 'phoneNumber', 'billingAddress'],
        chargePermissionType: 'Recurring',
        recurringMetadata: {
          frequency: {
            unit: 'Month',
            value: '1'
          }
        },
        paymentDetails: {
          paymentIntent: 'Confirm',
          chargeAmount: {
            amount: price.toFixed(2),
            currencyCode: 'USD'
          }
        },
        merchantMetadata: {
          merchantReferenceId: `sub_amzn_${Date.now()}`,
          merchantStoreName: 'ManageGoal CRM',
          noteToBuyer: `Monthly Subscription for ${plan} privileges`
        }
      };

      const headers = {
        'x-amz-pay-idempotency-key': `idemp_${Date.now()}`
      };

      const response = await client.createCheckoutSession(payload, headers);
      res.json(response);
    } catch (error: any) {
      console.error('Amazon Pay Session Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error creating Amazon Pay session' });
    }
  });

  // LeadFinder AI Search Endpoint
  app.post('/api/leads/search', async (req, res) => {
    try {
      const { country, state, city, zip, radius, category, maxResults = 10 } = req.body;
      
      const prompt = `You are a professional local business search engine. Generate a list of exactly ${maxResults} highly realistic local businesses in the category "${category}" located in "${city}, ${state || ''} ${zip || ''}, ${country}".
Each business must feel incredibly authentic, with realistic names, phone numbers, addresses, and details for this specific region.
Some of these businesses must have a website (70%), while others (30%) must have NO website (website field is empty string) to allow auditing of businesses with or without websites.
Return your response strictly as a JSON array of objects conforming to the specified responseSchema structure.
Do not include any markdown formatting, code blocks, or comments in your response. Output ONLY the raw JSON array.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                category: { type: Type.STRING },
                phone: { type: Type.STRING },
                website: { type: Type.STRING },
                email: { type: Type.STRING },
                address: { type: Type.STRING },
                city: { type: Type.STRING },
                state: { type: Type.STRING },
                country: { type: Type.STRING },
                zip: { type: Type.STRING },
                rating: { type: Type.NUMBER },
                reviewCount: { type: Type.INTEGER },
                yelpRating: { type: Type.NUMBER },
                yelpReviewCount: { type: Type.INTEGER },
                mapsUrl: { type: Type.STRING },
                yelpUrl: { type: Type.STRING },
                latitude: { type: Type.NUMBER },
                longitude: { type: Type.NUMBER }
              },
              required: ["name", "category", "phone", "website", "email", "address", "city", "state", "country", "zip", "rating", "reviewCount", "yelpRating", "yelpReviewCount", "mapsUrl", "yelpUrl", "latitude", "longitude"]
            }
          }
        }
      });

      const responseText = response.text || '[]';
      const results = JSON.parse(responseText.trim());
      res.json(results);
    } catch (error: any) {
      console.error('Lead search error:', error);
      res.status(500).json({ error: error.message || 'Failed to search leads' });
    }
  });

  // LeadFinder AI Website Audit / Analyzer Endpoint
  app.post('/api/leads/analyze', async (req, res) => {
    try {
      const { name, category, website, city, state, country } = req.body;
      
      const hasWebsite = !!(website && website.trim() !== '');
      
      const prompt = `You are an expert full-stack web developer and SEO architect. Perform an extremely detailed, professional website and digital presence audit for the following local business:
Business Name: ${name}
Category: ${category}
Website: ${hasWebsite ? website : "None (No website found)"}
Location: ${city}, ${state || ''}, ${country}

If the business has no website, the audit MUST reflect this: website score, SEO, design, mobile scores should be 0, and the lead score should be a hot lead with a suggestion to build a new website!
If the business HAS a website, simulate an intelligent crawlers analysis of their landing page and SEO footprint, generating realistic, custom, detailed metrics and audits tailored exactly to their website.

Generate a JSON object conforming exactly to this structure:
{
  "websiteAnalyzer": {
    "https": boolean,
    "ssl": boolean,
    "mobileFriendly": boolean,
    "responsive": boolean,
    "speed": string,
    "seoTitle": string,
    "metaDescription": string,
    "h1Tags": string[],
    "robotsTxt": boolean,
    "sitemap": boolean,
    "openGraph": boolean,
    "structuredData": boolean,
    "contactForm": boolean,
    "socialLinks": {
      "facebook": string,
      "instagram": string,
      "linkedin": string,
      "youtube": string,
      "twitter": string
    },
    "onlineBooking": boolean,
    "liveChat": boolean,
    "blog": boolean,
    "testimonials": boolean,
    "portfolio": boolean,
    "googleAnalytics": boolean,
    "modernDesign": string
  },
  "contactExtraction": {
    "emails": string[],
    "phones": string[]
  },
  "aiAudit": {
    "websiteScore": number,
    "seoScore": number,
    "performanceScore": number,
    "designScore": number,
    "mobileScore": number,
    "securityScore": number,
    "leadScore": string, // "Hot Lead" or "Warm Lead" or "Cold Lead"
    "explanation": string,
    "salesOpportunities": string[]
  }
}

Respond strictly with the raw JSON object. Do not wrap in markdown or include any extra commentary.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '{}';
      const result = JSON.parse(responseText.trim());
      res.json(result);
    } catch (error: any) {
      console.error('Audit generation error:', error);
      res.status(500).json({ error: error.message || 'AI Website audit failed' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
