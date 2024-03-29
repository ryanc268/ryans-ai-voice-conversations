import { z } from "zod";
import { ChatGPTAPI } from "chatgpt";
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type GPTDetail, type GPTConvo } from "~/utils/interfaces";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { TRPCError } from "@trpc/server";
import { logWithUTCDate } from "~/utils/dateUtil";
import { LogLevel } from "~/utils/enums";

const API = new ChatGPTAPI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(2, "10 s"),
  analytics: true,
});

export const aiResponseRouter = createTRPCRouter({
  respond: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1),
        parentId: z.string(),
        convoId: z.string().optional(),
        voiceType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { success: rateLimitOk } = await ratelimit.limit(userId);

      if (!rateLimitOk) {
        logWithUTCDate(
          `Rate Limit Exceeded For userId: ${userId}`,
          LogLevel.ERROR
        );
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }

      return fetchResponse(input);
    }),
});

const fetchResponse = async (
  input: Omit<GPTConvo, "voice" | "tokensUsed">
): Promise<Omit<GPTConvo, "voiceType">> => {
  const res = await API.sendMessage(input.text, {
    timeoutMs: 20000,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    conversationId: input.convoId,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    parentMessageId: input.parentId,
  });
  console.log("Input Received:", input);
  console.log("Output Returned:", res.text);
  const detail = res.detail as GPTDetail;
  console.log("Tokens Used:", detail.usage.total_tokens);
  const buffer = await speechSynthesis(res.text, input.voiceType);
  const uint8Array = new Uint8Array(buffer);
  const serializedData = JSON.stringify(Array.from(uint8Array));
  return {
    text: res.text,
    tokensUsed: Math.ceil(detail.usage.total_tokens * 1.5),
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
