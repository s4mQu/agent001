import { createClient } from "redis";
import { log } from "../utils/logger";

const redisClient = createClient({
  url: "redis://redis:6379",
});

redisClient.on("error", (err) => {
  log.error("Redis error: ", err);
});

redisClient.on("connect", () => {
  log.info("Redis connected");
});

redisClient.on("reconnecting", () => {
  log.error("Redis reconnecting");
});

redisClient.on("ready", () => {
  log.info("Redis ready");
});

(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    log.error("Redis connection error: ", err);
  }
})();

export default redisClient;
