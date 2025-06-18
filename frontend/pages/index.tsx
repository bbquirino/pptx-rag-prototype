// Trigger redeploy – homepage test

import Head from 'next/head';
import { Chat } from '../components/Chat';

export default function Home() {
  return (
    <>
      <Head>
        <title>Alberta Perspectives Chat</title>
        <meta name="description" content="Ask economic questions powered by Alberta research data" />
      </Head>
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-center">Alberta Perspectives Chat</h1>
          <Chat />
        </div>
      </main>
    </>
  );
}
