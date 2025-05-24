import { Ollama } from "@langchain/ollama";

export const useOllama3 = new Ollama({
  baseUrl: "http://192.168.1.118:11434",
  model: "llama3",
  temperature: 1,
  maxRetries: 2,
});
