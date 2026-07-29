/**
 * Tabs, on `@radix-ui/react-tabs`.
 *
 * IN SCOPE, WITH A CAVEAT. The design system's inventory lists `Tabs` under
 * "Free", so it is built here. But ADR-0003 prohibits collapsing a warning,
 * refusal or disclaimer behind a disclosure, and a tab is a disclosure: the
 * content of an unselected tab is not on screen. **Nothing load-bearing may go
 * in a tab panel.** Its legitimate uses are side-by-side comparisons of
 * equivalent things — the rates pages showing bands for several years, guidance
 * shown in English/Sinhala/Tamil. `Tabs.test.tsx` cannot enforce that, so it is
 * stated here and in the demo page.
 *
 * Radix supplies the full tab contract: one tab stop for the whole list,
 * Left/Right (Home/End) to move, and `activationMode="manual"` so arrowing does
 * not swap panels under a screen-reader user mid-traversal.
 *
 * STATE MATRIX
 *
 *   empty     n/a — a tab set with no tabs renders nothing.
 *   valid     the selected tab, marked by an underline *and* the accent colour,
 *             plus `aria-selected` from Radix. Never colour alone.
 *   invalid   n/a — tabs hold no value.
 *   disabled  per tab, with a visible reason where the caller supplies one.
 *   focus     the base layer's ring on the focused tab.
 *   hover     background to `--color-accent-subtle`.
 */

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';
import './ui.css';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  /** Names the tab list. Required — an unnamed tab list is an unnamed control. */
  ariaLabel: string;
  items: readonly TabItem[];
  /** Uncontrolled starting tab. Controlled use passes `value`/`onValueChange`. */
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  ariaLabel,
  items,
  defaultValue,
  value,
  onValueChange,
}: TabsProps) {
  if (items.length === 0) return null;

  return (
    <TabsPrimitive.Root
      className="ui-tabs"
      defaultValue={defaultValue ?? items[0]?.value}
      value={value}
      onValueChange={onValueChange}
      // Manual: arrowing moves focus, Enter/Space selects. Automatic activation
      // fires a panel swap on every arrow press, which a screen reader reads
      // out in full each time.
      activationMode="manual"
    >
      <TabsPrimitive.List className="ui-tabs__list" aria-label={ariaLabel}>
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className="ui-tabs__trigger touch-target"
          >
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          key={item.value}
          value={item.value}
          className="ui-tabs__panel"
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}
