/// <reference types="svelte" />

declare namespace svelteHTML {
  // Enhance attributes
  interface HTMLAttributes<T> {
    // If you want to use on:beforeinstallprompt
    'on:beforeinstallprompt'?: (event: any) => void;
    // If you want to use on:click_outside
    'on:click_outside'?: (event: CustomEvent<any>) => void;
    // Allow any data-* attribute
    [key: `data-${string}`]: any;
    // Allow any on:* event handlers
    [key: `on:${string}`]: (event: CustomEvent<any> & { target: EventTarget & T }) => void;
  }
}