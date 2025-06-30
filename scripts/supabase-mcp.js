#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Get project ref from Supabase URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl ? supabaseUrl.split('.')[0].replace('https://', '') : '';

// Get access token from command line or environment
const accessToken = process.argv[2] || process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Please provide a Supabase personal access token');
  console.error('Usage: node supabase-mcp.js <access-token>');
  process.exit(1);
}

if (!projectRef) {
  console.error('Could not determine project reference from NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

console.log(`Starting Supabase MCP server for project: ${projectRef}`);

// Start the MCP server
const mcp = spawn('npx', [
  '@supabase/mcp-server-supabase@latest',
  `--project-ref=${projectRef}`,
  '--read-only'
], {
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken
  },
  stdio: 'inherit'
});

mcp.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
});

mcp.on('exit', (code) => {
  console.log(`MCP server exited with code ${code}`);
});