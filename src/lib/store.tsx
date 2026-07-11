/**
 * App-wide store: auth session, user settings (theming), and library state.
 * Loaded once after sign-in; screens call refresh() after mutations.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import * as api from './api';
import type { LibraryState, Settings } from './types';

const DEFAULT_SETTINGS: Settings = {
  userId: '',
  displayName: '',
  theme: 'indigo',
  accent: '#4B45D1',
  readFont: 'newsreader',
  uiFont: 'hanken',
  density: 'regular',
  aiSurface: 'sheet',
  readerSize: 1.0,
  dailyGoalMinutes: 30,
  aiProvider: '',
  aiModel: '',
  aiBaseUrl: '',
  hasAiApiKey: false,
  serverAiProvider: 'none',
};

interface Store {
  authEnabled: boolean;
  session: Session | null;
  authReady: boolean;
  signedIn: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings> & { aiApiKey?: string }) => Promise<void>;
  library: LibraryState;
  refreshLibrary: () => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const authEnabled = !!supabase;
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!authEnabled);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [library, setLibrary] = useState<LibraryState>({ books: [], collections: [] });

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signedIn = !authEnabled || !!session;

  const refreshLibrary = useCallback(async () => {
    setLibrary(await api.fetchLibrary());
  }, []);

  useEffect(() => {
    if (!signedIn || !authReady) return;
    api.fetchSettings().then(setSettings).catch(() => {});
    refreshLibrary().catch(() => {});
  }, [signedIn, authReady, refreshLibrary]);

  const updateSettings = useCallback(async (patch: Partial<Settings> & { aiApiKey?: string }) => {
    setSettings((s) => ({ ...s, ...patch })); // optimistic
    const saved = await api.patchSettings(patch);
    setSettings(saved);
  }, []);

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setLibrary({ books: [], collections: [] });
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo(
    () => ({ authEnabled, session, authReady, signedIn, settings, updateSettings, library, refreshLibrary, signOut }),
    [authEnabled, session, authReady, signedIn, settings, updateSettings, library, refreshLibrary, signOut],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
