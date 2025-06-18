'use client'
import Head from 'next/head'
import Chat from '../components/Chat'

export default function Home() {
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Head>
        <title>Alberta RAG Prototype</title>
      </Head>
      <h1 className="text-xl font-semibold mb-4">Alberta Economic Research Assistant</h1>
      <Chat />
    </div>
  );
}
