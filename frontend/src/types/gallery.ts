export interface GalleryItem {
    id: string;
    url: string;
    prompt: string;
    author: string;
    likes: number;
    isLiked?: boolean;
    aspectRatio: string;
}
