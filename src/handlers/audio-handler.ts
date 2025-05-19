import { Request, Response } from "express";
import { AudioService } from "../services/audio-service";
import { logger } from "../utils/logger";
import { callOllama } from "../services/llm/functions/call-ollama";
import { TTSService } from "../services/tts-service";

class AudioHandler {
  private audioService: AudioService;

  constructor() {
    this.audioService = new AudioService();
  }

  transcribe = async (req: Request, res: Response): Promise<void> => {
    try {
      const ttsService = new TTSService();

      logger.info("Received audio transcription request");

      if (!req.file) {
        logger.error("No file received in request");
        res.status(400).json({ error: "No audio file provided" });
        return;
      }

      // Log file details
      logger.info("Received file details:", {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      });

      // takes the audio file and transcribes it
      const transcription = await this.audioService.transcribeAudio(req.file.path);

      // sends the transcription to the llm
      const response = await callOllama(transcription);

      // generates the speech from the response // Sockets are used to send the wav file to the client in here.
      const ttsResponse = await ttsService.generateSpeech(response, "af_heart");

      res.status(200).json({
        success: true,
        transcription,
        response,
        ttsResponse,
        fileDetails: {
          filename: req.file.filename,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    } catch (error) {
      logger.error("Error in audio transcription:", error);
      res.status(500).json({
        success: false,
        error: "Failed to process audio file",
      });
    }
  };
}

export const audioHandler = new AudioHandler();
