"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/lib/cart";
import { TENANT_ID } from "@/lib/supabase";

const CART_KEY = `azhunebi-cart-${TENANT_ID}`;
const META_KEY = `azhunebi-cart-meta-${TENANT_ID}`;

type CartMeta = {
  comment: string;
  locationNote: string;
  paymentMethod: "cash" | "card";
};

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readMeta(): CartMeta {
  if (typeof window === "undefined") {
    return { comment: "", locationNote: "", paymentMethod: "cash" };
  }

  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) {
      return { comment: "", locationNote: "", paymentMethod: "cash" };
    }

    const parsed = JSON.parse(raw) as CartMeta;
    return {
      comment: parsed.comment || "",
      locationNote: parsed.locationNote || "",
      paymentMethod: parsed.paymentMethod === "card" ? "card" : "cash",
    };
  } catch {
    return { comment: "", locationNote: "", paymentMethod: "cash" };
  }
}

export function useCartStorage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [comment, setComment] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(readCart());
    const meta = readMeta();
    setComment(meta.comment);
    setLocationNote(meta.locationNote);
    setPaymentMethod(meta.paymentMethod);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(
      META_KEY,
      JSON.stringify({ comment, locationNote, paymentMethod })
    );
  }, [comment, locationNote, paymentMethod, hydrated]);

  function clearStoredCart() {
    setCart([]);
    setComment("");
    setLocationNote("");
    setPaymentMethod("cash");
    window.localStorage.removeItem(CART_KEY);
    window.localStorage.removeItem(META_KEY);
  }

  return {
    cart,
    setCart,
    comment,
    setComment,
    locationNote,
    setLocationNote,
    paymentMethod,
    setPaymentMethod,
    hydrated,
    clearStoredCart,
  };
}
