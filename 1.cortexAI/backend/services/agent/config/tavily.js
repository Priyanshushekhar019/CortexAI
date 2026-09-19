import dotenv from "dotenv";
dotenv.config();

import { TavilySearch } from "@langchain/tavily";

const searchTool = new TavilySearch({
  apiKey: process.env.TAVILY_API_KEY,
  maxResults: 5,
  topic: "general",
  includeImages: true
});

export const tavilyClient = {
  search: async (query, options = {}) => {
    const result = await searchTool.invoke({
      query,
      ...options
    });

    return result;
  }
};