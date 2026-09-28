import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { ApplicationDocument } from '../../types';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../../lib/firebase';

async function optimizeImageForUpload(file: File, contentType: string): Promise<File> {
  if (!contentType.startsWith('image/') || file.size < 1.5 * 1024 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const compressed = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.86);
    });
    if (!compressed || compressed.size >= file.size) return file;

    return new File([compressed], file.name.replace(/\.[^.]+$/, '.webp'), {
      type: 'image/webp',
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

interface DocumentUploaderProps {
  type: 'com' | 'itr' | 'id' | 'other';
  title: string;
  subtitle: string;
  required?: boolean;
  document: ApplicationDocument | null;
  onDocumentChange: (doc: ApplicationDocument | null) => void;
  onPreviewRequest: (doc: ApplicationDocument) => void;
  acceptedFormats?: string;
  maxSizeMB?: number;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  type,
  title,
  subtitle,
  required = true,
  document,
  onDocumentChange,
  onPreviewRequest,
  acceptedFormats = '.pdf,.jpg,.jpeg,.png,.webp',
  maxSizeMB = 10,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = async (file: File) => {
    if (isProcessing) return;
    setErrorMessage(null);

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File is too large (${formatFileSize(file.size)}). Max allowed is ${maxSizeMB}MB.`);
      return;
    }

    // Validate type
    const validExtensions = acceptedFormats.split(',').map((ext) => ext.trim().toLowerCase());
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const inferredContentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    };
    const contentType = file.type || inferredContentTypes[fileExtension] || '';
    const isValidExtension = validExtensions.some((ext) => ext === fileExtension);
    const isSupportedContentType = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(contentType);

    if (!isValidExtension || !isSupportedContentType) {
      setErrorMessage(`Invalid file format. Please upload ${acceptedFormats.toUpperCase()}.`);
      return;
    }

    setIsProcessing(true);
    setIsOptimizing(contentType.startsWith('image/') && file.size >= 1.5 * 1024 * 1024);
    setUploadProgress(0);
    try {
      const uploadFile = await optimizeImageForUpload(file, contentType);
      setIsOptimizing(false);
      const uploadContentType = uploadFile.type || contentType;
      const safeName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `application-documents/${type}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
      const fileRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(fileRef, uploadFile, { contentType: uploadContentType });
      await new Promise<void>((resolve, reject) => {
        let settled = false;
        let unsubscribe = () => {};
        const finish = (callback: () => void) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeoutId);
          unsubscribe();
          callback();
        };
        const timeoutId = window.setTimeout(() => {
          uploadTask.cancel();
          finish(() => reject(new Error('Upload timed out after 2 minutes. Check your connection and try again.')));
        }, 120000);

        unsubscribe = uploadTask.on(
          'state_changed',
          (snapshot) => {
            setUploadProgress(
              snapshot.totalBytes === 0
                ? 100
                : Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            );
          },
          (error) => finish(() => reject(error)),
          () => finish(resolve)
        );
      });
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error('Upload finished, but document verification timed out. Try again.'));
        }, 30000);
        getDownloadURL(fileRef).then(
          (url) => {
            window.clearTimeout(timeoutId);
            resolve(url);
          },
          (error) => {
            window.clearTimeout(timeoutId);
            reject(error);
          }
        );
      });

      const newDoc: ApplicationDocument = {
        id: `doc-${type}-${Date.now()}`,
        type,
        name: uploadFile.name,
        url: downloadUrl,
        size: formatFileSize(uploadFile.size),
        uploaded_at: new Date().toISOString().split('T')[0],
        file_type: uploadContentType,
        data_url: downloadUrl,
        storage_path: storagePath,
      };

      onDocumentChange(newDoc);
    } catch (error) {
      console.error('Failed to upload application document:', error);
      const code = (error as { code?: string })?.code;
      if (code === 'storage/unauthorized') {
        setErrorMessage('Upload blocked by Firebase Storage rules. Publish the project storage.rules file and try again.');
      } else if (error instanceof Error && error.message.startsWith('Upload timed out')) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Failed to upload document. Check your connection and Firebase Storage configuration, then try again.');
      }
    } finally {
      setIsProcessing(false);
      setIsOptimizing(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDocumentChange(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage =
    document?.file_type?.startsWith('image/') ||
    (document?.name && /\.(png|jpe?g|webp|gif)$/i.test(document.name)) ||
    document?.data_url?.startsWith('data:image/');

  return (
    <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-200 transition-all space-y-3">
      {/* Header Info */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-xs font-bold text-[#1A1D20] uppercase flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-[#C8102E]" />
            <span>{title}</span>
            {required && <span className="text-red-500 font-bold">*</span>}
          </h4>
          <p className="text-[11px] text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        {document ? (
          <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Ready</span>
          </span>
        ) : (
          <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded">
            Required
          </span>
        )}
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Uploader / Uploaded View Area */}
      {!document ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            if (!isProcessing) fileInputRef.current?.click();
          }}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-4 text-center transition-all flex flex-col items-center justify-center space-y-2 ${
            isDragging
              ? 'border-[#C8102E] bg-red-50/60 scale-[1.01]'
              : 'border-gray-300 bg-white hover:border-[#C8102E] hover:bg-red-50/20'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:text-[#C8102E]">
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-[#C8102E] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-5 h-5 text-gray-500" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-gray-800">
              {isOptimizing
                ? 'Optimizing image...'
                : isProcessing
                  ? uploadProgress >= 100
                    ? 'Finalizing document...'
                    : `Uploading document... ${uploadProgress}%`
                  : isDragging
                    ? 'Drop file right here!'
                    : 'Click to Upload or Drag & Drop'}
            </p>
            {isProcessing && (
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200"
                role="progressbar"
                aria-label="Document upload progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
              >
                <div
                  className="h-full bg-[#C8102E] transition-[width] duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <p className="text-[11px] text-gray-400 mt-0.5">
              PDF, JPG, PNG, WEBP (Up to {maxSizeMB}MB)
            </p>
          </div>
        </div>
      ) : (
        /* Attached Document Card */
        <div className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Thumbnail or Icon */}
            {isImage && document.data_url ? (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center">
                <img
                  src={document.data_url}
                  alt={document.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-lg bg-red-50 text-[#C8102E] flex flex-col items-center justify-center shrink-0 border border-red-100 font-mono text-[10px] font-bold">
                <FileCheck className="w-5 h-5 mb-0.5" />
                <span className="uppercase">{document.name.split('.').pop() || 'DOC'}</span>
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{document.name}</p>
              <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-0.5">
                <span className="font-semibold text-gray-700">{document.size}</span>
                <span>•</span>
                <span>Uploaded {document.uploaded_at}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onPreviewRequest(document)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-gray-700 hover:text-[#C8102E] bg-gray-100 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
              title="Preview document"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
