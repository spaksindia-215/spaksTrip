import multer from "multer";
import { randomBytes } from "crypto";
import path from "path";
import fs from "fs";

// Local-disk upload handling for partner listing images. No S3 is configured, so
// files land under <repo>/server/uploads and are served statically by index.ts.
// Everything storage-specific lives here so swapping to S3/signed URLs later is a
// one-file change (replace the storage engine + URL builder).

export const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const HOTELS_DIR = path.join(UPLOADS_ROOT, "hotels");

// Public path prefix that maps to UPLOADS_ROOT (see express.static in index.ts).
export const UPLOADS_PUBLIC_PREFIX = "/uploads";

fs.mkdirSync(HOTELS_DIR, { recursive: true });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, HOTELS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`);
  },
});

export const hotelUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 40 }, // 5 MB/file, 40 files/request
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) return cb(null, true);
    cb(new Error("Only image uploads are allowed"));
  },
});

// Build the public URL for a stored hotel image file.
export function hotelImageUrl(filename: string): string {
  return `${UPLOADS_PUBLIC_PREFIX}/hotels/${filename}`;
}
