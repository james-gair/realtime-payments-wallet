import { useEffect, useState, useCallback } from 'react';
import { authFetch } from '../services/firebaseFetch';
import type { Contact } from '../types';

let contactsCache: Contact[] | null = null;
let inflight: Promise<Contact[]> | null = null;

export function useSavedContacts() {
  const [contacts, setContacts] = useState<Contact[]>(contactsCache || []);
  const [loading, setLoading] = useState<boolean>(!contactsCache);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      setError(null);
      const response = await authFetch('http://localhost:4000/api/saved-contacts');
      const data = await response.json();
      contactsCache = Array.isArray(data) ? data : [];
      setContacts(contactsCache);
    } catch (err: any) {
      setError('Failed to load saved contacts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (contactsCache) {
      setLoading(false);
      return;
    }
    if (!inflight) {
      inflight = (async () => {
        await fetchContacts();
        return contactsCache || [];
      })();
    }
    inflight.finally(() => {
      inflight = null;
    });
  }, [fetchContacts]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchContacts();
  }, [fetchContacts]);

  const updateLocal = useCallback((updater: (prev: Contact[]) => Contact[]) => {
    setContacts(prev => {
      const next = updater(prev);
      contactsCache = next;
      return next;
    });
  }, []);

  return { contacts, loading, error, refresh, updateLocal } as const;
}
