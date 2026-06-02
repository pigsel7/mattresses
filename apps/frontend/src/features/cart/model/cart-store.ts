"use client";

import { useSyncExternalStore } from "react";

export type CartItem = {
  productId: string;
  quantity: number;
};

const MAX_CART_QUANTITY = 99;
const CART_STORAGE_KEY = "mattress.cart.v1";
const CART_CHANGED_EVENT = "mattress-cart-changed";
const EMPTY_CART: CartItem[] = [];

let cartSnapshotRaw: string | null = null;
let cartSnapshot: CartItem[] = EMPTY_CART;

function normalizeCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        typeof item.productId !== "string" ||
        typeof item.quantity !== "number" ||
        !Number.isFinite(item.quantity)
      ) {
        return null;
      }

      return {
        productId: item.productId,
        quantity: normalizeQuantity(item.quantity)
      };
    })
    .filter((item): item is CartItem => item !== null);
}

function readCart() {
  if (typeof window === "undefined") {
    return EMPTY_CART;
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY) ?? "[]";

    if (raw === cartSnapshotRaw) {
      return cartSnapshot;
    }

    cartSnapshotRaw = raw;
    cartSnapshot = normalizeCart(JSON.parse(raw));

    return cartSnapshot;
  } catch {
    cartSnapshotRaw = null;
    cartSnapshot = EMPTY_CART;

    return cartSnapshot;
  }
}

function writeCart(items: CartItem[]) {
  const raw = JSON.stringify(items);

  cartSnapshotRaw = raw;
  cartSnapshot = items;
  window.localStorage.setItem(CART_STORAGE_KEY, raw);
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

function subscribe(listener: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === CART_STORAGE_KEY) {
      listener();
    }
  }

  window.addEventListener(CART_CHANGED_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CART_CHANGED_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function addCartItem(productId: string, quantity = 1) {
  const items = readCart();
  const existing = items.find((item) => item.productId === productId);
  const normalizedQuantity = normalizeQuantity(quantity);

  if (existing) {
    writeCart(
      items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              quantity: normalizeQuantity(item.quantity + normalizedQuantity)
            }
          : item
      )
    );
    return;
  }

  writeCart([...items, { productId, quantity: normalizedQuantity }]);
}

export function updateCartItem(productId: string, quantity: number) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    removeCartItem(productId);
    return;
  }

  writeCart(
    readCart().map((item) =>
      item.productId === productId
        ? { ...item, quantity: normalizeQuantity(quantity) }
        : item
    )
  );
}

export function removeCartItem(productId: string) {
  writeCart(readCart().filter((item) => item.productId !== productId));
}

export function removeCartItems(productIds: string[]) {
  const ids = new Set(productIds);
  writeCart(readCart().filter((item) => !ids.has(item.productId)));
}

export function clearCart() {
  writeCart([]);
}

function normalizeQuantity(quantity: number) {
  return Math.min(MAX_CART_QUANTITY, Math.max(1, Math.floor(quantity)));
}

export function useCart() {
  const items = useSyncExternalStore(subscribe, readCart, () => EMPTY_CART);

  return {
    addItem: addCartItem,
    clear: clearCart,
    items,
    removeItem: removeCartItem,
    removeItems: removeCartItems,
    updateItem: updateCartItem
  };
}
