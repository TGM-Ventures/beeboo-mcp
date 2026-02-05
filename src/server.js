/**
 * server.js — MCP Server implementation for BeeBoo
 * 
 * Implements the Model Context Protocol using the official SDK,
 * exposing BeeBoo's Human-in-the-Loop infrastructure to AI agents.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { tools, executeTool } from './tools.js';

const SERVER_NAME = 'beeboo';
const SERVER_VERSION = '0.1.0';

/**
 * Create and configure the MCP server
 */
function createServer() {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Register all BeeBoo tools
  registerTools(server);

  return server;
}

/**
 * Register all tools with the MCP server
 */
function registerTools(server) {
  // beeboo_knowledge_search
  server.registerTool(
    'beeboo_knowledge_search',
    {
      description: 'Search the BeeBoo knowledge base for information using semantic search',
      inputSchema: {
        query: z.string().describe('Search query - can be natural language')
      }
    },
    async ({ query }) => {
      try {
        const result = await executeTool('beeboo_knowledge_search', { query });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: result.data ? { results: result.data } : undefined
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_knowledge_add
  server.registerTool(
    'beeboo_knowledge_add',
    {
      description: 'Add a new entry to the BeeBoo knowledge base',
      inputSchema: {
        title: z.string().describe('Title of the knowledge entry'),
        content: z.string().describe('Content/body of the entry'),
        tags: z.array(z.string()).optional().describe('Optional tags for categorization')
      }
    },
    async ({ title, content, tags }) => {
      try {
        const result = await executeTool('beeboo_knowledge_add', { title, content, tags });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: result.data
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_knowledge_list
  server.registerTool(
    'beeboo_knowledge_list',
    {
      description: 'List all knowledge base entries',
      inputSchema: {}
    },
    async () => {
      try {
        const result = await executeTool('beeboo_knowledge_list', {});
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: { entries: result.data }
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_approval_request
  server.registerTool(
    'beeboo_approval_request',
    {
      description: 'Request human approval for an action. Use this when you need explicit permission before proceeding with a potentially impactful operation.',
      inputSchema: {
        title: z.string().describe('Brief description of what needs approval'),
        description: z.string().describe('Detailed explanation of the request and why approval is needed')
      }
    },
    async ({ title, description }) => {
      try {
        const result = await executeTool('beeboo_approval_request', { title, description });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: result.data
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_approval_check
  server.registerTool(
    'beeboo_approval_check',
    {
      description: 'Check the status of an approval request',
      inputSchema: {
        id: z.string().describe('The approval request ID to check')
      }
    },
    async ({ id }) => {
      try {
        const result = await executeTool('beeboo_approval_check', { id });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: result.data
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_approvals_list
  server.registerTool(
    'beeboo_approvals_list',
    {
      description: 'List all approval requests with optional status filter',
      inputSchema: {
        status: z.enum(['pending', 'approved', 'rejected']).optional()
          .describe('Filter by status: pending, approved, or rejected')
      }
    },
    async ({ status }) => {
      try {
        const result = await executeTool('beeboo_approvals_list', { status });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: { approvals: result.data }
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_request_create
  server.registerTool(
    'beeboo_request_create',
    {
      description: 'Create a work request for the team. Use this to queue up tasks that need human attention or execution.',
      inputSchema: {
        title: z.string().describe('Brief title of the work request'),
        description: z.string().optional().describe('Detailed description of what needs to be done'),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
          .describe('Priority level: low, medium, high, or critical')
      }
    },
    async ({ title, description, priority }) => {
      try {
        const result = await executeTool('beeboo_request_create', { title, description, priority });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: result.data
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  // beeboo_requests_list
  server.registerTool(
    'beeboo_requests_list',
    {
      description: 'List all work requests with optional status filter',
      inputSchema: {
        status: z.enum(['open', 'in_progress', 'resolved']).optional()
          .describe('Filter by status: open, in_progress, or resolved')
      }
    },
    async ({ status }) => {
      try {
        const result = await executeTool('beeboo_requests_list', { status });
        return {
          content: [{ type: 'text', text: result.text }],
          structuredContent: { requests: result.data }
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer() {
  // Check for API key
  if (!process.env.BEEBOO_API_KEY) {
    console.error('Error: BEEBOO_API_KEY environment variable is required');
    console.error('Get your API key at https://beeboo.ai/settings/api-keys');
    process.exit(1);
  }

  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
  
  // Log to stderr (not stdout, which is used for MCP protocol)
  console.error(`BeeBoo MCP server v${SERVER_VERSION} started`);
}

export { createServer };
