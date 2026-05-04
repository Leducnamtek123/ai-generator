import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * Material registry — built-in visual styles for image/video generation.
 * Ported from FlowKit: provides style presets that control the visual aesthetic.
 */

export interface Material {
  id: string;
  name: string;
  styleInstruction: string;
  negativePrompt: string;
  scenePrefix: string;
  lighting: string;
  isBuiltin: boolean;
}

const BUILTIN_IDS = new Set([
  'realistic',
  '3d_pixar',
  'anime',
  'ghibli',
  'stop_motion',
  'minecraft',
  'oil_painting',
  'watercolor',
  'comic_book',
  'cyberpunk',
  'claymation',
  'lego',
  'retro_vhs',
]);

const MATERIALS: Map<string, Material> = new Map([
  [
    'realistic',
    {
      id: 'realistic',
      name: 'Photorealistic',
      styleInstruction:
        'Photorealistic RAW photograph, shot on Canon EOS R5, 35mm lens, natural available light, real footage.',
      negativePrompt:
        'NOT 3D render, NOT CGI, NOT digital art, NOT illustration, NOT anime, NOT painting, NOT cartoon.',
      scenePrefix:
        'Real RAW photograph, shot on Canon EOS R5, 35mm lens, natural available light.',
      lighting: 'Studio lighting, highly detailed',
      isBuiltin: true,
    },
  ],
  [
    '3d_pixar',
    {
      id: '3d_pixar',
      name: '3D Pixar',
      styleInstruction:
        '3D animated style, Pixar-quality rendering, Disney-Pixar aesthetic. Smooth subsurface scattering skin, expressive cartoon eyes, stylized proportions, vibrant saturated colors.',
      negativePrompt:
        'NOT photorealistic, NOT photograph, NOT live action, NOT anime, NOT flat 2D.',
      scenePrefix:
        '3D animated Pixar-quality rendering, vibrant colors, cinematic lighting.',
      lighting: 'Studio lighting, global illumination, highly detailed',
      isBuiltin: true,
    },
  ],
  [
    'anime',
    {
      id: 'anime',
      name: 'Anime',
      styleInstruction:
        'Japanese anime style, cel-shaded rendering, vibrant saturated colors, clean sharp linework, large expressive eyes, stylized anatomy. High-quality anime production.',
      negativePrompt:
        'NOT photorealistic, NOT 3D render, NOT oil painting, NOT sketch, NOT watercolor, NOT Western cartoon.',
      scenePrefix:
        'Anime style, cel-shaded, vibrant colors, clean linework, dramatic anime lighting.',
      lighting: 'Anime-style dramatic lighting, highly detailed',
      isBuiltin: true,
    },
  ],
  [
    'ghibli',
    {
      id: 'ghibli',
      name: 'Studio Ghibli',
      styleInstruction:
        'Studio Ghibli anime style, hand-painted watercolor backgrounds, soft pastel colors, gentle rounded character designs, whimsical atmosphere. Hayao Miyazaki aesthetic.',
      negativePrompt:
        'NOT photorealistic, NOT 3D render, NOT dark, NOT gritty, NOT sharp edges, NOT Western cartoon.',
      scenePrefix:
        'Studio Ghibli anime style, hand-painted watercolor backgrounds, soft pastel colors, gentle whimsical atmosphere.',
      lighting:
        'Soft natural Ghibli lighting, golden hour warmth, dappled sunlight',
      isBuiltin: true,
    },
  ],
  [
    'stop_motion',
    {
      id: 'stop_motion',
      name: 'Felt & Wood Stop Motion',
      styleInstruction:
        'Stop-motion animation style with handcrafted felt and wood puppets. Visible felt fabric texture, wooden joints and dowels, miniature handmade set pieces. Laika Studios / Wes Anderson aesthetic.',
      negativePrompt:
        'NOT photorealistic, NOT 3D render, NOT digital, NOT anime, NOT smooth surfaces, NOT plastic.',
      scenePrefix:
        'Stop-motion style, handcrafted felt and wood puppets, miniature set, warm workshop lighting.',
      lighting: 'Warm practical miniature lighting, macro photography detail',
      isBuiltin: true,
    },
  ],
  [
    'minecraft',
    {
      id: 'minecraft',
      name: 'Minecraft',
      styleInstruction:
        'Minecraft voxel art style, blocky cubic geometry, pixel textures, 16x16 texture resolution aesthetic, square heads and bodies. Everything made of cubes.',
      negativePrompt:
        'NOT smooth, NOT round, NOT photorealistic, NOT anime, NOT organic curves, NOT high-poly.',
      scenePrefix:
        'Minecraft style, blocky voxel world, pixel textures, cubic geometry, game screenshot aesthetic.',
      lighting: 'Minecraft-style ambient lighting, block shadows',
      isBuiltin: true,
    },
  ],
  [
    'oil_painting',
    {
      id: 'oil_painting',
      name: 'Oil Painting',
      styleInstruction:
        'Classical oil painting on canvas, visible thick brushstrokes, rich impasto texture, warm color palette, chiaroscuro lighting. Museum-quality fine art painting.',
      negativePrompt:
        'NOT photorealistic, NOT digital art, NOT 3D render, NOT anime, NOT flat colors, NOT cartoon.',
      scenePrefix:
        'Oil painting style, visible brushstrokes, rich impasto texture, warm palette, dramatic chiaroscuro lighting.',
      lighting: 'Dramatic chiaroscuro lighting, rich tonal depth',
      isBuiltin: true,
    },
  ],
  [
    'watercolor',
    {
      id: 'watercolor',
      name: 'Watercolor',
      styleInstruction:
        'Soft watercolor painting on cold-press paper, loose wet brushwork, translucent color washes bleeding into each other. Delicate ink outlines, impressionistic and dreamy.',
      negativePrompt:
        'NOT photorealistic, NOT 3D render, NOT digital art, NOT anime, NOT sharp edges, NOT bold outlines.',
      scenePrefix:
        'Watercolor painting style, soft wet brushwork, translucent color washes, delicate ink outlines.',
      lighting: 'Soft diffused natural light, watercolor wash',
      isBuiltin: true,
    },
  ],
  [
    'comic_book',
    {
      id: 'comic_book',
      name: 'Comic Book',
      styleInstruction:
        'American comic book art style, bold black ink outlines, flat vibrant colors with halftone dot shading, dynamic action poses. Marvel/DC superhero comic aesthetic.',
      negativePrompt:
        'NOT photorealistic, NOT 3D render, NOT anime, NOT watercolor, NOT soft edges, NOT muted colors.',
      scenePrefix:
        'Comic book style, bold ink outlines, vibrant flat colors, halftone shading, dynamic composition.',
      lighting: 'High contrast comic lighting, dramatic shadows, rim light',
      isBuiltin: true,
    },
  ],
  [
    'cyberpunk',
    {
      id: 'cyberpunk',
      name: 'Cyberpunk',
      styleInstruction:
        'Cyberpunk sci-fi aesthetic, neon-lit dark urban environment, holographic displays, rain-slicked streets reflecting neon signs. Blade Runner meets Ghost in the Shell.',
      negativePrompt:
        'NOT natural environment, NOT bright daylight, NOT historical, NOT cartoon, NOT fantasy medieval.',
      scenePrefix:
        'Cyberpunk aesthetic, neon-lit dark urban, holographic displays, rain-slicked streets, purple and cyan neon.',
      lighting: 'Neon rim lighting, volumetric fog, cyan and magenta',
      isBuiltin: true,
    },
  ],
  [
    'claymation',
    {
      id: 'claymation',
      name: 'Claymation',
      styleInstruction:
        'Clay animation style, characters made of modeling clay with visible fingerprint textures, slightly imperfect sculpted features. Wallace & Gromit / Aardman aesthetic.',
      negativePrompt:
        'NOT photorealistic, NOT digital, NOT anime, NOT smooth skin, NOT 3D render, NOT glass or metal surfaces.',
      scenePrefix:
        'Claymation style, clay puppet characters with fingerprint textures, miniature handmade sets, warm practical lighting.',
      lighting: 'Warm miniature set lighting, soft shadows, macro detail',
      isBuiltin: true,
    },
  ],
  [
    'lego',
    {
      id: 'lego',
      name: 'LEGO',
      styleInstruction:
        'LEGO brick style, characters are LEGO minifigures with yellow skin and claw hands, environments built entirely from LEGO bricks. The LEGO Movie aesthetic.',
      negativePrompt:
        'NOT photorealistic, NOT organic, NOT smooth, NOT anime, NOT round shapes, NOT natural materials.',
      scenePrefix:
        'LEGO style, minifigure characters, brick-built environments, visible studs, plastic ABS texture.',
      lighting:
        'Bright toy photography lighting, sharp focus, product shot quality',
      isBuiltin: true,
    },
  ],
  [
    'retro_vhs',
    {
      id: 'retro_vhs',
      name: 'Retro VHS',
      styleInstruction:
        '1980s VHS tape aesthetic, analog video noise and scan lines, slightly washed-out warm colors, CRT TV curvature, tracking artifacts. Retro camcorder footage feel.',
      negativePrompt:
        'NOT modern, NOT 4K, NOT clean, NOT digital, NOT anime, NOT sharp, NOT high-definition.',
      scenePrefix:
        'Retro VHS style, analog scan lines, warm washed-out colors, CRT curvature, nostalgic 80s grain.',
      lighting: 'Warm tungsten lighting, CRT glow, analog video bloom',
      isBuiltin: true,
    },
  ],
]);

