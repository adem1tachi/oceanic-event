export interface AppSettings {
  isRegistrationOpen: boolean;
  eventDate?: string;
  contactStatuses: Record<string, "new" | "contacted" | "winner">;
}
