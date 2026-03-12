import { AssemblyAI } from "assemblyai";

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function transcribeAssemblyAudio(audioUrl: string) {
  const transcript = await client.transcripts.transcribe({
    audio: audioUrl,
  });

  if (transcript.status === "error") {
    throw new Error(transcript.error || "AssemblyAI transcription failed");
  }

  return transcript.text || "";
}