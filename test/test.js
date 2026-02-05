#!/usr/bin/env node

/**
 * test.js — Basic tests for the BeeBoo MCP server
 * 
 * Usage: BEEBOO_API_KEY=xxx npm test
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverPath = join(__dirname, '..', 'index.js');

// Test cases
const tests = [
  {
    name: 'tools/list returns all 8 tools',
    request: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    validate: (response) => {
      if (!response.result?.tools) throw new Error('No tools in response');
      if (response.result.tools.length !== 8) {
        throw new Error(`Expected 8 tools, got ${response.result.tools.length}`);
      }
      const names = response.result.tools.map(t => t.name).sort();
      const expected = [
        'beeboo_approval_check',
        'beeboo_approval_request',
        'beeboo_approvals_list',
        'beeboo_knowledge_add',
        'beeboo_knowledge_list',
        'beeboo_knowledge_search',
        'beeboo_request_create',
        'beeboo_requests_list'
      ];
      if (JSON.stringify(names) !== JSON.stringify(expected)) {
        throw new Error(`Tool names mismatch: ${JSON.stringify(names)}`);
      }
    }
  },
  {
    name: 'beeboo_knowledge_list works',
    request: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'beeboo_knowledge_list',
        arguments: {}
      }
    },
    validate: (response) => {
      if (response.error) throw new Error(`Error: ${response.error.message}`);
      if (!response.result?.content?.[0]?.text) {
        throw new Error('No content in response');
      }
      // Should either have entries or say "no entries"
      const text = response.result.content[0].text;
      if (!text.includes('knowledge') && !text.includes('entries')) {
        throw new Error(`Unexpected response: ${text}`);
      }
    }
  },
  {
    name: 'beeboo_knowledge_search works',
    request: {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'beeboo_knowledge_search',
        arguments: { query: 'test' }
      }
    },
    validate: (response) => {
      if (response.error) throw new Error(`Error: ${response.error.message}`);
      if (!response.result?.content?.[0]?.text) {
        throw new Error('No content in response');
      }
    }
  },
  {
    name: 'beeboo_approvals_list works',
    request: {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'beeboo_approvals_list',
        arguments: {}
      }
    },
    validate: (response) => {
      if (response.error) throw new Error(`Error: ${response.error.message}`);
      if (!response.result?.content?.[0]?.text) {
        throw new Error('No content in response');
      }
    }
  },
  {
    name: 'beeboo_requests_list works',
    request: {
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'beeboo_requests_list',
        arguments: {}
      }
    },
    validate: (response) => {
      if (response.error) throw new Error(`Error: ${response.error.message}`);
      if (!response.result?.content?.[0]?.text) {
        throw new Error('No content in response');
      }
    }
  }
];

async function runTest(test) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [serverPath], {
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';

    server.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Send request
    server.stdin.write(JSON.stringify(test.request) + '\n');
    server.stdin.end();

    // Set timeout
    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Test timed out after 10s'));
    }, 10000);

    server.on('close', () => {
      clearTimeout(timeout);
      
      try {
        // Parse response (skip stderr lines, find JSON)
        const lines = stdout.split('\n').filter(line => line.startsWith('{'));
        if (lines.length === 0) {
          throw new Error(`No JSON response. stdout: ${stdout}, stderr: ${stderr}`);
        }
        
        const response = JSON.parse(lines[0]);
        test.validate(response);
        resolve();
      } catch (err) {
        reject(err);
      }
    });

    server.on('error', reject);
  });
}

async function main() {
  if (!process.env.BEEBOO_API_KEY) {
    console.error('Error: BEEBOO_API_KEY environment variable required');
    process.exit(1);
  }

  console.log('🧪 Running BeeBoo MCP Server tests\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      await runTest(test);
      console.log(`  ✅ ${test.name}`);
      passed++;
    } catch (err) {
      console.log(`  ❌ ${test.name}`);
      console.log(`     Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
