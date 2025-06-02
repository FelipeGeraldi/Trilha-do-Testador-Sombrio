
import { GoogleGenAI } from "@google/genai";

export interface PlayerInventory {
  items: string[];
}

export interface AdventureGameState {
  currentSceneText: string;
  currentSceneImage: string | null;
  playerAction: string;
  inventory: PlayerInventory;
  isLoading: boolean;
  error: string | null;
  isGameOver: boolean;
  gameMessage: string | null; // For special messages like "Item acquired" or "Game Over"
  apiKeyChecked: boolean;
  apiInstance: GoogleGenAI | null;
}

// Expected structure from Gemini for a game turn
export interface GeminiAdventureResponse {
  sceneDescription: string; // The new scene text
  imagePrompt: string; // A concise prompt for Imagen based on the new scene
  updatedInventory?: string[]; // Optional: Full new list of inventory items
  addItem?: string; // Optional: Item to add
  removeItem?: string; // Optional: Item to remove
  gameMessage?: string; // Optional: A message to display to the player
  isGameOver?: boolean; // Optional: Indicates if the game has ended
  decisionPoints?: string[]; // Optional: suggested actions for the player
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web?: GroundingChunkWeb;
}
