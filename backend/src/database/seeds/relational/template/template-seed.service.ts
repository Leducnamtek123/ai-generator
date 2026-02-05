import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TemplateEntity } from '../../../../templates/infrastructure/persistence/relational/entities/template.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';
import { TemplateTypeEnum } from '../../../../templates/types/template-type.enum';

@Injectable()
export class TemplateSeedService {
  constructor(
    @InjectRepository(TemplateEntity)
    private repository: Repository<TemplateEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async run() {
    const count = await this.repository.count();
    if (count > 0) return;

    const admin = await this.userRepository.findOne({
      where: { email: 'admin@example.com' },
    });

    if (!admin) return;

    const templates = [
      // === IMAGE GENERATOR (5 Examples) ===
      {
        title: 'Cyberpunk Portrait',
        description:
          'Create high-fidelity cyberpunk portraits with neon lighting.',
        thumbnail:
          'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Cyberpunk character portrait, neon lights, rain, high detail, 8k',
          model: 'stable-diffusion-xl',
          aspectRatio: '2:3',
        },
      },
      {
        title: 'Watercolor Landscape',
        description: 'Soft and dreamy watercolor landscapes.',
        thumbnail:
          'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Watercolor painting of a mountain landscape, soft colors, dreamy atmosphere',
          model: 'dall-e-3',
          aspectRatio: '16:9',
        },
      },
      {
        title: '3D Isometric Room',
        description: 'Create cute 3D isometric room designs.',
        thumbnail:
          'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Isometric 3D room, cozy gamer setup, low poly, blender render, soft lighting',
          model: 'midjourney-v6',
          aspectRatio: '1:1',
        },
      },
      {
        title: 'Anime Character',
        description: 'Generate high-quality anime style characters.',
        thumbnail:
          'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Anime girl, silver hair, blue eyes, magical forest background, studio ghibli style',
          model: 'stable-diffusion-3',
          aspectRatio: '2:3',
        },
      },
      {
        title: 'Product Photography',
        description: 'Professional product photography studio setup.',
        thumbnail:
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Professional product photography, perfume bottle, botanical background, soft natural lighting',
          model: 'stable-diffusion-xl',
          aspectRatio: '4:5',
        },
      },

      // === VIDEO GENERATOR (5 Examples) ===
      {
        title: 'Cinematic Drone Shot',
        description: 'Generate realistic aerial drone footage.',
        thumbnail:
          'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VIDEO_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Cinematic drone shot flying over a futuristic city at sunset',
          duration: 5,
          fps: 24,
        },
      },
      {
        title: 'Liquid Animation',
        description: 'Abstract colorful liquid animation.',
        thumbnail:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VIDEO_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt: 'Swirling colorful liquid, metallic texture, 3d render, loop',
          duration: 8,
          fps: 30,
        },
      },
      {
        title: 'Nature Timelapse',
        description: 'Accelerated timelapse of blooming flowers.',
        thumbnail:
          'https://images.unsplash.com/photo-1490750967868-58cb75069ed6?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VIDEO_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt: 'Timelapse of a rose blooming, detailed texture, macro shot',
          duration: 4,
          fps: 30,
        },
      },
      {
        title: 'Cyberpunk Walk',
        description: 'A character walking through a cyberpunk street.',
        thumbnail:
          'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VIDEO_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Person walking in rain, cyberpunk city, neon signs, back view',
          duration: 5,
          fps: 24,
        },
      },
      {
        title: 'Explosion FX',
        description: 'Stock footage of a cinematic explosion.',
        thumbnail:
          'https://images.unsplash.com/photo-1583248483259-3a21af32a9a0?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VIDEO_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt: 'Large fireball explosion, dark background, slow motion',
          duration: 3,
          fps: 60,
        },
      },

      // === WORKFLOW EDITOR (5 Examples) ===
      {
        title: 'Image to Video Pipeline',
        description: 'Generate an image and then animate it into a video.',
        thumbnail:
          'https://images.unsplash.com/photo-1536240478700-b869070f9279?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.WORKFLOW_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          nodes: [
            {
              id: '1',
              type: 'text',
              data: { text: 'A mysterious forest' },
              position: { x: 100, y: 100 },
            },
            {
              id: '2',
              type: 'image_gen',
              data: { model: 'stable-diffusion-xl' },
              position: { x: 400, y: 100 },
            },
            {
              id: '3',
              type: 'video_gen',
              data: { duration: 4 },
              position: { x: 700, y: 100 },
            },
          ],
          edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
          ],
        },
      },
      {
        title: 'Upscale & Enhance',
        description: 'Generate an image and upscale it for high resolution.',
        thumbnail:
          'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.WORKFLOW_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          nodes: [
            {
              id: '1',
              type: 'text',
              data: { text: 'Detailed landscape' },
              position: { x: 100, y: 100 },
            },
            {
              id: '2',
              type: 'image_gen',
              data: { model: 'midjourney-v6' },
              position: { x: 400, y: 100 },
            },
            {
              id: '3',
              type: 'upscale',
              data: { scale: 4 },
              position: { x: 700, y: 100 },
            },
          ],
          edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
          ],
        },
      },
      {
        title: 'Character Consistency',
        description: 'Generate multiple consistent character poses.',
        thumbnail:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.WORKFLOW_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          nodes: [
            {
              id: '1',
              type: 'text',
              data: { text: 'Character concept: Warrior' },
              position: { x: 100, y: 100 },
            },
            {
              id: '2',
              type: 'image_gen',
              data: { model: 'stable-diffusion-xl', seed: 12345 },
              position: { x: 400, y: 50 },
            },
            {
              id: '3',
              type: 'image_gen',
              data: { model: 'stable-diffusion-xl', seed: 12345 },
              position: { x: 400, y: 250 },
            },
          ],
          edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e1-3', source: '1', target: '3' },
          ],
        },
      },
      {
        title: 'Prompt Expansion',
        description: 'Use AI assistant to expand simple prompts.',
        thumbnail:
          'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.WORKFLOW_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          nodes: [
            {
              id: '1',
              type: 'text',
              data: { text: 'A cat' },
              position: { x: 100, y: 100 },
            },
            {
              id: '2',
              type: 'assistant',
              data: { mode: 'expand' },
              position: { x: 400, y: 100 },
            },
            {
              id: '3',
              type: 'image_gen',
              data: { model: 'dall-e-3' },
              position: { x: 700, y: 100 },
            },
          ],
          edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e2-3', source: '2', target: '3' },
          ],
        },
      },
      {
        title: 'Social Media Content',
        description: 'Generate image and caption for social media.',
        thumbnail:
          'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.WORKFLOW_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          nodes: [
            {
              id: '1',
              type: 'text',
              data: { text: 'Coffee shop vibe' },
              position: { x: 100, y: 100 },
            },
            {
              id: '2',
              type: 'image_gen',
              data: { aspectRatio: '1:1' },
              position: { x: 400, y: 100 },
            },
            {
              id: '3',
              type: 'assistant',
              data: { mode: 'social-caption' },
              position: { x: 400, y: 300 },
            },
          ],
          edges: [
            { id: 'e1-2', source: '1', target: '2' },
            { id: 'e1-3', source: '1', target: '3' },
          ],
        },
      },

      // === AI ASSISTANT (5 Examples) ===
      {
        title: 'Creative Writing',
        description: 'Assistant for generating creative story ideas.',
        thumbnail:
          'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.AI_ASSISTANT,
        visibility: 'public',
        author: admin,
        content: {
          systemPrompt:
            'You are a creative writing assistant. Help users generate plot twists and character backstories.',
          temperature: 0.8,
        },
      },
      {
        title: 'Code Helper',
        description: 'Expert coding assistant for debugging and refactoring.',
        thumbnail:
          'https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.AI_ASSISTANT,
        visibility: 'public',
        author: admin,
        content: {
          systemPrompt:
            'You are a senior software engineer. Provide clean, efficient, and well-documented code.',
          temperature: 0.2,
        },
      },
      {
        title: 'Marketing Copy',
        description: 'Generate engaging marketing copy and headlines.',
        thumbnail:
          'https://images.unsplash.com/photo-1557838923-2985c318be48?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.AI_ASSISTANT,
        visibility: 'public',
        author: admin,
        content: {
          systemPrompt:
            'You are a marketing expert. Write punchy, persuasive copy for ads and social media.',
          temperature: 0.7,
        },
      },
      {
        title: 'Study Buddy',
        description: 'Explain complex topics in simple terms.',
        thumbnail:
          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.AI_ASSISTANT,
        visibility: 'public',
        author: admin,
        content: {
          systemPrompt:
            'You are a helpful tutor. Explain concepts clearly using analogies and simple language.',
          temperature: 0.5,
        },
      },
      {
        title: 'Travel Planner',
        description: 'Plan itineraries and suggest travel destinations.',
        thumbnail:
          'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.AI_ASSISTANT,
        visibility: 'public',
        author: admin,
        content: {
          systemPrompt:
            'You are a travel agent. Create detailed travel itineraries based on user preferences and budget.',
          temperature: 0.6,
        },
      },

      // === DESIGN EDITOR (5 Examples) ===
      {
        title: 'Instagram Post',
        description: 'Square layout for Instagram posts.',
        thumbnail:
          'https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.DESIGN_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          width: 1080,
          height: 1080,
          elements: [],
        },
      },
      {
        title: 'YouTube Thumbnail',
        description: 'Engagement optimized YouTube thumbnail layout.',
        thumbnail:
          'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.DESIGN_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          width: 1920,
          height: 1080,
          elements: [],
        },
      },
      {
        title: 'Business Card',
        description: 'Standard business card layout.',
        thumbnail:
          'https://images.unsplash.com/photo-1559136555-9303baea8ebd?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.DESIGN_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          width: 1050,
          height: 600,
          elements: [],
        },
      },
      {
        title: 'Poster A4',
        description: 'Vertical A4 poster format.',
        thumbnail:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.DESIGN_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          width: 2480,
          height: 3508,
          elements: [],
        },
      },
      {
        title: 'Facebook Cover',
        description: 'Header image for Facebook pages.',
        thumbnail:
          'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.DESIGN_EDITOR,
        visibility: 'public',
        author: admin,
        content: {
          width: 820,
          height: 312,
          elements: [],
        },
      },

      // === AUDIO GENERATORS (Music, Voice, SFX) (5 Examples) ===
      {
        title: 'Lo-Fi Chill Beat',
        description: 'Generate relaxing lo-fi hip hop beats.',
        thumbnail:
          'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.MUSIC_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Lo-fi hip hop beat, chill, relaxing, study music, piano sample',
          duration: 60,
        },
      },
      {
        title: 'Cinematic Score',
        description: 'Epic orchestral background music.',
        thumbnail:
          'https://images.unsplash.com/photo-1507838153414-b4b713384ebd?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.MUSIC_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Epic orchestral score, hans zimmer style, dramatic, tension building',
          duration: 120,
        },
      },
      {
        title: 'Podcast Intro Voice',
        description: 'Professional voiceover for podcast intros.',
        thumbnail:
          'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VOICE_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt: 'Deep male voice, professional, radio host style',
          text: 'Welcome back to the Future Tech podcast, where we explore the edges of innovation.',
        },
      },
      {
        title: 'Sci-Fi Sound Pack',
        description: 'Futuristic sound effects for games and video.',
        thumbnail:
          'https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.SOUND_EFFECT_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt: 'Laser blaster sound, futuristic weapon, sci-fi',
        },
      },
      {
        title: 'Meditation Ambience',
        description: 'Soothing nature sounds for meditation.',
        thumbnail:
          'https://images.unsplash.com/photo-1518176258769-f227c798150e?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.MUSIC_GENERATOR,
        visibility: 'public',
        author: admin,
        content: {
          prompt:
            'Ambient nature sounds, flowing water, birds chirping, soft pad',
          duration: 300,
        },
      },

      // === UPSCALER (5 Examples) ===
      {
        title: '4K Photo Upscale',
        description: 'Enhance low-res photos to striking 4K quality.',
        thumbnail:
          'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_UPSCALER,
        visibility: 'public',
        author: admin,
        content: {
          scale: 4,
          mode: 'photo',
        },
      },
      {
        title: 'Anime Enhancer',
        description: 'Upscale and de-noise anime illustrations.',
        thumbnail:
          'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_UPSCALER,
        visibility: 'public',
        author: admin,
        content: {
          scale: 2,
          mode: 'anime',
        },
      },
      {
        title: 'Old Photo Restoration',
        description: 'Restore and colorize old black and white photos.',
        thumbnail:
          'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_UPSCALER,
        visibility: 'public',
        author: admin,
        content: {
          scale: 2,
          faceEnhance: true,
          colorize: true,
        },
      },
      {
        title: 'Video Remaster',
        description: 'Upscale video to HD quality.',
        thumbnail:
          'https://images.unsplash.com/photo-1535016120720-40c6874c3b1c?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.VIDEO_UPSCALER,
        visibility: 'public',
        author: admin,
        content: {
          scale: 2,
          fps: 60,
        },
      },
      {
        title: 'Texture Sharpener',
        description: 'Enhance textures for 3D models.',
        thumbnail:
          'https://images.unsplash.com/photo-1518640027989-a30d5d7e498e?q=80&w=800&auto=format&fit=crop',
        type: TemplateTypeEnum.IMAGE_UPSCALER,
        visibility: 'public',
        author: admin,
        content: {
          scale: 4,
          denoise: 0.5,
        },
      },
    ];

    await this.repository.save(this.repository.create(templates));
  }
}
