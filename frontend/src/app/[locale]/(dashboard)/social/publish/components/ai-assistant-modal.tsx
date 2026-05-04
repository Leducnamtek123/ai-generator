'use client';

import React from 'react';
import {
  Wand2,
  Sparkles,
  Type,
  Zap,
  Check,
  Loader2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { cn } from '@/lib/utils';
import { enhancePrompt } from '@/lib/api/generations';
import { toast } from 'sonner';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (content: string) => void;
}

const TONES = [
  { id: 'professional', label: 'Professional', icon: Zap },
  { id: 'viral', label: 'Viral / Catchy', icon: Sparkles },
  { id: 'informative', label: 'Informative', icon: Type },
  { id: 'funny', label: 'Humorous', icon: Zap },
];

export function AiAssistantModal({
  isOpen,
  onClose,
  onApply,
}: AiAssistantModalProps) {
  const [prompt, setPrompt] = React.useState('');
  const [selectedTone, setSelectedTone] = React.useState('viral');
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [results, setResults] = React.useState<string[]>([]);
  const promptId = React.useId();
  const toneId = React.useId();

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const styles = {
        professional: 'professional and concise',
        viral: 'viral and catchy',
        informative: 'informative and educational',
        funny: 'humorous and playful',
      };
      const style = styles[selectedTone as keyof typeof styles] ?? selectedTone;

      const variants = await Promise.all([
        enhancePrompt({ prompt, style }),
        enhancePrompt({
          prompt: `${prompt}. Add a clear CTA and 2 hashtags.`,
          style,
        }),
        enhancePrompt({
          prompt: `${prompt}. Rewrite in thread style with a hook.`,
          style,
        }),
      ]);

      setResults(variants.flatMap((item) => (item.enhancedPrompt ? [item.enhancedPrompt] : [])));
    } catch (error) {
      console.error('Failed to generate suggestions', error);
      toast.error('Failed to generate suggestions.');
    }
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-2xl"
        >
          <GlassCard
            variant="morphism"
            className="border border-white/20 p-0 overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Creative Assistant</h3>
                  <p className="text-xs text-muted-foreground">
                    Draft social copy using backend AI APIs.
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} type="button">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label htmlFor={promptId} className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  What is this post about?
                </label>
                <textarea
                  id={promptId}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Example: A post about new social campaign launch."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm resize-none h-24 focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label htmlFor={toneId} className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Choose Tone
                </label>
                <div id={toneId} className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className={cn(
                        'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium',
                        selectedTone === tone.id
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10',
                      )}
                    >
                      <tone.icon className="w-4 h-4" />
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full py-6 rounded-xl text-md font-bold"
                disabled={!prompt || isGenerating}
                onClick={handleGenerate}
                type="button"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    AI is writing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-3" />
                    Generate Suggestions
                  </>
                )}
              </Button>

              <AnimatePresence>
                {results.length > 0 && (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="pt-6 border-t border-white/10 space-y-4"
                  >
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      Choose a suggestion
                    </label>
                    <div className="space-y-3">
                      {results.map((result, i) => (
                        <button
                          key={`${i}-${result.slice(0, 20)}`}
                          type="button"
                          className="group relative w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 text-left transition-all"
                          onClick={() => {
                            onApply(result);
                            onClose();
                          }}
                        >
                          <p className="text-sm leading-relaxed pr-8">{result}</p>
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-primary-foreground" />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </m.div>
      </LazyMotion>
    </div>
  );
}
