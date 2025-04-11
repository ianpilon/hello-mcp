import { createServer } from 'http';

// Define the MCP server configuration
const SERVER_NAME = 'hello-mcp';
const SERVER_VERSION = '1.0.0';
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Tool definition for "sayHello"
const tools = [
  {
    name: 'sayHello',
    description: 'A warm, friendly greeting from the MCP server.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name of the person to greet.' }
      },
      required: ['name']
    }
  }
];

// Create HTTP server
const server = createServer((req, res) => {
  // Enable CORS for all routes
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Handle MCP tool listing
  if (req.url === '/tools' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tools));
    return;
  }

  // Handle tool invocation
  if (req.url === '/invoke' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { tool, parameters } = JSON.parse(body);
        if (tool === 'sayHello') {
          const { name } = parameters;
          const response = `Hello from MCP server, ${name}!`;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ result: response }));
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Tool not found' }));
        }
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  // Handle SSE for MCP communication
  if (req.url === '/sse') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    });
    
    // Send initial connection message
    const connectMessage = {
      type: 'connection',
      status: 'connected',
      server: SERVER_NAME,
      version: SERVER_VERSION
    };
    res.write(`event: connection\ndata: ${JSON.stringify(connectMessage)}\n\n`);
    return;
  }

  // Default response
  res.writeHead(404);
  res.end();
});

// Start the server
server.listen(PORT, () => {
  console.log(`MCP server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`- Tools listing: http://localhost:${PORT}/tools`);
  console.log(`- SSE endpoint: http://localhost:${PORT}/sse`);
});
