/**
 * api.js — HTTP client for the BeeBoo API
 * 
 * Zero dependencies beyond Node.js built-ins.
 * Reads config from environment: BEEBOO_API_KEY, BEEBOO_API_URL
 */

import https from 'https';
import http from 'http';

const DEFAULT_API_URL = 'https://beeboo-api-625726065149.us-central1.run.app';
const USER_AGENT = '@beeboo/mcp-server/0.1.0';

/**
 * Get API configuration from environment
 */
function getConfig() {
  const apiKey = process.env.BEEBOO_API_KEY;
  const apiUrl = process.env.BEEBOO_API_URL || DEFAULT_API_URL;
  
  if (!apiKey) {
    throw new Error('BEEBOO_API_KEY environment variable is required');
  }
  
  return { apiKey, apiUrl };
}

/**
 * Make an HTTP request to the BeeBoo API
 * @param {string} method - HTTP method
 * @param {string} path - API path (e.g., /api/v1/knowledge/entries)
 * @param {object} [body] - Request body (will be JSON-encoded)
 * @param {object} [query] - Query parameters
 * @returns {Promise<{status: number, data: any, raw: string}>}
 */
export function request(method, path, body = null, query = null) {
  return new Promise((resolve, reject) => {
    const { apiKey, apiUrl } = getConfig();
    
    // Build URL with query params
    let fullUrl = apiUrl + path;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined && v !== null && v !== '') {
          params.set(k, String(v));
        }
      }
      const qs = params.toString();
      if (qs) fullUrl += '?' + qs;
    }
    
    const parsed = new URL(fullUrl);
    const isHTTPS = parsed.protocol === 'https:';
    const lib = isHTTPS ? https : http;
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': USER_AGENT,
      'X-API-Key': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    };
    
    let bodyStr = null;
    if (body) {
      bodyStr = JSON.stringify(body);
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (isHTTPS ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: method,
      headers: headers,
      timeout: 30000,
    };
    
    const req = lib.request(reqOpts, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          data: parsed,
          raw: data,
        });
      });
    });
    
    req.on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`));
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out (30s)'));
    });
    
    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

// API helper functions
export const api = {
  get: (path, query) => request('GET', path, null, query),
  post: (path, body, query) => request('POST', path, body, query),
  patch: (path, body, query) => request('PATCH', path, body, query),
  delete: (path, query) => request('DELETE', path, null, query),
  
  // Knowledge
  searchKnowledge: (query, opts = {}) => 
    api.post('/api/v1/knowledge/search', { query, limit: opts.limit || 10, ...opts }),
  listKnowledgeEntries: (query) => 
    api.get('/api/v1/knowledge/entries', query),
  createKnowledgeEntry: (entry) => 
    api.post('/api/v1/knowledge/entries', entry),
  getKnowledgeEntry: (id) => 
    api.get(`/api/v1/knowledge/entries/${id}`),
  
  // Approvals
  submitApproval: (data) => 
    api.post('/api/v1/approvals', data),
  listApprovals: (query) => 
    api.get('/api/v1/approvals', query),
  getApproval: (id) => 
    api.get(`/api/v1/approvals/${id}`),
  
  // Requests
  createRequest: (data) => 
    api.post('/api/v1/requests', data),
  listRequests: (query) => 
    api.get('/api/v1/requests', query),
  getRequest: (id) => 
    api.get(`/api/v1/requests/${id}`),
};

/**
 * Check if response is OK (2xx)
 */
export function isOk(res) {
  return res.status >= 200 && res.status < 300;
}

/**
 * Extract data from standard { data: ... } response
 */
export function getData(res) {
  if (res.data?.data !== undefined) return res.data.data;
  return res.data;
}

/**
 * Extract error message from standard { error: { message: ... } } response
 */
export function getError(res) {
  if (res.data?.error?.message) return res.data.error.message;
  if (res.data?.error) return typeof res.data.error === 'string' ? res.data.error : JSON.stringify(res.data.error);
  if (typeof res.data === 'string') return res.data;
  return `HTTP ${res.status}`;
}

export default api;
