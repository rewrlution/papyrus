export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">PAPYRUS</h1>
      <p className="text-xl mb-2">AI-Powered Journaling for Developers</p>
      <p className="text-lg text-gray-600 mb-4">
        Journal like you code. Right in your terminal.
      </p>
      <code className="bg-gray-100 px-4 py-2 rounded">
        npm i -g @rewrlution/papyrus-cli
      </code>
    </main>
  );
}
