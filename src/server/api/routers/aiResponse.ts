import { z } from "zod";
import { ChatGPTAPI } from "chatgpt";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { type GPTConvo } from "~/utils/interfaces";

const API = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

export const aiResponseRouter = createTRPCRouter({
  respond: publicProcedure
    .input(
      z.object({
        text: z.string().min(1),
        parentId: z.string(),
        convoId: z.string().optional(),
        voiceType: z.string(),
      })
    )
    .mutation(({ input }) => {
      return fetchResponse(input);
    }),
});

const fetchResponse = async (
  input: Omit<GPTConvo, "voice">
): Promise<Omit<GPTConvo, "voiceType">> => {
  const res = await API.sendMessage(input.text, {
    timeoutMs: 20000,
    conversationId: input.convoId,
    parentMessageId: input.parentId,
  });
  console.log("Input Received:", input);
  console.log("Output Returned:", res.text);
  const buffer = await speechSynthesis(res.text, input.voiceType);
  const uint8Array = new Uint8Array(buffer);
  const serializedData = JSON.stringify(Array.from(uint8Array));
  return {
    text: res.text,
    parentId: res.id,
    convoId: res.conversationId,
    voice: serializedData,
  };
};

const speechSynthesis = async (
  text: string,
  voiceType: string
): Promise<ArrayBuffer> => {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.SPEECH_KEY as string,
    process.env.SPEECH_REGION as string
  );
  const pullStream = sdk.AudioOutputStream.createPullStream();
  const audioConfig = sdk.AudioConfig.fromStreamOutput(pullStream);

  speechConfig.speechSynthesisVoiceName = voiceType;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise(function (resolve, reject) {
    synthesizer.speakTextAsync(
      text,
      function (result) {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log("synthesis finished.");
          resolve(result.audioData);
        } else {
          console.error(
            "Speech synthesis canceled, " +
              result.errorDetails +
              "\nDid you set the speech resource key and region values?"
          );
          reject();
        }
        synthesizer.close();
      },
      function (err) {
        console.trace("err - " + err);
        synthesizer.close();
      }
    );
  });
};
