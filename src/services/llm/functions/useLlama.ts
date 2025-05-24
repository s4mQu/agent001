import { Ollama } from "@langchain/ollama";

const BASE_URL = "http://192.168.1.118:11434";

const useOllama3 = new Ollama({
  baseUrl: BASE_URL,
  model: "llama3",
});

const useQwen25 = new Ollama({
  baseUrl: BASE_URL,
  model: "qwen2.5:7b",
});

export const useOllama = {
  llama3: useOllama3,
  qwen2: useQwen25,
};
