import { Router } from "express";
import { audioHandler } from "../handlers/audio-handler";
import { upload } from "../middleware/multer-config";

const router = Router();

// Route for audio transcription
router.post("/transcribe", upload.single("audio"), audioHandler.transcribe);

export default router;
