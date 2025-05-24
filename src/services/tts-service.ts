import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { getIO } from "../config/socketIO-config";
import { watchTTSFolder } from "../utils/tts-folder-listener";

export class TTSService {
  private readonly pythonScriptPath: string;
  private readonly pythonCommand: string;
  private readonly outputDir: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, "kokoro-tts", "use-kokoro.py");
    // Try python3 first, fall back to python
    this.pythonCommand = process.platform === "win32" ? "python" : "python3";
    this.outputDir = path.join(__dirname, "..", "audio", "tts");
  }

  async generateSpeech(text: string, voice: string = "bf_emma"): Promise<string> {
    const io = getIO();
    const watcher = watchTTSFolder();

    watcher.on("add", async (filePath) => {
      console.log("TTS file detected:", filePath);
      try {
        const stats = fs.statSync(filePath);

        const fileBuffer = fs.readFileSync(filePath);

        io.emit("tts-file-added", fileBuffer);

        await this.cleanupWavFiles(filePath);
      } catch (error) {
        console.error("Error reading TTS file:", error);
        if (error instanceof Error) {
          console.error("Error details:", {
            message: error.message,
            stack: error.stack,
          });
        }
      }
    });

    watcher.on("error", (error) => {
      console.error("TTS folder watcher error:", error);
    });

    return new Promise((resolve, reject) => {
      // Spawn Python process with text as direct argument
      const pythonProcess = spawn(this.pythonCommand, [
        this.pythonScriptPath,
        "--text",
        text,
        "--voice",
        voice,
      ]);

      let outputPath: string | null = null;
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        const output = data.toString();
        // Look for the generated audio file path in the output
        const match = output.match(/Saved audio to: (.+\.wav)/);
        if (match) {
          // Convert the Python path to a relative path from the output directory
          const fullPath = match[1];
          const fileName = path.basename(fullPath);
          outputPath = path.join(this.outputDir, fileName);
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on("error", (error) => {
        if (error.message.includes("ENOENT")) {
          reject(
            new Error(
              `Python command '${this.pythonCommand}' not found. Please ensure Python is installed and available in your PATH.`
            )
          );
        } else {
          reject(error);
        }
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
          return;
        }

        if (!outputPath) {
          reject(new Error("No audio file was generated"));
          return;
        }
        io.emit("tts-file-added", "TTS process completed successfully.");

        // Wait a bit before closing the watcher to ensure the file is detected
        setTimeout(() => {
          watcher.close();
          resolve(outputPath as string);
        }, 2000);
      });
    });
  }

  /**
   * Cleans up WAV files from the TTS output directory
   * @param filePath Optional specific file path to delete. If not provided, deletes all WAV files in the output directory
   */
  async cleanupWavFiles(filePath?: string): Promise<void> {
    try {
      if (filePath) {
        // Delete specific file
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted WAV file: ${filePath}`);
        }
      } else {
        // Delete all WAV files in the output directory
        const files = fs.readdirSync(this.outputDir);
        for (const file of files) {
          if (file.endsWith(".wav")) {
            const fullPath = path.join(this.outputDir, file);
            fs.unlinkSync(fullPath);
            console.log(`Deleted WAV file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error("Error cleaning up WAV files:", error);
      throw error;
    }
  }
}
