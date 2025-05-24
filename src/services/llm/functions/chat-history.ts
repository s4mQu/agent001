import redisClient from "../../../config/redis-config";

interface ChatMessage {
  content: string;
  role: string;
  options?: any;
  metadata?: any;
}

const TTL = 60 * 60 * 24; // 24 hours

const getChatHistory = async (sessionId: string): Promise<ChatMessage[]> => {
  const history = await redisClient.get(`chat:${sessionId}`);
  return history ? JSON.parse(history) : [];
};

const addMessage = async (sessionId: string, message: ChatMessage): Promise<void> => {
  const history = await getChatHistory(sessionId);
  history.push(message);
  await redisClient.setEx(`chat:${sessionId}`, TTL, JSON.stringify(history));
};

const clearHistory = async (sessionId: string): Promise<void> => {
  await redisClient.del(`chat:${sessionId}`);
};

export const chatHistory = {
  get: getChatHistory,
  add: addMessage,
  clear: clearHistory,
};
