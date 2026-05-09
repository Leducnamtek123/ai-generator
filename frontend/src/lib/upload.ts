import { post } from '@/lib/api';
import {
  getFileUrl as resolveFileUrl,
  resolveStoredFile,
  type ResolvedStoredFile,
  type StoredFileResponse,
} from '@/lib/file-storage';
import { toast } from 'sonner';

export type UploadedFile = ResolvedStoredFile;

/**
 * Upload a file to MinIO via the backend S3 endpoint.
 * Returns the file path that can be used as a URL for generation APIs.
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await post<StoredFileResponse>(
        '/files/upload',
        formData,
        {
            headers: { 'Content-Type': 'multipart/form-data' },
        },
    );

    return resolveStoredFile(response.file);
}

/**
 * Upload a file with toast feedback.
 */
export async function uploadFileWithToast(
    file: File,
    label?: string,
): Promise<UploadedFile | null> {
    const name = label || file.name;
    const toastId = `upload-${Date.now()}`;

    try {
        toast.loading(`Uploading ${name}...`, { id: toastId });
        const result = await uploadFile(file);
        toast.success(`${name} uploaded!`, { id: toastId });
        return result;
    } catch (error: unknown) {
        console.error('Upload failed', error);
        const message = error instanceof Error ? error.message : `Failed to upload ${name}`;
        toast.error(message, { id: toastId });
        return null;
    }
}

/**
 * Convert a MinIO path to a full URL.
 * The backend serves files either:
 *  - Directly from the S3/MinIO endpoint
 *  - Or through the backend proxy at /api/v1/files/:path
 */
export function getFileUrl(path: string): string {
    return resolveFileUrl(path);
}

/**
 * Validate file before upload.
 */
function validateFile(
    file: File,
    options?: {
        maxSizeMB?: number;
        allowedTypes?: string[];
    },
): string | null {
    const maxSize = (options?.maxSizeMB || 50) * 1024 * 1024;

    if (file.size > maxSize) {
        return `File size exceeds ${options?.maxSizeMB || 50}MB limit`;
    }

    if (options?.allowedTypes && options.allowedTypes.length > 0) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !options.allowedTypes.includes(ext)) {
            return `File type .${ext} is not supported. Allowed: ${options.allowedTypes.join(', ')}`;
        }
    }

    return null; // valid
}

/**
 * React hook-friendly: upload handler for input[type=file] onChange events.
 */
async function handleFileInputUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    options?: {
        maxSizeMB?: number;
        allowedTypes?: string[];
        label?: string;
    },
): Promise<UploadedFile | null> {
    const file = e.target.files?.[0];
    if (!file) return null;

    const error = validateFile(file, options);
    if (error) {
        toast.error(error);
        return null;
    }

    return uploadFileWithToast(file, options?.label);
}
