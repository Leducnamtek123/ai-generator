#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3000/api/v1";
const API_KEY = process.env.API_KEY || "";

const server = new Server(
  {
    name: "ai-generator",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_templates",
        description: "List available AI generation templates",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", description: "Filter by type (image, video, etc.)" },
          },
        },
      },
      {
        name: "create_generation",
        description: "Create a new AI generation task",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["image", "video", "upscale", "music", "sfx", "voice"] },
            prompt: { type: "string" },
            model: { type: "string" },
            aspectRatio: { type: "string" },
            provider: { type: "string" },
          },
          required: ["type", "prompt"],
        },
      },
      {
        name: "get_generation_status",
        description: "Get status of a generation task",
        inputSchema: {
          type: "object",
          properties: {
            id: { type: "string", description: "Generation ID" },
          },
          required: ["id"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const headers = { "X-API-KEY": API_KEY };

  try {
    if (name === "list_templates") {
      const response = await axios.get(`${API_BASE_URL}/templates`, {
        params: args,
        headers,
      });
      return { content: [{ type: "text", text: JSON.stringify(response.data) }] };
    }

    if (name === "create_generation") {
      const { type, ...data } = args as any;
      const response = await axios.post(`${API_BASE_URL}/generations/${type}`, data, {
        headers,
      });
      return { content: [{ type: "text", text: JSON.stringify(response.data) }] };
    }

    if (name === "get_generation_status") {
      const response = await axios.get(`${API_BASE_URL}/generations/${args?.id}`, {
        headers,
      });
      return { content: [{ type: "text", text: JSON.stringify(response.data) }] };
    }

    throw new Error(`Tool not found: ${name}`);
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: error.response?.data?.message || error.message }],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("AI Generator MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
