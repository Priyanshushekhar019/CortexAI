import dotenv from "dotenv";
dotenv.config();

import { TavilySearch } from "@langchain/tavily";

let searchToolInstance = null;

export const getSearchTool = () => {
  if (!searchToolInstance) {
    searchToolInstance = new TavilySearch({
      apiKey: process.env.TAVILY_API_KEY || "",
      maxResults: 5,
      topic: "general",
      includeImages: true
    });
  }
  return searchToolInstance;
};

export const searchTool = {
  invoke: async (input) => {
    try {
      const tool = getSearchTool();
      return await tool.invoke(input);
    } catch (err) {
      console.warn("Tavily search invoke error:", err.message);
      return { results: [], images: [] };
    }
  }
};

export const tavilyClient = {
  search: async (query, options = {}) => {
    try {
      const result = await searchTool.invoke({
        query,
        ...options
      });
      return result;
    } catch (err) {
      console.warn("Tavily search client error:", err.message);
      return { results: [], images: [] };
    }
  }
};