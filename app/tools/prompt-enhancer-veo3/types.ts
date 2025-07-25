export interface Character {
  id: string;
  name: string;
  description: string;
  speech: string;
}

export interface PromptData {
  scene: string;
  style: string;
  camera: string;
  characters: Character[];
  action: string;
  lighting: string;
  mood: string;
  language: string;
} 