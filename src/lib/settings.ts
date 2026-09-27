export interface CustomTopicConfig {
  id: string;
  slug: string;
  position: number;
  title: string;
  description: string;
  imageUrl: string;
}

export interface AppSettings {
  isRegistrationOpen: boolean;
  eventDate: string;
  contactStatuses: Record<string, "new" | "contacted" | "winner">;
  topics: CustomTopicConfig[];
}
