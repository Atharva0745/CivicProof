const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

/**
 * Storage service for CivicProof evidence photos
 * Computes cryptographic SHA-256 hash to ensure content integrity and handles disk/cloud storage.
 */
class StorageService {
  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Calculate SHA-256 checksum of buffer
   */
  computeHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Save file buffer or uploaded file metadata
   */
  async saveFile(file) {
    if (!file) {
      throw new Error('No file provided to storage service');
    }

    const contentHash = this.computeHash(file.buffer);
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const storageKey = `${Date.now()}_${contentHash.substring(0, 16)}${ext}`;
    const targetFilePath = path.join(this.uploadDir, storageKey);

    // Write file to disk
    await fs.promises.writeFile(targetFilePath, file.buffer);

    const publicUrl = `/uploads/${storageKey}`;

    return {
      storageKey,
      publicUrl,
      contentHash,
      fileSize: file.size,
      mimeType: file.mimetype,
      originalFilename: file.originalname
    };
  }

  /**
   * Ingest direct URL or external evidence
   */
  createMetadataFromUrl(url, caption = '') {
    const contentHash = crypto.createHash('sha256').update(url).digest('hex');
    return {
      storageKey: url,
      publicUrl: url,
      contentHash,
      fileSize: 0,
      mimeType: 'image/jpeg',
      originalFilename: path.basename(url) || 'external_evidence.jpg'
    };
  }
}

module.exports = new StorageService();
