#!/usr/bin/env node

// Test script to verify admin pages are working correctly
const baseUrl = process.env.BASE_URL || 'http://localhost:3002';

const pages = [
  '/admin/consultants-debug',
  '/admin/test-odoo',
  '/admin/consultants',
  '/admin/products',
  '/admin/import-odoo',
  '/api/test-consultants'
];

async function testPage(url) {
  try {
    const response = await fetch(baseUrl + url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/json',
      },
      redirect: 'manual' // Don't follow redirects automatically
    });
    
    return {
      url,
      status: response.status,
      redirected: response.headers.get('location') || null,
      contentType: response.headers.get('content-type'),
      ok: response.ok || response.status === 302 || response.status === 307
    };
  } catch (error) {
    return {
      url,
      error: error.message,
      ok: false
    };
  }
}

async function main() {
  console.log(`Testing admin pages at ${baseUrl}...`);
  console.log('');
  
  for (const page of pages) {
    const result = await testPage(page);
    const status = result.ok ? '✓' : '✗';
    const statusText = result.error 
      ? `Error: ${result.error}`
      : `Status: ${result.status}`;
    
    console.log(`${status} ${result.url} - ${statusText}`);
    
    if (result.redirected) {
      console.log(`  → Redirects to: ${result.redirected}`);
    }
  }
}

// Only run if server is available
fetch(baseUrl)
  .then(() => main())
  .catch(() => console.error(`Server not running at ${baseUrl}. Please start the Next.js server first.`));