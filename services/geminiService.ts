
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_TEXT_MODEL, IMAGEN_IMAGE_MODEL, INITIAL_GAME_PROMPT, PLAYER_ACTION_PROMPT_TEMPLATE, IMAGE_PROMPT_FOR_SCENE_TEMPLATE } from '../constants';
import type { GeminiAdventureResponse, PlayerInventory } from '../types';

const API_TEXT_TIMEOUT = 15000; // 15 seconds for text model
const API_IMAGE_TIMEOUT = 25000; // 25 seconds for image model

// Helper function to add timeout to promises
function promiseWithTimeout<T>(promise: Promise<T>, ms: number, context: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operação da IA (${context}) excedeu o tempo limite de ${ms / 1000}s.`));
    }, ms);

    promise
      .then(value => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(err => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// Helper function to robustly parse JSON from Gemini's response
function parseJsonFromGeminiResponse<T>(responseText: string, context: string): T | null {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[1]) {
    jsonStr = match[1].trim();
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    console.error(`Falha ao analisar JSON de ${context}:`, error, "Resposta bruta:", responseText);
    const complexMatch = jsonStr.match(/({[\s\S]+})/m);
    if (complexMatch && complexMatch[1]) {
      try {
        return JSON.parse(complexMatch[1]) as T;
      } catch (nestedError) {
        console.error(`Falha ao analisar JSON extraído de ${context}:`, nestedError);
        throw new Error(`Resposta da IA em formato JSON inválido após tentativa de extração. Contexto: ${context}.`);
      }
    }
    throw new Error(`Resposta da IA não contém JSON válido. Contexto: ${context}.`);
  }
}


export const startGame = async (ai: GoogleGenAI): Promise<GeminiAdventureResponse> => {
  const prompt = INITIAL_GAME_PROMPT();
  try {
    const generateContentPromise = ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const response: GenerateContentResponse = await promiseWithTimeout(generateContentPromise, API_TEXT_TIMEOUT, "início do jogo (gerar conteúdo)");
    
    const text = response.text;
    const parsed = parseJsonFromGeminiResponse<GeminiAdventureResponse>(text, "início do jogo");

    if (!parsed || !parsed.sceneDescription || !parsed.imagePrompt) {
      console.error("Resposta de início de jogo malformada:", parsed, "Raw:", text);
      throw new Error("Não foi possível iniciar o jogo devido a uma resposta inesperada da IA.");
    }
    return parsed;
  } catch (error) {
    console.error("Erro ao iniciar o jogo:", error);
    throw new Error(`Falha ao iniciar o jogo: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const processPlayerAction = async (
  ai: GoogleGenAI,
  currentScene: string,
  playerAction: string,
  inventory: PlayerInventory
): Promise<GeminiAdventureResponse> => {
  const prompt = PLAYER_ACTION_PROMPT_TEMPLATE(currentScene, playerAction, inventory.items);
  try {
    const generateContentPromise = ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    const response: GenerateContentResponse = await promiseWithTimeout(generateContentPromise, API_TEXT_TIMEOUT, `ação do jogador (gerar conteúdo): ${playerAction}`);

    const text = response.text;
    const parsed = parseJsonFromGeminiResponse<GeminiAdventureResponse>(text, `ação do jogador: ${playerAction}`);

    if (!parsed || !parsed.sceneDescription || !parsed.imagePrompt) {
      console.error("Resposta de ação do jogador malformada:", parsed, "Raw:", text);
      throw new Error("Não foi possível processar a ação devido a uma resposta inesperada da IA.");
    }
    return parsed;
  } catch (error) {
    console.error(`Erro ao processar ação do jogador "${playerAction}":`, error);
    throw new Error(`Falha ao processar sua ação: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const generateSceneImage = async (ai: GoogleGenAI, imagePrompt: string): Promise<string | null> => {
  if (!imagePrompt || imagePrompt.trim() === "") {
    console.warn("Prompt de imagem vazio, não gerando imagem.");
    return null;
  }
  const fullPrompt = IMAGE_PROMPT_FOR_SCENE_TEMPLATE(imagePrompt);
  try {
    const generateImagesPromise = ai.models.generateImages({
      model: IMAGEN_IMAGE_MODEL,
      prompt: fullPrompt,
      config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
    });
    const response = await promiseWithTimeout(generateImagesPromise, API_IMAGE_TIMEOUT, `gerar imagem: ${imagePrompt}`);

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    console.warn("Nenhuma imagem gerada ou dados de imagem ausentes.");
    return null;
  } catch (error) {
    console.error(`Erro ao gerar imagem para o prompt "${imagePrompt}":`, error);
    // Propagate specific timeout errors to be potentially handled differently or logged
    if (error instanceof Error && error.message.includes("excedeu o tempo limite")) {
        throw error; 
    }
    return null; // Não bloquear o jogo se a geração da imagem falhar por outros motivos
  }
};
