import fs from "fs";
import path from "path";

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

const SETTINGS_FILE_PATH = path.join(process.cwd(), "src", "data", "settings.json");

const DEFAULT_SETTINGS: AppSettings = {
  isRegistrationOpen: true,
  eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now as default
  contactStatuses: {},
  topics: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      slug: "topic-a",
      position: 1,
      title: "الذكاء الاصطناعي التوليدي والنماذج اللغوية في بيئات العمل",
      description: "احترف بناء وتطبيق أنظمة الذكاء الاصطناعي التوليدي وتقنيات RAG في المؤسسات الحقيقية مع تطبيق أفضل الممارسات الأمنية.",
      imageUrl: "",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      slug: "topic-b",
      position: 2,
      title: "هندسة السحابة وحلول الديف أوبس الحديثة (Cloud & DevOps)",
      description: "إتقان تقنيات كوبرنيتيس (Kubernetes)، وأتمتة مسارات CI/CD، وإدارة وتأمين البنى التحتية السحابية الهجينة بكفاءة.",
      imageUrl: "",
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      slug: "topic-c",
      position: 3,
      title: "الأمن السيبراني المؤسسي والدفاع ضد التهديدات المتقدمة",
      description: "حماية الأنظمة والشبكات المؤسسية من أحدث الهجمات السيبرانية، وتطبيق معايير الامتثال والرقابة الفنية الدقيقة.",
      imageUrl: "",
    },
  ],
};

export function getAppSettings(): AppSettings {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        topics: parsed.topics || DEFAULT_SETTINGS.topics,
        contactStatuses: parsed.contactStatuses || {},
      };
    }
  } catch (err) {
    console.warn("[Settings] Error reading settings file, returning defaults:", err);
  }
  return DEFAULT_SETTINGS;
}

export function saveAppSettings(newSettings: Partial<AppSettings>): AppSettings {
  try {
    const current = getAppSettings();
    const updated: AppSettings = {
      ...current,
      ...newSettings,
      contactStatuses: {
        ...current.contactStatuses,
        ...(newSettings.contactStatuses || {}),
      },
    };

    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(updated, null, 2), "utf-8");
    return updated;
  } catch (err) {
    console.error("[Settings] Error writing settings file:", err);
    throw err;
  }
}
