import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create credit-screenshots subdirectory
const creditScreenshotsDir = path.join(uploadsDir, 'credit-screenshots');
if (!fs.existsSync(creditScreenshotsDir)) {
  fs.mkdirSync(creditScreenshotsDir, { recursive: true });
}

// Configure storage for credit request screenshots
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, creditScreenshotsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `credit-${uniqueSuffix}${ext}`);
  }
});

// File filter to only allow images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  console.log('🔍 File filter check:', {
    fieldname: file.fieldname,
    originalname: file.originalname,
    mimetype: file.mimetype
  });
  
  if (file.mimetype.startsWith('image/')) {
    console.log('✅ File accepted:', file.originalname);
    cb(null, true);
  } else {
    console.log('❌ File rejected - not an image:', file.mimetype);
    cb(new Error('Only image files are allowed!'));
  }
};

// Configure multer
export const uploadCreditScreenshot = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Utility function to get file URL
export const getFileUrl = (filename: string): string => {
  return `/uploads/credit-screenshots/${filename}`;
};