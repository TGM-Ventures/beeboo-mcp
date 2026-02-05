/**
 * tools.js — MCP tool definitions for BeeBoo
 * 
 * Defines all the tools exposed via the Model Context Protocol.
 */

import { z } from 'zod';
import { api, isOk, getData, getError } from './api.js';

/**
 * Tool definitions with Zod schemas and handlers
 */
export const tools = {
  // ─────────────────────────────────────────────────────────────
  // Knowledge Base Tools
  // ─────────────────────────────────────────────────────────────
  
  beeboo_knowledge_search: {
    name: 'beeboo_knowledge_search',
    description: 'Search the BeeBoo knowledge base for information using semantic search',
    inputSchema: {
      query: z.string().describe('Search query - can be natural language')
    },
    handler: async ({ query }) => {
      const res = await api.searchKnowledge(query, { limit: 10 });
      
      if (!isOk(res)) {
        throw new Error(`Search failed: ${getError(res)}`);
      }
      
      const data = getData(res);
      const results = Array.isArray(data) ? data : (data?.results || []);
      
      if (results.length === 0) {
        return { text: `No results found for "${query}"` };
      }
      
      const formatted = results.map((r, i) => {
        const title = r.title || r.key || '(untitled)';
        const content = r.content ? 
          (r.content.length > 200 ? r.content.slice(0, 200) + '...' : r.content) : 
          '';
        return `${i + 1}. **${title}**${r.id ? ` (${r.id})` : ''}\n   ${content}`;
      }).join('\n\n');
      
      return { 
        text: `Found ${results.length} result(s) for "${query}":\n\n${formatted}`,
        data: results 
      };
    }
  },
  
  beeboo_knowledge_add: {
    name: 'beeboo_knowledge_add',
    description: 'Add a new entry to the BeeBoo knowledge base',
    inputSchema: {
      title: z.string().describe('Title of the knowledge entry'),
      content: z.string().describe('Content/body of the entry'),
      tags: z.array(z.string()).optional().describe('Optional tags for categorization')
    },
    handler: async ({ title, content, tags }) => {
      const entry = {
        title,
        content,
        namespace: 'default',
        content_type: 'text',
        key: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      };
      
      if (tags && tags.length > 0) {
        entry.tags = tags;
      }
      
      const res = await api.createKnowledgeEntry(entry);
      
      if (!isOk(res)) {
        throw new Error(`Failed to create entry: ${getError(res)}`);
      }
      
      const data = getData(res);
      
      return {
        text: `✅ Knowledge entry created: "${title}"${data?.id ? ` (ID: ${data.id})` : ''}`,
        data: data
      };
    }
  },
  
  beeboo_knowledge_list: {
    name: 'beeboo_knowledge_list',
    description: 'List all knowledge base entries',
    inputSchema: {},
    handler: async () => {
      const res = await api.listKnowledgeEntries({});
      
      if (!isOk(res)) {
        throw new Error(`Failed to list entries: ${getError(res)}`);
      }
      
      const entries = getData(res);
      const items = Array.isArray(entries) ? entries : [];
      
      if (items.length === 0) {
        return { text: 'No knowledge entries found.', data: [] };
      }
      
      const formatted = items.map((e, i) => {
        const id = e.id?.slice(0, 8) || '—';
        const title = e.title || e.key || '(untitled)';
        const tags = e.tags?.length ? ` [${e.tags.join(', ')}]` : '';
        return `${i + 1}. ${title} (${id})${tags}`;
      }).join('\n');
      
      return {
        text: `📚 ${items.length} knowledge entries:\n\n${formatted}`,
        data: items
      };
    }
  },
  
  // ─────────────────────────────────────────────────────────────
  // Approval Tools
  // ─────────────────────────────────────────────────────────────
  
  beeboo_approval_request: {
    name: 'beeboo_approval_request',
    description: 'Request human approval for an action. Use this when you need explicit permission before proceeding with a potentially impactful operation.',
    inputSchema: {
      title: z.string().describe('Brief description of what needs approval'),
      description: z.string().describe('Detailed explanation of the request and why approval is needed')
    },
    handler: async ({ title, description }) => {
      const data = {
        title,
        description,
        category: 'general',
        urgency: 'normal',
      };
      
      const res = await api.submitApproval(data);
      
      if (!isOk(res)) {
        throw new Error(`Failed to submit approval: ${getError(res)}`);
      }
      
      const result = getData(res);
      
      return {
        text: `⏳ Approval requested: "${title}"\nID: ${result?.id || 'unknown'}\nStatus: pending\n\nWait for human approval before proceeding.`,
        data: result
      };
    }
  },
  
  beeboo_approval_check: {
    name: 'beeboo_approval_check',
    description: 'Check the status of an approval request',
    inputSchema: {
      id: z.string().describe('The approval request ID to check')
    },
    handler: async ({ id }) => {
      const res = await api.getApproval(id);
      
      if (!isOk(res)) {
        if (res.status === 404) {
          throw new Error(`Approval not found: ${id}`);
        }
        throw new Error(`Failed to check approval: ${getError(res)}`);
      }
      
      const approval = getData(res);
      const statusIcon = approval.status === 'approved' ? '✅' :
                         approval.status === 'denied' ? '❌' : '⏳';
      
      let text = `${statusIcon} Approval: ${approval.title || id}\nStatus: ${approval.status || 'pending'}`;
      
      if (approval.description) {
        text += `\nDescription: ${approval.description}`;
      }
      if (approval.decided_at) {
        text += `\nDecided: ${approval.decided_at}`;
      }
      if (approval.decision_note) {
        text += `\nNote: ${approval.decision_note}`;
      }
      
      return { text, data: approval };
    }
  },
  
  beeboo_approvals_list: {
    name: 'beeboo_approvals_list',
    description: 'List all approval requests with optional status filter',
    inputSchema: {
      status: z.enum(['pending', 'approved', 'rejected']).optional()
        .describe('Filter by status: pending, approved, or rejected')
    },
    handler: async ({ status }) => {
      const query = status ? { status } : {};
      const res = await api.listApprovals(query);
      
      if (!isOk(res)) {
        throw new Error(`Failed to list approvals: ${getError(res)}`);
      }
      
      const approvals = getData(res);
      const items = Array.isArray(approvals) ? approvals : [];
      
      if (items.length === 0) {
        const filterText = status ? ` with status "${status}"` : '';
        return { text: `No approvals found${filterText}.`, data: [] };
      }
      
      const formatted = items.map((a, i) => {
        const id = a.id?.slice(0, 8) || '—';
        const title = a.title || '(untitled)';
        const statusIcon = a.status === 'approved' ? '✅' :
                          a.status === 'denied' ? '❌' : '⏳';
        return `${i + 1}. ${statusIcon} ${title} (${id}) - ${a.status || 'pending'}`;
      }).join('\n');
      
      return {
        text: `📋 ${items.length} approval(s):\n\n${formatted}`,
        data: items
      };
    }
  },
  
  // ─────────────────────────────────────────────────────────────
  // Work Request Tools
  // ─────────────────────────────────────────────────────────────
  
  beeboo_request_create: {
    name: 'beeboo_request_create',
    description: 'Create a work request for the team. Use this to queue up tasks that need human attention or execution.',
    inputSchema: {
      title: z.string().describe('Brief title of the work request'),
      description: z.string().optional().describe('Detailed description of what needs to be done'),
      priority: z.enum(['low', 'medium', 'high', 'critical']).optional()
        .describe('Priority level: low, medium, high, or critical')
    },
    handler: async ({ title, description, priority }) => {
      const data = {
        title,
        description: description || '',
        priority: priority || 'medium',
      };
      
      const res = await api.createRequest(data);
      
      if (!isOk(res)) {
        throw new Error(`Failed to create request: ${getError(res)}`);
      }
      
      const result = getData(res);
      
      return {
        text: `📋 Work request created: "${title}"\nID: ${result?.id || 'unknown'}\nPriority: ${data.priority}`,
        data: result
      };
    }
  },
  
  beeboo_requests_list: {
    name: 'beeboo_requests_list',
    description: 'List all work requests with optional status filter',
    inputSchema: {
      status: z.enum(['open', 'in_progress', 'resolved']).optional()
        .describe('Filter by status: open, in_progress, or resolved')
    },
    handler: async ({ status }) => {
      const query = status ? { status } : {};
      const res = await api.listRequests(query);
      
      if (!isOk(res)) {
        throw new Error(`Failed to list requests: ${getError(res)}`);
      }
      
      const requests = getData(res);
      const items = Array.isArray(requests) ? requests : [];
      
      if (items.length === 0) {
        const filterText = status ? ` with status "${status}"` : '';
        return { text: `No work requests found${filterText}.`, data: [] };
      }
      
      const formatted = items.map((r, i) => {
        const id = r.id?.slice(0, 8) || '—';
        const title = r.title || '(untitled)';
        const statusIcon = r.status === 'resolved' ? '✅' :
                          r.status === 'in_progress' ? '🔄' : '📋';
        const priorityBadge = r.priority === 'critical' ? '🔴' :
                              r.priority === 'high' ? '🟠' :
                              r.priority === 'low' ? '⚪' : '🟡';
        return `${i + 1}. ${statusIcon} ${priorityBadge} ${title} (${id})`;
      }).join('\n');
      
      return {
        text: `📋 ${items.length} work request(s):\n\n${formatted}`,
        data: items
      };
    }
  },
};

