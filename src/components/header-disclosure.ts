import type { SyntheticEvent } from 'react';

// Native details[name] grouping is newer than Chrome 90.
export function closeOtherHeaderPanels(event: SyntheticEvent<HTMLDetailsElement>) {
  const current = event.currentTarget;
  if (!current.open) return;
  document.querySelectorAll<HTMLDetailsElement>('details[name="header-panel"]').forEach(panel => {
    if (panel !== current) panel.open = false;
  });
}
