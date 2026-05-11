import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import authenticateToken from "../../middleware/authMiddleware";

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "../../uploads");
        
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});

// Public upload endpoint (no auth required) - for invitation signups
router.post("/public", upload.single("file"), (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(200).json({
            message: "File uploaded successfully",
            file: {
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "File upload failed", error: error.message });
    }
});

// Authenticated upload endpoint
router.post("/", authenticateToken, upload.single("file"), (req: any, res: any) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const fileUrl = `/uploads/${req.file.filename}`;

        res.status(200).json({
            message: "File uploaded successfully",
            file: {
                url: fileUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
            },
        });
    } catch (error: any) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "File upload failed", error: error.message });
    }
});

export default router;
