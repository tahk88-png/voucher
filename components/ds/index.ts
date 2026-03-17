/* ═══════════════════════════════════════════════
   Design System — Barrel Export
   ═══════════════════════════════════════════════ */

export { DsButton, type DsButtonProps, type DsButtonVariant, type DsButtonSize } from './ds-button';
export { DsInput, type DsInputProps, type DsInputSize, type DsInputVariant } from './ds-input';
export { DsSelect, type DsSelectProps, type DsSelectOption } from './ds-select';
export { DsToggle, type DsToggleProps, type DsToggleSize } from './ds-toggle';
export { DsTabs, type DsTabsProps, type DsTab, type DsTabsVariant } from './ds-tabs';
export { DsModal, type DsModalProps, type DsModalSize } from './ds-modal';
export { DsCard, type DsCardProps, type DsCardVariant, type DsCardPadding } from './ds-card';
export { DsAlert, type DsAlertProps, type DsAlertVariant } from './ds-alert';
export { DsTooltip, type DsTooltipProps, type DsTooltipPosition } from './ds-tooltip';
export { DsBadge, type DsBadgeProps, type DsBadgeVariant, type DsBadgeColor, type DsBadgeSize } from './ds-badge';
export {
  NotificationProvider,
  useNotification,
  type NotificationProviderProps,
  type DsNotificationType,
  type DsNotificationPosition,
  type DsNotificationOptions,
} from './ds-notification';
export { DsSidebar, type DsSidebarProps, type DsSidebarSection, type DsSidebarItem } from './ds-sidebar';

// Animation components
export { AnimatedPresence } from './animated-presence';
export { AnimatedNumber } from './animated-number';
export { Spinner, Dots, Skeleton, ProgressBar, PulseCard } from './loading-states';
export { PageTransition, StaggeredChildren, ScrollReveal } from './page-transition';

// Illustrations
export { AiBrain, DataFlow, CloudNetwork, AbstractGrid, SecurityShield } from './illustrations';
