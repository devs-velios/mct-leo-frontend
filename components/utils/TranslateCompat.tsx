"use client";

// Google-Translate ↔ React coexistence shim.
//
// When the browser translates the page, Google Translate swaps text nodes for its
// own <font>-wrapped copies. React still holds references to the originals, so on a
// re-render its insertBefore / removeChild calls hit "node is not a child of this
// node" and the whole tree crashes (NotFoundError). This is a long-standing,
// well-documented React+Translate conflict (facebook/react#11538).
//
// The fix is to make those two DOM primitives tolerant: if the reference/child node
// no longer lives under the expected parent, no-op instead of throwing. React then
// reconciles on its next pass. This keeps in-browser translation working (we still
// want it for client demos) without the crashes.
//
// Patched once, at module load on the client — before React commits anything.

if (typeof window !== "undefined" && typeof Node === "function" && Node.prototype) {
  const w = window as unknown as { __mctTranslatePatched?: boolean };
  if (!w.__mctTranslatePatched) {
    w.__mctTranslatePatched = true;

    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) {
        // Translate already detached/moved it — pretend we removed it.
        return child;
      }
      // eslint-disable-next-line prefer-rest-params
      return originalRemoveChild.apply(this, arguments as unknown as [T]) as T;
    };

    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) {
        // The anchor Translate gave us isn't ours anymore — append instead of throwing.
        return originalInsertBefore.call(this, newNode, null) as T;
      }
      // eslint-disable-next-line prefer-rest-params
      return originalInsertBefore.apply(this, arguments as unknown as [T, Node | null]) as T;
    };
  }
}

/** Renders nothing — its sole purpose is to pull the shim above into the client bundle. */
export default function TranslateCompat() {
  return null;
}
