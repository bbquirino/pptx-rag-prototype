import Head from "next/head";
import { Chat } from "../components/Chat";

export default function Home() {
  return (
    <>
      <Head>
        <title>PPTX RAG Prototype</title>
      </Head>
      <main className="min-h-screen bg-gray-100">
        <Chat />
      </main>
    </>
  );
}
