import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Link2, Ghost, Loader2, Image as ImageIcon, Search, Plus } from 'lucide-react';
import { post } from '@/lib/api';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/ui/dialog';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';


interface MediaManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (url: string, name: string, type: 'image' | 'video') => void;
}

type Tab = 'uploads' | 'link' | 'history';

// Mock History Data
const HISTORY_MOCK = [
    { url: 'https://picsum.photos/seed/1/512/512', name: 'Mountain View', type: 'image' },
    { url: 'https://picsum.photos/seed/2/512/512', name: 'Cyberpunk City', type: 'image' },
    { url: 'https://picsum.photos/seed/3/512/512', name: 'Abstract Art', type: 'image' },
];

export function MediaManagerModal({ isOpen, onClose, onSelect }: MediaManagerModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('uploads');
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [urlInput, setUrlInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Upload Handler
    const handleFileUpload = async (file: File) => {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Using the actual backend API
            const response = await post<{ file: { path: string; id: string | number } }>('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // The backend returns a nested 'file' object. 
            // If path is a full URL (like Cloudinary), use it directly.
            const path = response.file.path;
            const fullUrl = path.startsWith('http') ? path : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/files/${path}`;

            // Determine type
            const type = file.type.startsWith('video/') ? 'video' : 'image';

            onSelect(fullUrl, file.name, type);
            onClose();
        } catch (error) {
            console.error('Upload failed:', error);
            // Fallback for demo if API fails
            const mockUrl = URL.createObjectURL(file);
            const type = file.type.startsWith('video/') ? 'video' : 'image';
            onSelect(mockUrl, file.name, type);
            onClose();
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
            handleFileUpload(file);
        }
    }, []);

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl h-[600px] p-0 bg-[#0F1014] border-white/10 shadow-2xl overflow-hidden flex flex-row gap-0">
                {/* Sidebar */}
                <div className="w-64 border-r border-white/5 p-4 flex flex-col gap-2 bg-black/20">
                    <h3 className="text-sm font-bold text-white mb-2 px-3">Add Media</h3>

                    <Button
                        variant={activeTab === 'uploads' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('uploads')}
                        className={cn(
                            "justify-start gap-3 px-3 py-6 rounded-xl text-xs font-medium transition-all h-auto",
                            activeTab === 'uploads' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Upload className="w-4 h-4" />
                        Uploads
                    </Button>

                    <Button
                        variant={activeTab === 'link' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('link')}
                        className={cn(
                            "justify-start gap-3 px-3 py-6 rounded-xl text-xs font-medium transition-all h-auto",
                            activeTab === 'link' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Link2 className="w-4 h-4" />
                        From Link
                    </Button>

                    <Button
                        variant={activeTab === 'history' ? 'default' : 'ghost'}
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "justify-start gap-3 px-3 py-6 rounded-xl text-xs font-medium transition-all h-auto",
                            activeTab === 'history' ? "bg-blue-600 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
                        )}
                    >
                        <Ghost className="w-4 h-4" />
                        History
                    </Button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col relative">

                    <div className="flex-1 p-8 overflow-y-auto">
                        {activeTab === 'uploads' && (
                            <div className="h-full flex flex-col">
                                <h2 className="text-xl font-bold text-white mb-1">Upload Media</h2>
                                <p className="text-xs text-white/40 mb-6">Drop your files here specifically.</p>

                                <div
                                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                    onDragLeave={() => setIsDragging(false)}
                                    onDrop={onDrop}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer transition-all",
                                        isDragging ? "border-blue-500 bg-blue-500/10" : "border-white/10 hover:border-white/20 hover:bg-white/5"
                                    )}
                                >
                                    {isUploading ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                            <p className="text-sm text-white/60">Uploading...</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                                <Upload className="w-8 h-8 text-white/40" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-white">Click or drag file to upload</p>
                                                <p className="text-xs text-white/40 mt-1">SVG, PNG, JPG or GIF (max. 10MB)</p>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="image/*,video/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload(file);
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'link' && (
                            <div className="h-full flex flex-col justify-center max-w-md mx-auto">
                                <h2 className="text-xl font-bold text-white mb-6 text-center">Import from URL</h2>
                                <div className="space-y-4">
                                    <Input
                                        type="url"
                                        placeholder="Paste image/video link here..."
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        className="w-full px-4 py-6 bg-white/5 border border-white/10 rounded-xl text-white focus:ring-1 focus:ring-blue-500 placeholder:text-white/20 h-auto"
                                    />
                                    <Button
                                        onClick={() => {
                                            if (urlInput) {
                                                onSelect(urlInput, 'External Link', 'image'); // Default to image
                                                onClose();
                                            }
                                        }}
                                        disabled={!urlInput}
                                        className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors h-auto"
                                    >
                                        Import Media
                                    </Button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div className="h-full flex flex-col">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-white">History</h2>
                                    <div className="relative">
                                        <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <Input
                                            type="text"
                                            placeholder="Search..."
                                            className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 h-auto"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    {HISTORY_MOCK.map((item, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                onSelect(item.url, item.name, item.type as any);
                                                onClose();
                                            }}
                                            className="group relative aspect-square rounded-xl overflow-hidden border border-white/5 hover:border-blue-500/50 transition-all"
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={item.url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Plus className="w-8 h-8 text-white" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
