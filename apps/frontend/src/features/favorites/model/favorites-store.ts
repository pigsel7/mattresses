"use client";

import { useSyncExternalStore } from "react";

const FAVORITES_STORAGE_KEY = "mattress.favorites.v1";
const FAVORITES_CHANGED_EVENT = "mattress-favorites-changed";
const EMPTY_FAVORITES: string[] = [];

let favoritesSnapshotRaw: string | null = null;
let favoritesSnapshot: string[] = EMPTY_FAVORITES;

function readFavorites() {
  if (typeof window === "undefined") {
    return EMPTY_FAVORITES;
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]";

    if (raw === favoritesSnapshotRaw) {
      return favoritesSnapshot;
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      favoritesSnapshotRaw = raw;
      favoritesSnapshot = EMPTY_FAVORITES;

      return favoritesSnapshot;
    }

    favoritesSnapshotRaw = raw;
    favoritesSnapshot = Array.from(
      new Set(parsed.filter((item): item is string => typeof item === "string"))
    );

    return favoritesSnapshot;
  } catch {
    favoritesSnapshotRaw = null;
    favoritesSnapshot = EMPTY_FAVORITES;

    return favoritesSnapshot;
  }
}

function writeFavorites(productIds: string[]) {
  const nextFavorites = Array.from(new Set(productIds));
  const raw = JSON.stringify(nextFavorites);

  favoritesSnapshotRaw = raw;
  favoritesSnapshot = nextFavorites;
  window.localStorage.setItem(FAVORITES_STORAGE_KEY, raw);
  window.dispatchEvent(new Event(FAVORITES_CHANGED_EVENT));
}

function subscribe(listener: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === FAVORITES_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener(FAVORITES_CHANGED_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(FAVORITES_CHANGED_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function toggleFavorite(productId: string) {
  const favorites = readFavorites();

  if (favorites.includes(productId)) {
    writeFavorites(favorites.filter((id) => id !== productId));
    return;
  }

  writeFavorites([...favorites, productId]);
}

export function removeFavorites(productIds: string[]) {
  const ids = new Set(productIds);
  writeFavorites(readFavorites().filter((id) => !ids.has(id)));
}

export function useFavorites() {
  const productIds = useSyncExternalStore(subscribe, readFavorites, () => EMPTY_FAVORITES);

  return {
    hasFavorite: (productId: string) => productIds.includes(productId),
    productIds,
    removeFavorites,
    toggleFavorite
  };
}
