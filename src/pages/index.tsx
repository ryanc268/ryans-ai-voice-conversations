import { type NextPage } from "next";
import Head from "next/head";
import { signIn, signOut, useSession } from "next-auth/react";

import Link from "next/link";
import Image from "next/image";
import ErrorPage from "./error";

const Home: NextPage = () => {
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
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-2xl text-white sm:text-[5rem]">
            Ryan&apos;s <span className="text-cyan-custom">AI Voice</span>{" "}
            Conversations App
          </h1>
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>
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
      {sessionData ? (
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
      ) : (
        <ErrorPage />
      )}
    </div>
  );
};
