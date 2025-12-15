// Global clipboard enablers for the entire app
// Allows copy/paste/select-all/cut shortcuts and context menu on inputs
// Uses capture-phase listeners to avoid component-level preventDefault blocks

let __clipboardInstalled = false;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || !(target as any).closest) return false;
  const el = target as HTMLElement;
  // If native input/textarea
  const tag = (el.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  // ion-input wraps a native input inside shadow; events bubble on host
  if (tag === 'ion-input') return true;
  // In case events originate from inner element, check ancestors
  return !!el.closest('input, textarea, ion-input');
}

export function installGlobalClipboardEnablers(): void {
  if (__clipboardInstalled) return;
  __clipboardInstalled = true;

  const allowShortcut = (ev: KeyboardEvent) => {
    const key = (ev.key || '').toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && ['a', 'c', 'v', 'x'].includes(key)) {
      // Let browser default run, but stop other app handlers from canceling
      ev.stopImmediatePropagation();
    }
  };

  const allowPaste = (ev: ClipboardEvent) => {
    if (!isEditableTarget(ev.target)) return;
    // Ensure other listeners cannot block paste on inputs
    ev.stopImmediatePropagation();
  };

  const allowCopyCut = (ev: Event) => {
    if (!isEditableTarget(ev.target)) return;
    ev.stopImmediatePropagation();
  };

  const allowContextMenu = (ev: MouseEvent) => {
    if (!isEditableTarget(ev.target)) return;
    // Re-enable context menu on inputs if something blocks it
    ev.stopImmediatePropagation();
  };

  document.addEventListener('keydown', allowShortcut, { capture: true, passive: false });
  document.addEventListener('paste', allowPaste as any, { capture: true, passive: false });
  document.addEventListener('copy', allowCopyCut as any, { capture: true, passive: false });
  document.addEventListener('cut', allowCopyCut as any, { capture: true, passive: false });
  document.addEventListener('contextmenu', allowContextMenu as any, { capture: true, passive: false });
}
