// netlify/functions/data.js
// API simple de almacenamiento para Donna CRM usando Netlify Blobs.
// No requiere "npm install": @netlify/blobs viene incluido en el runtime de Netlify Functions.
// GET  /.netlify/functions/data           -> devuelve { contacts, simpleTasks, dismissed }
// POST /.netlify/functions/data  { body }  -> guarda el estado completo enviado

const STORE_NAME = 'donna-data';
const KEY = 'state';

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    // Import dinámico: el módulo viene embebido en el runtime de Netlify,
    // así que no necesita estar en package.json ni pasar por npm install.
    const { getStore } = await import('@netlify/blobs');
    const store = getStore(STORE_NAME);

    if (event.httpMethod === 'GET') {
      const raw = await store.get(KEY, { type: 'json' });
      const data = raw || { contacts: [], simpleTasks: [], dismissed: {} };
      return { statusCode: 200, headers, body: JSON.stringify(data) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const data = {
        contacts: body.contacts || [],
        simpleTasks: body.simpleTasks || [],
        dismissed: body.dismissed || {},
        updatedAt: new Date().toISOString()
      };
      await store.setJSON(KEY, data);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, updatedAt: data.updatedAt }) };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message, stack: err.stack }) };
  }
};

