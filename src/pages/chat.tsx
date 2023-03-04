import { type NextPage } from "next";
import Head from "next/head";
import { type ChangeEvent, useState, useEffect, useRef } from "react";
import { ThreeDots } from "react-loader-spinner";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";

import * as sdk from "microsoft-cognitiveservices-speech-sdk";

import { api } from "~/utils/api";
import { AIaus, AIeu, AIna, AIRegion, Chatter } from "~/utils/enums";

const Chat: NextPage = () => {
  const TEXTAREA_COLS = 100;
  const TEXTAREA_ROWS = 2;
  const HISTORY_LIMIT = 50;

  const SPEECH_CONFIG = sdk.SpeechConfig.fromSubscription(
    process.env.NEXT_PUBLIC_SPEECH_KEY as string,
    process.env.NEXT_PUBLIC_SPEECH_REGION as string
  );

  const [sendAllowed, setSendAllowed] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [convoId, setConvoId] = useState<string | undefined>("");
  const [voiceRegion, setVoiceRegion] = useState<string>("NA");
  const [voiceType, setVoiceType] = useState<string>("en-US-AmberNeural");

  const [messageHistory, setMessageHistory] = useState<[Chatter, string][]>([]);

  const [isRecording, setIsRecording] = useState<boolean>();

  const speechRecognizer = useRef<sdk.SpeechRecognizer>();

  const scrollBottomRef = useRef<HTMLDivElement | null>(null);

  const aiResponse = api.response.respond.useMutation();

  const sendData = async (voiceMessage?: string) => {
    setMessageHistory((m) => [...m, [Chatter.HUMAN, voiceMessage || message]]);
    await aiResponse.mutateAsync({
      text: voiceMessage || message,
      parentId,
      convoId,
      voiceType,
    });
    setMessage("");
    setSendAllowed(false);
  };

  const validateTextArea = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setIsRecording(false);
    setMessage(e.target.value.replace("\n", ""));
    setSendAllowed(e.target.value.trim() ? true : false);
  };

  const checkSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    if (e.keyCode == 13 && e.shiftKey == false && sendAllowed) {
      void sendData();
    }
  };

  const clearTextArea = () => {
    setMessage("");
    setParentId("");
    setConvoId("");
    setMessageHistory([]);
    setSendAllowed(false);
    setIsRecording(false);
  };

  const playBuffer = (audioDataString: string) => {
    const uint8Array = new Uint8Array(
      JSON.parse(audioDataString) as Iterable<number>
    );
    const audioData: ArrayBuffer = uint8Array.buffer;
    const audioContext = new AudioContext();
    const source = audioContext.createBufferSource();
    void audioContext.decodeAudioData(audioData, (decodedData) => {
      source.buffer = decodedData;
      source.connect(audioContext.destination);
      source.start();
    });
  };

  const record = () => {
    const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();

    speechRecognizer.current = new sdk.SpeechRecognizer(
      SPEECH_CONFIG,
      audioConfig
    );

    speechRecognizer.current.recognizeOnceAsync((result) => {
      switch (result.reason) {
        case sdk.ResultReason.RecognizedSpeech:
          console.log(`RECOGNIZED: Text=${result.text}`);
          setMessage(result.text);
          void sendData(result.text);
          setSendAllowed(true);
          speechRecognizer.current && speechRecognizer.current.close();
          break;
        case sdk.ResultReason.NoMatch:
          console.log("NOMATCH: Speech could not be recognized.");
          speechRecognizer.current && speechRecognizer.current.close();
          break;
        case sdk.ResultReason.Canceled:
          const cancellation = sdk.CancellationDetails.fromResult(result);
          console.log(`CANCELED: Reason=${cancellation.reason}`);

          if (cancellation.reason == sdk.CancellationReason.Error) {
            console.log(`CANCELED: ErrorCode=${cancellation.ErrorCode}`);
            console.log(`CANCELED: ErrorDetails=${cancellation.errorDetails}`);
            console.log(
              "CANCELED: Did you set the speech resource key and region values?"
            );
          }
          speechRecognizer.current && speechRecognizer.current.close();
          break;
      }
    });
  };

  const determineVoiceDropdown = () => {
    switch (voiceRegion) {
      case AIRegion.NORTH_AMERICA:
        return AIna;
      case AIRegion.AUSTRALIA:
        return AIaus;
      case AIRegion.EUROPE:
        return AIeu;
      default:
        return AIna;
    }
  };

  useEffect(() => {
    if (aiResponse.data) {
      setMessageHistory((m) => [...m, [Chatter.AI, aiResponse.data.text]]);
      setParentId(aiResponse.data.parentId);
      setConvoId(aiResponse.data.convoId);
      playBuffer(aiResponse.data.voice);
    }
  }, [aiResponse.data]);

  //This one is tricky because if we don't wait for parentId to change, we can skip the beginning of the convo by not using the updated value
  useEffect(() => {
    isRecording && record();
  }, [parentId]);

  useEffect(() => {
    messageHistory.length >= HISTORY_LIMIT && messageHistory.shift();
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageHistory]);

  useEffect(() => {
    if (isRecording) {
      record();
      setMessage("");
      setSendAllowed(false);
    } else speechRecognizer.current && speechRecognizer.current.close();
  }, [isRecording]);

  return (
    <>
      <Head>
        <title>Ryans AI Convos</title>
        <meta name="description" content="Voice chat with an AI about anything!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="fixed h-full w-full bg-gradient-to-b from-[#1b1b1b] to-[#020e18]">
        <div className="relative flex h-full flex-col items-center gap-2 rounded-lg border px-4 py-4 text-slate-200 md:mx-auto md:w-1/2">
          <a
            className="absolute top-0 right-0 m-4 text-center md:m-8 md:scale-150"
            href="https://www.ryancoppa.com"
          >
            <h4 className="scale-90 text-xs">Portfolio</h4>
            <Image
              className="m-auto w-8"
              src="/favicon.ico"
              width={40}
              height={40}
              alt="Logo"
            />
          </a>
          <div className="flex flex-col text-center">
            <h2 className="text-xl md:text-4xl">Text / Voice Chat With AI</h2>
            <h2 className="text-sm md:text-base">By Ryan Coppa</h2>
          </div>
          <div className="flex w-3/4 items-center justify-evenly text-xs md:text-base">
            <div className="flex items-center">
              <label htmlFor="region">Region</label>
              <select
                className="m-2 rounded-md border bg-transparent p-0.5 md:p-1"
                value={voiceRegion}
                onChange={(e) => setVoiceRegion(e.target.value)}
                id="region"
              >
                {Object.keys(AIRegion).map((k, i) => (
                  <option
                    className="bg-zinc-900"
                    key={i}
                    value={
                      Object.values(AIRegion)[Object.keys(AIRegion).indexOf(k)]
                    }
                  >
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label htmlFor="voice">Voice</label>
              <select
                className="m-2 rounded-md border bg-transparent p-0.5 md:p-1"
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value)}
                id="voice"
              >
                {Object.keys(determineVoiceDropdown()).map((k, i) => (
                  <option
                    className="bg-zinc-900"
                    key={i}
                    value={
                      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                      Object.values(determineVoiceDropdown())[
                        Object.keys(determineVoiceDropdown()).indexOf(k)
                      ]
                    }
                  >
                    {k}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            className={`flex items-center justify-center rounded-lg border py-2 px-4 hover:bg-violet-900 ${
              isRecording ? "border-red-600" : ""
            }`}
            onClick={() => setIsRecording((r) => !r)}
          >
            {isRecording ? "Stop" : "Start"} Recording
            <FontAwesomeIcon
              className="w-6 pl-2"
              color={isRecording ? "rgb(220 38 38)" : ""}
              icon={faMicrophone}
            />
          </button>
          <div className="my-2 w-5/6 overflow-y-auto rounded-lg text-sm md:text-base">
            {messageHistory.map((m, i) => (
              <div key={i} className="flex">
                <h2 className="w-12 p-1 ">{m[0]}</h2>
                <div
                  className={`font-montserrat my-1 w-full whitespace-pre-wrap rounded-lg bg-opacity-25 px-6 text-left ${
                    m[0] === Chatter.HUMAN ? "bg-cyan-custom" : "bg-cyan-900"
                  }`}
                  key={i}
                >
                  {m[1]}
                </div>
              </div>
            ))}
            {aiResponse.isLoading && (
              <div className="flex">
                <h2 className="w-12 p-1">AI</h2>
                <div className="my-1 w-full rounded-lg bg-cyan-900 bg-opacity-25 px-12">
                  <ThreeDots
                    height="20"
                    width="20"
                    radius="9"
                    color="#4fa94d"
                    ariaLabel="three-dots-loading"
                    wrapperStyle={{}}
                    visible={true}
                  />
                </div>
              </div>
            )}
            <div ref={scrollBottomRef}></div>
          </div>
          <textarea
            className="mt-auto h-12 w-5/6 resize-none rounded-lg border bg-transparent p-2 text-sm md:h-20"
            placeholder="Enter your prompt..."
            spellCheck="false"
            value={message}
            rows={TEXTAREA_ROWS}
            cols={TEXTAREA_COLS}
            maxLength={TEXTAREA_COLS * TEXTAREA_ROWS}
            onChange={validateTextArea}
            onKeyUp={checkSubmit}
          />
          <div className="my-2 flex w-full justify-evenly md:text-xl">
            <button
              className="rounded-lg border px-6 py-2 hover:bg-violet-900 disabled:opacity-25 disabled:hover:bg-transparent"
              // eslint-disable-next-line @typescript-eslint/no-misused-promises
              onClick={() => sendData()}
              type="submit"
              disabled={aiResponse.isLoading || !sendAllowed}
            >
              Send
            </button>
            <button
              className="rounded-lg border px-6 py-2 hover:bg-violet-900 disabled:opacity-25 disabled:hover:bg-transparent"
              onClick={clearTextArea}
              disabled={aiResponse.isLoading}
            >
              Clear
            </button>
          </div>
        </div>
      </main>
    </>
  );
};

export default Chat;
