import fs from 'fs';
import path from 'path';

export type VideoStatus = 'pending' | 'processing' | 'ready' | 'failed';

export interface DbModule {
  id: string;
  name: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface DbLesson {
  id: string;
  moduleId: string;
  title: string;
  videoId?: string;
  duration?: number;
  order: number;
  isFreePreview: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DbVideo {
  id: string;       // VdoCipher videoId
  title: string;
  status: VideoStatus;
  duration?: number;    // seconds
  sizeMb?: number;
  uploadedAt?: string;  // ISO string from VdoCipher upload_time
  poster?: string;      // highest-resolution poster URL
  createdAt: string;
  updatedAt: string;
}

export interface DbSchema {
  modules: DbModule[];
  lessons: DbLesson[];
  videos: DbVideo[];
}

const DEFAULT_SCHEMA: DbSchema = { modules: [], lessons: [], videos: [] };

export class JsonDatabase {
  private readonly filePath: string;
  private readonly tmpPath: string;
  private data: DbSchema;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.tmpPath = `${filePath}.tmp`;
    this.data = this.load();
  }

  private load(): DbSchema {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<DbSchema>;
        return {
          modules: Array.isArray(parsed.modules) ? parsed.modules : [],
          lessons: Array.isArray(parsed.lessons) ? parsed.lessons : [],
          videos: Array.isArray(parsed.videos) ? parsed.videos : [],
        };
      }
    } catch (err) {
      console.error('[DB] Corrupted database file — starting fresh:', err);
    }

    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.flush(DEFAULT_SCHEMA);
    return structuredClone(DEFAULT_SCHEMA);
  }

  private flush(data: DbSchema): void {
    const json = JSON.stringify(data, null, 2);
    fs.writeFileSync(this.tmpPath, json, { encoding: 'utf-8', flag: 'w' });
    fs.renameSync(this.tmpPath, this.filePath);
  }

  read(): Readonly<DbSchema> {
    return this.data;
  }

  write(updater: (current: DbSchema) => DbSchema): void {
    this.data = updater(structuredClone(this.data));
    this.flush(this.data);
  }
}
