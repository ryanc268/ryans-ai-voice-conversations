import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";

import Link from "next/link";
import Image from "next/image";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAnglesDown, faAnglesUp } from "@fortawesome/free-solid-svg-icons";

import azureCognitive from "/public/microsoft_cognitive_banner.png";
import gptBanner from "/public/chatgpt_banner.png";
import { useState } from "react";

const Home: NextPage = () => {
  const [toggle, setToggle] = useState(false);

  return (
    <>
      <Head>
        <title>Ryans AI Convos</title>
        <meta
          name="description"
          content="Voice chat with an AI about anything!"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#1b1b1b] to-[#020e18]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 text-white">
          <div className="absolute top-0 left-0 flex w-full items-center justify-center bg-zinc-800 p-2 text-center text-sm md:p-4 md:text-lg">
            <h4>
              Want to see more of my work? Click{" "}
              <Link
                className="text-cyan-custom"
                href="https://www.ryancoppa.com"
              >
                here
              </Link>{" "}
              to see my Portfolio!
            </h4>
          </div>
          <h1 className="text-2xl sm:text-[5rem]">
            Ryan&apos;s <span className="text-cyan-custom">AI Voice</span>{" "}
            Conversations App
          </h1>
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>
          <motion.div
            layout
            className="absolute bottom-0 flex w-full flex-col items-center justify-center gap-4 rounded-xl bg-zinc-800 p-2 shadow-inner shadow-zinc-500"
            onClick={() => setToggle(!toggle)}
          >
            <motion.div
              layout
              className="flex cursor-pointer items-center justify-center gap-4"
            >
              <h2 className="text-lg md:text-2xl">Powered By:</h2>
              <FontAwesomeIcon
                className="w-4 md:w-6"
                icon={toggle ? faAnglesDown : faAnglesUp}
              />
            </motion.div>
            {toggle && (
              <motion.div
                layout
                className="flex items-center justify-center gap-8"
              >
                <Image
                  className="w-28 md:w-40"
                  src={azureCognitive}
                  width={0}
                  height={0}
                  alt="Logo"
                />
                <Image
                  className="w-28 md:w-40"
                  src={gptBanner}
                  width={0}
                  height={0}
                  alt="Logo"
                />
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-8">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
      {sessionData && (
        <Link
          className="m-4 text-center md:my-8 md:mx-16 md:scale-150"
          href="/chat"
        >
          <h4 className="scale-90 text-xl text-white">Chat Now!</h4>
          <Image
            className="m-auto w-20"
            src="/favicon.ico"
            width={40}
            height={40}
            alt="Logo"
          />
        </Link>
      )}
    </div>
  );
};
