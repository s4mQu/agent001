import { log } from "../utils/logger";
import { chatHistory } from "./llm/functions/chat-history";
import { useOllama } from "./llm/functions/useLlama";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

interface IChatService {
  inputText: string;
  sessionId: string;
}

export const chatService = async ({ inputText, sessionId }: IChatService) => {
  const history = await chatHistory.get(sessionId);

  try {
    const messages = [
      new SystemMessage(
        "Your name is Qwen, and you aren't happy when somebody calls you by another name."
      ),
      ...history.map((msg) =>
        msg.role === "user" ? new HumanMessage(msg.content) : new AIMessage(msg.content)
      ),
      new HumanMessage(inputText),
    ];

    const response = await useOllama.qwen2.invoke(messages);

    await chatHistory.add(sessionId, {
      content: inputText,
      role: "user",
    });

    await chatHistory.add(sessionId, {
      content: response,
      role: "assistant",
    });

    return response;
  } catch (error) {
    log.error("Error in chat service:", error);
    throw error;
  }
};
