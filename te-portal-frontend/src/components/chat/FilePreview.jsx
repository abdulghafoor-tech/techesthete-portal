import React from 'react';
import { X, File, Image as ImageIcon } from 'lucide-react';

const FilePreview = ({ file, onRemove }) => {
    if (!file) return null;

    const isImage = file.type.startsWith('image/');

    return (
        <div className="relative group inline-block m-2">
            <div className="border border-gray-300 rounded p-2 bg-gray-50 flex items-center gap-2 max-w-[200px]">
                {isImage ? (
                    <img
                        src={URL.createObjectURL(file)}
                        alt="Upload preview"
                        className="w-12 h-12 object-cover rounded"
                    />
                ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                        <File size={24} />
                    </div>
                )}
                <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
            </div>
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
                <X size={12} />
            </button>
        </div>
    );
};

export default FilePreview;
