export interface CategoryConfig {
  [category: string]: string[];
}

export const CATEGORY_MAP: CategoryConfig = {
  Images: ["png", "jpg", "jpeg", "heic", "gif", "webp"],
  Docs: ["pdf", "doc", "docx", "ppt", "pptx", "txt", "md"],
  Spreadsheets: ["xls", "xlsx", "csv"],
  Audio: ["mp3", "wav", "m4a", "flac"],
  Video: ["mp4", "mov", "mkv"],
  Apps: ["dmg", "pkg"],
  Archives: ["zip", "rar", "7z", "tar", "gz"],
  Code: ["py", "js", "ts", "json", "html", "css", "ipynb"],
};

export const GENERIC_FILENAMES = [
  "download",
  "file",
  "document",
  "untitled",
  "final",
  "new",
  "temp",
  "copy",
  "image",
  "photo",
  "video",
  "audio",
];

export function getCategoryFromExtension(ext: string): string | null {
  const lowerExt = ext.toLowerCase().replace(".", "");
  for (const [category, extensions] of Object.entries(CATEGORY_MAP)) {
    if (extensions.includes(lowerExt)) {
      return category;
    }
  }
  return null;
}

export function isGenericFilename(filename: string): boolean {
  const lower = filename.toLowerCase();
  return GENERIC_FILENAMES.some((generic) => lower.includes(generic));
}
