import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetEntity } from '../../../../assets/infrastructure/persistence/relational/entities/asset.entity';
import { UserEntity } from '../../../../users/infrastructure/persistence/relational/entities/user.entity';

@Injectable()
export class AssetSeedService {
  constructor(
    @InjectRepository(AssetEntity)
    private repository: Repository<AssetEntity>,
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

    const assets = [
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt:
            'Cyberpunk street food vendor in neon rain, cinematic lighting, 8k',
          authorName: 'NeonDreamer',
          likes: 1240,
          aspectRatio: '3:4',
          isPublic: true,
          category: 'AI Images',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt:
            'Abstract fluid gradients, pastel colors, glassmorphism style',
          authorName: 'DesignBot',
          likes: 850,
          aspectRatio: '1:1',
          isPublic: true,
          category: 'Vectors',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt:
            'Minimalist interior design, japanese zen garden influence, soft sunlight',
          authorName: 'ArchViz',
          likes: 2100,
          aspectRatio: '16:9',
          isPublic: true,
          category: 'Photos',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Futuristic astronaut portrait, vibrant oil painting style',
          authorName: 'AstroArt',
          likes: 3400,
          aspectRatio: '3:4',
          isPublic: true,
          category: 'AI Images',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Isometric 3D forest scene, low poly, blender render',
          authorName: 'PolyMaster',
          likes: 920,
          aspectRatio: '4:3',
          isPublic: true,
          category: '3D',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1633167606207-d840b5070fc2?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Detailed macro photography of a mechanical eye, steampunk',
          authorName: 'GearHead',
          likes: 1560,
          aspectRatio: '3:4',
          isPublic: true,
          category: 'Photos',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Dark fantasy castle, misty mountains, ominous lighting',
          authorName: 'DarkSoulsFan',
          likes: 2800,
          aspectRatio: '16:9',
          isPublic: true,
          category: 'AI Images',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Retro 80s synthesizer wave, grid landscape, neon sun',
          authorName: 'SynthWave',
          likes: 1100,
          aspectRatio: '4:3',
          isPublic: true,
          category: 'Vectors',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1614726365723-49cfae92782b?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Ethereal jellyfish in deep space, bioluminescent',
          authorName: 'SpaceMarine',
          likes: 4200,
          aspectRatio: '3:4',
          isPublic: true,
          category: 'AI Images',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'A cute robot gardener watering plants, pixar style',
          authorName: 'PixarFan',
          likes: 5600,
          aspectRatio: '1:1',
          isPublic: true,
          category: '3D',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1655721868461-125032504859?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Surreal melting clock in desert, dali style',
          authorName: 'Surrealist',
          likes: 890,
          aspectRatio: '3:5',
          isPublic: true,
          category: 'AI Images',
        },
      },
      {
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618172193763-c511deb635ca?q=80&w=800&auto=format&fit=crop',
        userId: admin.id,
        metadata: {
          prompt: 'Golden hour cityscape, future tokyo, flying cars',
          authorName: 'CityScaper',
          likes: 1750,
          aspectRatio: '16:9',
          isPublic: true,
          category: 'Photos',
        },
      },
    ];

    await this.repository.save(this.repository.create(assets as any));
  }
}
