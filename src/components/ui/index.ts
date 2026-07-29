/**
 * The P08 primitive inventory.
 *
 * `ui-design-system.md` splits components into "constrained" (required
 * behaviour from ADR-0003 — `Disclaimer`, `AsAtStamp`, `WarningList`,
 * `RefusalPanel`, `CitationRef`, `UnverifiedBadge`, `YearSelector`) and "free".
 * Everything exported here is from the free half. The constrained ones are
 * P09's, and several of them are built *from* these — `Callout` is the base of
 * `WarningList` and `RefusalPanel`, which is why `Callout` has no dismiss and
 * no collapse.
 */

export { Button } from './Button.tsx';
export type { ButtonProps, ButtonVariant } from './Button.tsx';

export { TextField } from './TextField.tsx';
export type { TextFieldProps } from './TextField.tsx';

export { CurrencyField } from './CurrencyField.tsx';
export type { CurrencyFieldProps, CurrencyFieldValidity } from './CurrencyField.tsx';

export {
  CURRENCY_MESSAGES,
  formatRupees,
  formatRupeesWithUnit,
  parseRupees,
} from './currency.ts';
export type { CurrencyParseErrorCode, CurrencyParseResult } from './currency.ts';

export { RadioCardGroup } from './RadioCardGroup.tsx';
export type { RadioCardGroupProps, RadioCardOption } from './RadioCardGroup.tsx';

export { Select } from './Select.tsx';
export type { SelectOption, SelectProps } from './Select.tsx';

export { Callout } from './Callout.tsx';
export type { CalloutProps, CalloutTone } from './Callout.tsx';

export { Card } from './Card.tsx';
export type { CardProps } from './Card.tsx';

export { Table } from './Table.tsx';
export type { TableColumn, TableProps } from './Table.tsx';

export { Stepper } from './Stepper.tsx';
export type { Step, StepperProps, StepStatus } from './Stepper.tsx';

export { ProgressIndicator } from './ProgressIndicator.tsx';
export type { ProgressIndicatorProps } from './ProgressIndicator.tsx';

export { Tabs } from './Tabs.tsx';
export type { TabItem, TabsProps } from './Tabs.tsx';

export { Skeleton } from './Skeleton.tsx';
export type { SkeletonProps } from './Skeleton.tsx';

export { PersonaCardGroup } from './PersonaCard.tsx';
export type { Persona, PersonaCardGroupProps } from './PersonaCard.tsx';
