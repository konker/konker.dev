import { mutators } from '@konker.dev/application-boilerplate.konker.dev-zerosync/mutators';
import { queries } from '@konker.dev/application-boilerplate.konker.dev-zerosync/queries';
import { schema } from '@konker.dev/application-boilerplate.konker.dev-zerosync/schema';
import { useQuery, useZero, ZeroProvider } from '@rocicorp/zero/solid';
import { decodeJwt } from 'jose';
import { createSignal, For, Show, type JSX } from 'solid-js';

const TOKEN_KEY = 'app-jwt';
const CACHE_URL = import.meta.env.VITE_ZERO_CACHE_URL;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function subFromToken(token: string): string | undefined {
  try {
    const sub = decodeJwt(token).sub;
    return typeof sub === 'string' && sub.length > 0 ? sub : undefined;
  } catch {
    return undefined;
  }
}

// --------------------------------------------------------------------------
// The widget CRUD UI. Rendered inside <ZeroProvider> so useZero/useQuery work.
function Widgets(): JSX.Element {
  const zero = useZero();
  const [widgets] = useQuery(() => queries.allWidgets());

  const [name, setName] = createSignal('');
  const [size, setSize] = createSignal(1);

  const addWidget = (e: Event): void => {
    e.preventDefault();
    if (name().trim() === '') {
      return;
    }
    void zero().mutate(mutators.widget.create({ id: crypto.randomUUID(), name: name().trim(), size: size() }));
    setName('');
    setSize(1);
  };

  return (
    <div>
      <form onSubmit={addWidget} style={{ display: 'flex', gap: '0.5rem', 'margin-bottom': '1rem' }}>
        <input placeholder="name" value={name()} onInput={(e) => setName(e.currentTarget.value)} />
        <input
          type="number"
          value={size()}
          onInput={(e) => setSize(Number.parseInt(e.currentTarget.value, 10) || 0)}
        />
        <button type="submit">Add widget</button>
      </form>
      <ul>
        <For each={widgets()} fallback={<li>No widgets yet.</li>}>
          {(w) => (
            <li style={{ display: 'flex', gap: '0.5rem', 'align-items': 'center' }}>
              <span>
                {w.name} (size {w.size})
              </span>
              <button onClick={() => void zero().mutate(mutators.widget.update({ id: w.id, size: w.size + 1 }))}>
                size +1
              </button>
              <button onClick={() => void zero().mutate(mutators.widget.delete({ id: w.id }))}>delete</button>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

// --------------------------------------------------------------------------
export function App(): JSX.Element {
  const [token, setToken] = createSignal(localStorage.getItem(TOKEN_KEY) ?? '');

  const save = (t: string): void => {
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  // The keyed Show re-creates ZeroProvider (and the Zero client) whenever the
  // user id derived from the pasted JWT changes — refreshing server-side auth.
  return (
    <main style={{ 'font-family': 'system-ui, sans-serif', 'max-width': '40rem', margin: '2rem auto' }}>
      <h1>Zero Sync widgets</h1>
      <p>Paste an out-of-band JWT (mint with the backend `mint-jwt` script):</p>
      <textarea
        style={{ width: '100%', height: '4rem' }}
        value={token()}
        onInput={(e) => save(e.currentTarget.value)}
      />
      <Show when={subFromToken(token())} fallback={<p>Paste a valid JWT to connect.</p>} keyed>
        {(userID) => (
          <ZeroProvider
            schema={schema}
            mutators={mutators}
            cacheURL={CACHE_URL}
            queryURL={`${BACKEND_URL}/zero/query`}
            mutateURL={`${BACKEND_URL}/zero/mutate`}
            auth={token()}
            userID={userID}
            context={{ sub: userID }}
            kvStore="idb"
          >
            <Widgets />
          </ZeroProvider>
        )}
      </Show>
    </main>
  );
}
