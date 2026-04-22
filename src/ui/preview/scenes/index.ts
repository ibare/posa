import type { ComponentType } from 'react';
import { AuthFormScene } from './AuthFormScene';
import { DashboardScene } from './DashboardScene';
import { NotificationsScene } from './NotificationsScene';
import { SettingsScene } from './SettingsScene';

export type PreviewScene = {
  id: string;
  label: string;
  description: string;
  Component: ComponentType;
};

export const PREVIEW_SCENES: readonly PreviewScene[] = [
  {
    id: 'auth-form',
    label: 'Auth form',
    description: 'Card, input, checkbox, buttons',
    Component: AuthFormScene,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Sidebar nav, stats, progress, avatars',
    Component: DashboardScene,
  },
  {
    id: 'settings',
    label: 'Settings',
    description: 'Tabs, switch, slider, separators',
    Component: SettingsScene,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts, badges, avatars',
    Component: NotificationsScene,
  },
] as const;
