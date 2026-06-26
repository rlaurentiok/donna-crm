// netlify/functions/data.js
// API simple de almacenamiento para Donna CRM usando Netlify Blobs.
// Si las credenciales automáticas no están disponibles (por ejemplo al
// desplegar conectando un repo de GitHub), se usan las variables de
// entorno NETLIFY_SITE_ID y NETLIFY_BLOBS_TOKEN como respaldo.
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
    const { getStore } = await import('@netlify/blobs');

    const manualSiteID = process.env.NETLIFY_SITE_ID;
    const manualToken = process.env.NETLIFY_BLOBS_TOKEN;

    const store = (manualSiteID && manualToken)
      ? getStore({ name: STORE_NAME, siteID: manualSiteID, token: manualToken })
      : getStore(STORE_NAME);

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
