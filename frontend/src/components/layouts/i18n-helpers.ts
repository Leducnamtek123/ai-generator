type Translator = (key: string, values?: Record<string, string | number | Date>) => string;

const LABEL_KEYS: Record<string, string> = {
  Home: "navigation.home",
  Stock: "navigation.stock",
  Community: "navigation.community",
  "Social Hub": "navigation.socialHub",
  Dashboard: "navigation.socialDashboard",
  Channels: "navigation.channels",
  Calendar: "navigation.calendar",
  Projects: "navigation.projects",
  History: "navigation.history",
  Notifications: "navigation.notifications",
  Admin: "navigation.admin",
  Settings: "navigation.settings",
  "Image Generator": "tools.imageGenerator",
  "Image Editor": "tools.imageEditor",
  "Image Upscaler": "tools.imageUpscaler",
  "Image Extender": "tools.imageExtender",
  Variations: "tools.variations",
  Assistant: "tools.assistant",
  "Video Generator": "tools.videoGenerator",
  "Video Project Editor": "tools.videoEditor",
  "Clip Editor": "tools.clipEditor",
  "Video Upscaler": "tools.videoUpscaler",
  "Lip Sync": "tools.lipSync",
  "Voice Generator": "tools.voiceGenerator",
  "Sound Effect Generator": "tools.sfxGenerator",
  "Music Generator": "tools.musicGenerator",
  "Creative Studio": "tools.creativeStudio",
  "VisualFlow Studio": "tools.visualFlowStudio",
  "Workflow Editor": "tools.workflowEditor",
  "Design Editor": "tools.designEditor",
  "Mockup Generator": "tools.mockupGenerator",
  "Icon Generator": "tools.iconGenerator",
  "Background Remover": "tools.bgRemover",
  "Skin Enhancer": "tools.skinEnhancer",
  "Change Camera": "tools.cameraChange",
  "Sketch to Image": "tools.sketchToImage",
  "Find assets": "highlights.findAssets",
  "Image Gen": "highlights.imageGen",
  "Video Gen": "highlights.videoGen",
  Editor: "highlights.editor",
  Upscaler: "highlights.upscaler",
  "3D Models": "highlights.models",
  Audio: "highlights.audio",
  "My Collections": "stock.collections",
  Downloads: "stock.downloads",
  IMAGE: "stock.sections.image",
  VIDEO: "stock.sections.video",
  AUDIO: "stock.sections.audio",
  OTHERS: "stock.sections.others",
  "All images": "stock.items.allImages",
  Vectors: "stock.items.vectors",
  Photos: "stock.items.photos",
  Illustrations: "stock.items.illustrations",
  Icons: "stock.items.icons",
  "3D": "stock.items.threeD",
  Videos: "stock.items.videos",
  "Video templates": "stock.items.videoTemplates",
  "Motion graphics": "stock.items.motionGraphics",
  "Sound Effects": "stock.items.soundEffects",
  Music: "stock.items.music",
  Templates: "stock.items.templates",
  Mockups: "stock.items.mockups",
  Fonts: "stock.items.fonts",
  PSD: "stock.items.psd",
};

const TABS = new Map<string, string>([
  ["Personal", "tabs.personal"],
  ["Community", "tabs.community"],
  ["Templates", "tabs.templates"],
  ["Tutorials", "tabs.tutorials"],
  ["My Creations", "tabs.myCreations"],
]);

export function translateLayoutLabel(t: Translator, label: string) {
  const key = LABEL_KEYS[label] ?? TABS.get(label);
  return key ? t(key) : label;
}

export function translateBillingStatus(t: Translator, status: string) {
  switch (status) {
    case "active":
      return t("billing.active");
    case "trialing":
      return t("billing.trial");
    case "past_due":
      return t("billing.pastDue");
    case "canceled":
      return t("billing.canceled");
    case "free":
      return t("billing.free");
    default:
      return status;
  }
}