@Injectable()
export class MaterialsService {
  private readonly logger = new Logger(MaterialsService.name);

  listMaterials(): Material[] {
    return Array.from(MATERIALS.values());
  }

  getMaterial(id: string): Material | undefined {
    return MATERIALS.get(id);
  }

  registerMaterial(material: Omit<Material, 'isBuiltin'>): Material {
    if (BUILTIN_IDS.has(material.id)) {
      throw new BadRequestException(
        `Cannot override built-in material '${material.id}'`,
      );
    }
    const full: Material = { ...material, isBuiltin: false };
    MATERIALS.set(material.id, full);
    this.logger.log(`Registered custom material: ${material.id}`);
    return full;
  }

  unregisterMaterial(id: string): boolean {
    if (BUILTIN_IDS.has(id)) {
      throw new BadRequestException(
        `Cannot remove built-in material '${id}'`,
      );
    }
    return MATERIALS.delete(id);
  }

  /**
   * Apply a material's scene prefix to a prompt for consistent styling.
   */
  applyToPrompt(materialId: string, prompt: string): string {
    const mat = MATERIALS.get(materialId);
    if (!mat) return prompt;
    if (prompt.startsWith(mat.scenePrefix)) return prompt;
    return `${mat.scenePrefix} ${prompt}`;
  }

  /**
   * Build a full generation prompt with material style instruction + negative.
   */
  buildStyledPrompt(
    materialId: string,
    prompt: string,
  ): { prompt: string; negativePrompt?: string } {
    const mat = MATERIALS.get(materialId);
    if (!mat) return { prompt };
    return {
      prompt: `${mat.scenePrefix} ${prompt}. ${mat.lighting}`,
      negativePrompt: mat.negativePrompt,
    };
  }
}
