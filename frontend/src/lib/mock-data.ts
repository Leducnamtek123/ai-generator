export interface GalleryItem {
    id: string;
    url: string;
    prompt: string;
    author: string;
    likes: number;
    aspectRatio: string;
}

export const mockGalleryItems: GalleryItem[] = [
    {
        id: '1',
        url: 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=800&auto=format&fit=crop',
        prompt: 'Cyberpunk street food vendor in neon rain, cinematic lighting, 8k',
        author: 'NeonDreamer',
        likes: 1240,
        aspectRatio: 'aspect-[3/4]',
    },
    {
        id: '2',
        url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop',
        prompt: 'Abstract fluid gradients, pastel colors, glassmorphism style',
        author: 'DesignBot',
        likes: 850,
        aspectRatio: 'aspect-[1/1]',
    },
    {
        id: '3',
        url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop',
        prompt: 'Minimalist interior design, japanese zen garden influence, soft sunlight',
        author: 'ArchViz',
        likes: 2100,
        aspectRatio: 'aspect-[16/9]',
    },
    {
        id: '4',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        prompt: 'Futuristic astronaut portrait, vibrant oil painting style',
        author: 'AstroArt',
        likes: 3400,
        aspectRatio: 'aspect-[3/4]',
    },
    {
        id: '5',
        url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=800&auto=format&fit=crop',
        prompt: 'Isometric 3D forest scene, low poly, blender render',
        author: 'PolyMaster',
        likes: 920,
        aspectRatio: 'aspect-[4/3]',
    },
    {
        id: '6',
        url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800&auto=format&fit=crop',
        prompt: 'Detailed macro photography of a mechanical eye, steampunk',
        author: 'GearHead',
        likes: 1560,
        aspectRatio: 'aspect-[3/4]',
    },
    {
        id: '7',
        url: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=800&auto=format&fit=crop',
        prompt: 'Dark fantasy castle, misty mountains, ominous lighting',
        author: 'DarkSoulsFan',
        likes: 2800,
        aspectRatio: 'aspect-[16/9]',
    },
    {
        id: '8',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
        prompt: 'Retro 80s synthesizer wave, grid landscape, neon sun',
        author: 'SynthWave',
        likes: 1100,
        aspectRatio: 'aspect-[4/3]',
    },
    {
        id: '9',
        url: 'https://images.unsplash.com/photo-1614726365723-49cfae92782b?q=80&w=800&auto=format&fit=crop',
        prompt: 'Ethereal jellyfish in deep space, bioluminescent',
        author: 'SpaceMarine',
        likes: 4200,
        aspectRatio: 'aspect-[3/4]',
    },
    {
        id: '10',
        url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop',
        prompt: 'A cute robot gardener watering plants, pixar style',
        author: 'PixarFan',
        likes: 5600,
        aspectRatio: 'aspect-[1/1]',
    },
    {
        id: '11',
        url: 'https://images.unsplash.com/photo-1655721868461-125032504859?q=80&w=800&auto=format&fit=crop',
        prompt: 'Surreal melting clock in desert, dali style',
        author: 'Surrealist',
        likes: 890,
        aspectRatio: 'aspect-[3/5]',
    },
    {
        id: '12',
        url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=800&auto=format&fit=crop',
        prompt: 'Golden hour cityscape, future tokyo, flying cars',
        author: 'CityScaper',
        likes: 1750,
        aspectRatio: 'aspect-[16/9]',
    },
];

export const mockCollections = [
    { id: '1', title: 'Summer Vibes', count: 120, image: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=800&q=80' },
    { id: '2', title: 'Tech Startups', count: 85, image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80' },
    { id: '3', title: 'Abstract 3D', count: 240, image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80' },
    { id: '4', title: 'Nature Textures', count: 95, image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80' },
];

export const mockCategories = [
    { title: 'Vectors', color: 'from-blue-500/20 to-cyan-500/20' },
    { title: 'Photos', color: 'from-purple-500/20 to-pink-500/20' },
    { title: 'AI Images', color: 'from-orange-500/20 to-red-500/20' },
    { title: 'Icons', color: 'from-green-500/20 to-emerald-500/20' },
    { title: 'Videos', color: 'from-indigo-500/20 to-violet-500/20' },
    { title: 'PSD', color: 'from-blue-600/20 to-blue-800/20' },
    { title: '3D', color: 'from-yellow-500/20 to-amber-500/20' },
    { title: 'Fonts', color: 'from-gray-500/20 to-slate-500/20' },
];
