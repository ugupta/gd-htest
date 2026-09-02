import { Helmet } from '@dr.pogodin/react-helmet';
import { useState } from 'react';
import { Activity, Braces, Database, Server } from 'lucide-react';
import { runtime_lab } from 'virtual:content';

type Output = Record<string, unknown>;
type Status = 'idle' | 'loading' | 'success' | 'error';

const cardIcons = [Braces, Database, Server, Activity];

export default function RuntimeLabPage() {
  const [cacheKey, setCacheKey] = useState('');
  const [cacheBlocks, setCacheBlocks] = useState('1');
  const [primeCount, setPrimeCount] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [output, setOutput] = useState<Output | null>(null);

  async function run(action: string, payload: Record<string, unknown> = {}) {
    setStatus('loading');
    try {
      const response = await window.fetch('/api/runtime-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
      });
      const body = (await response.json()) as Output;
      if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Request failed.');
      setOutput(body);
      setStatus('success');
    } catch (error) {
      setOutput({
        error: error instanceof Error ? error.message : 'Request failed.',
      });
      setStatus('error');
    }
  }

  return (
    <>
      <Helmet>
        <title>Runtime Lab — Hello World</title>
        <meta name="description" content="A controlled hosting runtime diagnostics dashboard." />
        <link rel="canonical" href="https://8rqwes8j93.preview.c35.airoapp.ai/" />
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className="bg-slate-950 px-4 py-8 font-mono text-slate-100 sm:px-8 lg:px-12">
        <section className="mx-auto max-w-7xl">
          <div className="mb-10 border-b border-slate-700 pb-6">
            <p className="mb-3 text-xs text-emerald-400">{runtime_lab.eyebrow}</p>
            <h1 className="font-sans text-4xl font-semibold tracking-tight text-white sm:text-5xl">{runtime_lab.title}</h1>
            <p className="mt-3 max-w-2xl font-sans text-sm leading-6 text-slate-400">{runtime_lab.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {runtime_lab.cards.map((card, index) => {
              const Icon = cardIcons[index];
              return (
                <article key={card.title} className="rounded-lg border border-slate-700 bg-slate-900 p-5 shadow-sm">
                  <div className="mb-7 flex items-start justify-between gap-4">
                    <div>
                      <Icon aria-hidden="true" className="mb-4 h-5 w-5 text-emerald-400" strokeWidth={1.6} />
                      <h2 className="font-sans text-lg font-medium text-white">{card.title}</h2>
                      <p className="mt-2 max-w-md font-sans text-sm leading-6 text-slate-400">{card.body}</p>
                    </div>
                    <span className="rounded border border-emerald-900 bg-emerald-950 px-2 py-1 text-[10px] text-emerald-400">server</span>
                  </div>
                  {index === 1 && (
                    <div className="grid grid-cols-[1fr_7rem] gap-2">
                      <label className="block text-xs text-slate-300">
                        {runtime_lab.cacheLabel}
                        <input value={cacheKey} onChange={(event) => setCacheKey(event.target.value)} placeholder={runtime_lab.cachePlaceholder} disabled={status === 'loading'} className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none" />
                      </label>
                      <label className="block text-xs text-slate-300">
                        10 MiB blocks
                        <input type="number" min="1" step="1" value={cacheBlocks} onChange={(event) => setCacheBlocks(event.target.value)} disabled={status === 'loading'} className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none" />
                      </label>
                    </div>
                  )}
                  {index === 3 && (
                    <label className="block text-xs text-slate-300">
                      {runtime_lab.primeLabel}
                      <input inputMode="numeric" value={primeCount} onChange={(event) => setPrimeCount(event.target.value)} placeholder={runtime_lab.primePlaceholder} disabled={status === 'loading'} className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none" />
                    </label>
                  )}
                  <button type="button" disabled={status === 'loading'} onClick={() => run(index === 0 ? 'environment' : index === 1 ? 'cache' : index === 2 ? 'system' : 'primes', index === 1 ? { key: cacheKey, blocks: cacheBlocks } : index === 3 ? { count: primeCount } : {})} className="mt-5 rounded bg-emerald-500 px-3 py-2 font-sans text-sm font-medium text-slate-950 transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
                    {status === 'loading' ? 'Running…' : card.action}
                  </button>
                </article>
              );
            })}
          </div>

          <section aria-live="polite" className="mt-5 rounded-lg border border-slate-700 bg-slate-900 p-5">
            <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-4">
              <h2 className="font-sans text-base font-medium text-white">{runtime_lab.outputTitle}</h2>
              <span className={status === 'error' ? 'text-xs text-red-400' : status === 'success' ? 'text-xs text-emerald-400' : 'text-xs text-slate-500'}>{status}</span>
            </div>
            <pre className="min-h-44 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">{output ? JSON.stringify(output, null, 2) : runtime_lab.idleMessage}</pre>
          </section>
        </section>
      </main>
    </>
  );
}
