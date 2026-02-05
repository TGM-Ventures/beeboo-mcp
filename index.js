#!/usr/bin/env node

/**
 * BeeBoo MCP Server
 * 
 * Model Context Protocol server exposing BeeBoo's Human-in-the-Loop
 * infrastructure to AI agents like Claude, Cursor, and Windsurf.
 * 
 * Usage:
 *   BEEBOO_API_KEY=bb_sk_xxx node index.js
 * 
 * Or via npx:
 *   npx @beeboo/mcp-server
 */

import { startServer } from './src/server.js';

startServer();
