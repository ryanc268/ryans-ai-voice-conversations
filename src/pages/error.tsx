import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

export const ErrorPage = () => {
  return (
    <>
      <Head>
        <title>Unauthorized Access</title>
        <meta
          name="description"
          content="You are not authorized to view this page"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="fixed h-full w-full bg-gradient-to-b from-[#1b1b1b] to-[#020e18]">
        <div className="flex flex-col items-center justify-center gap-12 px-4 py-16 text-center text-white">
          <h3 className="text-3xl md:text-7xl">Unauthorized Access</h3>
          <Link className="text-center md:m-8 md:scale-150" href="/">
            <h4 className="scale-90 text-3xl">Home</h4>
            <Image
              className="m-auto w-28"
              src="/favicon.ico"
              width={40}
              height={40}
              alt="Logo"
            />
          </Link>
        </div>
      </main>
    </>
  );
};

export default ErrorPage;
