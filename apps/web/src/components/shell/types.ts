export interface ShellUser {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface ShellWorkspace {
  id: string;
  name: string;
  role: string;
}

export interface ShellNotification {
  id: string;
  title: string;
  body: string | null;
  href: string | null;
  createdAt: string;
  read: boolean;
}