/**
 * Get all tool definitions in MCP format
 */
export function getToolDefinitions() {
  return Object.values(tools).map(tool => ({
    name: tool.name,
    description: tool.description,
    inputSchema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(tool.inputSchema).map(([key, schema]) => [
          key,
          zodToJsonSchema(schema)
        ])
      ),
      required: Object.entries(tool.inputSchema)
        .filter(([_, schema]) => !schema.isOptional?.())
        .map(([key]) => key)
    }
  }));
}

/**
 * Convert Zod schema to JSON Schema (simplified)
 */
function zodToJsonSchema(schema) {
  const description = schema._def?.description || schema.description;
  
  // Handle optional wrapper
  if (schema._def?.innerType) {
    const inner = zodToJsonSchema(schema._def.innerType);
    if (description) inner.description = description;
    return inner;
  }
  
  // Enum
  if (schema._def?.values) {
    return {
      type: 'string',
      enum: schema._def.values,
      ...(description && { description })
    };
  }
  
  // Array
  if (schema._def?.type?.constructor?.name === 'ZodString') {
    return {
      type: 'array',
      items: { type: 'string' },
      ...(description && { description })
    };
  }
  
  if (schema._def?.typeName === 'ZodArray') {
    return {
      type: 'array',
      items: zodToJsonSchema(schema._def.type),
      ...(description && { description })
    };
  }
  
  // String (default)
  return {
    type: 'string',
    ...(description && { description })
  };
}

/**
 * Execute a tool by name
 */
export async function executeTool(name, args) {
  const tool = tools[name];
  if (!tool) {
    throw new Error(`Unknown tool: ${name}`);
  }
  
  // Validate input using Zod
  const schema = z.object(tool.inputSchema);
  const validated = schema.parse(args || {});
  
  // Execute handler
  return await tool.handler(validated);
}

export default tools;
