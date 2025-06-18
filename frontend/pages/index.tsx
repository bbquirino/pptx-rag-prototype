import Head from "next/head";

export default function Home() {
  return (
    <>
      <Head>
        <title>PPTX RAG Prototype</title>
      </Head>
      <main className="min-h-screen p-8 flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">🎉 Deployment Successful!</h1>
        <p className="text-lg">This is the working homepage from <code>index.tsx</code>.</p>
        <p className="text-sm mt-2 text-gray-500">You can now start building your frontend here.</p>
      </main>
    </>
  );
}
