import { createSignal, onCleanup, onMount } from 'solid-js';

import '../chess-o-matic.css';

type ChessEngineModule = typeof import('../../../game-engine');

type ChessOMaticAppProps = {
  readonly autoloadEngine?: boolean;
};

export function ChessOMaticApp(props: ChessOMaticAppProps) {
  let boardEl: HTMLElement | undefined;
  let inputEl: HTMLParagraphElement | undefined;
  let pgnEl: HTMLPreElement | undefined;
  let promotionDialogEl: HTMLDivElement | undefined;

  const [errorMessage, setErrorMessage] = createSignal<string>();
  const [isInitializing, setIsInitializing] = createSignal(true);
  const [isListening, setIsListening] = createSignal(false);
  const [isSoundEnabled, setIsSoundEnabled] = createSignal(false);
  const [statusMessage, setStatusMessage] = createSignal('Loading local speech model…');

  let gameEngine: ChessEngineModule | undefined;

  const syncAudioState = () => {
    if (!gameEngine) {
      return;
    }

    setIsListening(gameEngine.gameEngineIsAudioInputOn());
    setIsSoundEnabled(gameEngine.gameEngineIsAudioOutputOn());
  };

  onMount(async () => {
    if (props.autoloadEngine === false) {
      setIsInitializing(false);
      setStatusMessage('Component test mode');
      return;
    }

    if (!boardEl || !inputEl || !pgnEl || !promotionDialogEl) {
      setErrorMessage('The chess board failed to mount.');
      setIsInitializing(false);
      return;
    }

    try {
      gameEngine = await import('../../../game-engine');
      await gameEngine.gameEngineInit({
        boardEl,
        inputEl,
        pgnEl,
        promotionDialogEl,
        initialSettings: {
          audioInputOn: true,
          audioOutputOn: false,
        },
      });

      syncAudioState();
      setStatusMessage('Ready for voice input');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown initialization error';
      setErrorMessage(
        `Unable to initialize Chess-o-Matic. Add the local Vosk model to public/models/vosk-model-small-en-us-0.15.zip and retry. (${message})`
      );
      setStatusMessage('Initialization failed');
    } finally {
      setIsInitializing(false);
    }
  });

  onCleanup(() => {
    if (gameEngine) {
      void gameEngine.gameEngineExit();
    }
  });

  const toggleListening = async () => {
    if (!gameEngine) {
      return;
    }

    await gameEngine.gameEngineAudioInputToggle();
    syncAudioState();
    setStatusMessage(gameEngine.gameEngineIsAudioInputOn() ? 'Listening for moves' : 'Voice input paused');
  };

  const toggleSound = async () => {
    if (!gameEngine) {
      return;
    }

    await gameEngine.gameEngineAudioOutputToggle();
    syncAudioState();
    setStatusMessage(gameEngine.gameEngineIsAudioOutputOn() ? 'Move sounds enabled' : 'Move sounds muted');
  };

  return (
    <main class="app-shell">
      <section class="hero-card mx-auto flex w-full max-w-7xl flex-col gap-8 rounded-[2rem] px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
        <div class="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,30rem)] lg:items-start">
          <div class="space-y-6">
            <div class="space-y-4">
              <p class="text-xs uppercase tracking-[0.38em] text-amber-200/70">SolidStart SPA</p>
              <div class="space-y-3">
                <h1 class="max-w-3xl text-4xl leading-none text-slate-50 sm:text-5xl lg:text-6xl">
                  Chess-o-Matic
                </h1>
                <p class="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  A voice-guided chess board for the browser, rebuilt as a SolidStart static web app and ready for
                  future account and sync features.
                </p>
              </div>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <button
                class="rounded-2xl border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-left transition hover:border-amber-200/50 hover:bg-amber-100/15 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isInitializing() || !!errorMessage()}
                onClick={() => void toggleListening()}
                type="button"
              >
                <span class="block text-xs uppercase tracking-[0.28em] text-amber-100/60">Microphone</span>
                <span class="mt-2 block text-lg text-slate-50">{isListening() ? 'Stop Listening' : 'Start Listening'}</span>
              </button>

              <button
                class="rounded-2xl border border-sky-200/20 bg-sky-100/10 px-4 py-3 text-left transition hover:border-sky-200/50 hover:bg-sky-100/15 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isInitializing() || !!errorMessage()}
                onClick={() => void toggleSound()}
                type="button"
              >
                <span class="block text-xs uppercase tracking-[0.28em] text-sky-100/60">Audio</span>
                <span class="mt-2 block text-lg text-slate-50">{isSoundEnabled() ? 'Mute Sounds' : 'Enable Sounds'}</span>
              </button>

              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span class="block text-xs uppercase tracking-[0.28em] text-slate-400">Hosting</span>
                <span class="mt-2 block text-lg text-slate-50">Static-first</span>
              </div>

              <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <span class="block text-xs uppercase tracking-[0.28em] text-slate-400">Board</span>
                <span class="mt-2 block text-lg text-slate-50">gchessboard</span>
              </div>
            </div>
          </div>

          <aside class="space-y-4 rounded-[1.75rem] border border-white/10 bg-slate-950/45 p-5 backdrop-blur-sm">
            <div>
              <p class="text-xs uppercase tracking-[0.28em] text-slate-400">Session Status</p>
              <p class="mt-3 text-2xl text-slate-50">{statusMessage()}</p>
            </div>

            <div class="grid gap-4 text-sm leading-6 text-slate-300">
              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-slate-500">Voice Input</p>
                <p>{isListening() ? 'Active and capturing microphone audio.' : 'Idle until you enable the microphone.'}</p>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-slate-500">Model Source</p>
                <p>Bundled from <code class="rounded bg-slate-900/70 px-1.5 py-0.5 text-amber-100">public/models</code>.</p>
              </div>

              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-slate-500">Future Ready</p>
                <p>SolidStart keeps routing and server-function expansion available when login and saved games arrive.</p>
              </div>
            </div>

            {errorMessage() ? (
              <div class="rounded-2xl border border-rose-300/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage()}
              </div>
            ) : null}
          </aside>
        </div>

        <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div class="rounded-[1.8rem] border border-white/10 bg-slate-950/35 p-4 shadow-2xl shadow-slate-950/20 sm:p-6">
            <div class="board-frame mx-auto w-full max-w-[34rem]">
              <g-chess-board class="aspect-square w-full overflow-hidden rounded-[1.4rem] border border-white/10 bg-slate-900/60" id="board" ref={boardEl} />
              <div class="promotion-dialog rounded-[1.4rem]" data-open="false" id="promotion-dialog" ref={promotionDialogEl}>
                <div class="promotion-panel">
                  <button class="promo-choice" data-piece="q" title="Queen" type="button" />
                  <button class="promo-choice" data-piece="r" title="Rook" type="button" />
                  <button class="promo-choice" data-piece="b" title="Bishop" type="button" />
                  <button class="promo-choice" data-piece="n" title="Knight" type="button" />
                </div>
              </div>
            </div>
          </div>

          <div class="grid gap-5">
            <article class="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5">
              <p class="text-xs uppercase tracking-[0.28em] text-slate-500">Recognizer</p>
              <p class="mt-3 text-sm leading-6 text-slate-200" ref={inputEl}>
                Waiting for input…
              </p>
            </article>

            <article class="rounded-[1.5rem] border border-white/10 bg-slate-950/45 p-5">
              <p class="text-xs uppercase tracking-[0.28em] text-slate-500">Game PGN</p>
              <pre class="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-slate-200" ref={pgnEl}>
                No moves yet.
              </pre>
            </article>

            <article class="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-slate-300">
              Local-first for this iteration: no server dependency, no auth dependency, and no forced deployment lock-in.
            </article>
          </div>
        </section>
      </section>
    </main>
  );
}
