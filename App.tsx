
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { AdventureGameState, GeminiAdventureResponse, PlayerInventory } from './types';
import { startGame, processPlayerAction, generateSceneImage } from './services/geminiService';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorDisplay from './components/ErrorDisplay';
import SceneDisplay from './components/SceneDisplay';
import ActionInput from './components/ActionInput';
import InventoryDisplay from './components/InventoryDisplay';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<AdventureGameState>({
    currentSceneText: "",
    currentSceneImage: null,
    playerAction: "",
    inventory: { items: [] },
    isLoading: true,
    error: null,
    isGameOver: false,
    gameMessage: null,
    apiKeyChecked: false,
    apiInstance: null,
  });

  const sceneTextRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    sceneTextRef.current?.scrollTo({ top: sceneTextRef.current.scrollHeight, behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [gameState.currentSceneText]);

  const initializeApiKey = useCallback(() => {
    if (gameState.apiKeyChecked) return;
    
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      setGameState(prev => ({
        ...prev,
        error: "A Chave da API está ausente. Por favor, configure process.env.API_KEY e atualize.",
        isLoading: false,
        apiKeyChecked: true,
      }));
      return;
    }
    try {
      const ai = new GoogleGenAI({ apiKey });
      setGameState(prev => ({ ...prev, apiInstance: ai, apiKeyChecked: true, isLoading: true })); // Keep isLoading true or set to true
    } catch (err) {
       setGameState(prev => ({
        ...prev,
        error: `Erro ao inicializar API: ${err instanceof Error ? err.message : "Erro desconhecido."}`,
        isLoading: false,
        apiKeyChecked: true,
      }));
    }
  }, [gameState.apiKeyChecked]);

  useEffect(() => {
    initializeApiKey();
  }, [initializeApiKey]);

  const handleStartGame = useCallback(async () => {
    if (!gameState.apiInstance) {
      setGameState(prev => ({ ...prev, error: "API não inicializada.", isLoading: false }));
      return;
    }
    // Ensure isLoading is true when starting the game
    setGameState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      isGameOver: false,
      gameMessage: null,
      inventory: { items: [] },
      currentSceneText: "", // Explicitly clear scene text for restart
      currentSceneImage: null, // Explicitly clear image for restart
    }));

    try {
      const initialData = await startGame(gameState.apiInstance);
      setGameState(prev => ({
        ...prev,
        currentSceneText: initialData.sceneDescription,
        isGameOver: initialData.isGameOver || false,
        gameMessage: initialData.gameMessage || null,
      }));
      if (initialData.imagePrompt) {
        const imageUrl = await generateSceneImage(gameState.apiInstance, initialData.imagePrompt);
        setGameState(prev => ({ ...prev, currentSceneImage: imageUrl }));
      }
    } catch (err) {
      setGameState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao iniciar o jogo.",
      }));
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  }, [gameState.apiInstance]);

  useEffect(() => {
    // Auto-start the game if API is ready, API key check is done, game hasn't started yet, no errors, and not game over.
    if (gameState.apiInstance && gameState.apiKeyChecked && !gameState.currentSceneText && !gameState.error && !gameState.isGameOver) {
      handleStartGame();
    }
    // Dependencies are chosen to trigger this effect mainly when apiInstance or apiKeyChecked state changes,
    // and to ensure game starts only if conditions (like no currentSceneText) are met.
  }, [gameState.apiInstance, gameState.apiKeyChecked, gameState.currentSceneText, gameState.error, gameState.isGameOver, handleStartGame]);


  const updateInventory = (currentInventory: PlayerInventory, response: GeminiAdventureResponse): PlayerInventory => {
    let newItems = [...currentInventory.items];
    if (response.updatedInventory) {
      newItems = response.updatedInventory;
    } else {
      if (response.addItem) {
        if (!newItems.includes(response.addItem)) {
          newItems.push(response.addItem);
        }
      }
      if (response.removeItem) {
        newItems = newItems.filter(item => item !== response.removeItem);
      }
    }
    return { items: newItems };
  };


  const handlePlayerAction = async (action: string) => {
    if (!gameState.apiInstance || gameState.isGameOver || gameState.isLoading) return;

    setGameState(prev => ({ ...prev, isLoading: true, error: null, playerAction: action, gameMessage: null }));

    try {
      const response = await processPlayerAction(
        gameState.apiInstance,
        gameState.currentSceneText,
        action,
        gameState.inventory
      );

      const newInventory = updateInventory(gameState.inventory, response);
      
      setGameState(prev => ({
        ...prev,
        currentSceneText: prev.currentSceneText + "\n\n> " + action + "\n\n" + response.sceneDescription,
        inventory: newInventory,
        isGameOver: response.isGameOver || false,
        gameMessage: response.gameMessage || null,
        currentSceneImage: null, // Clear previous image before loading new one
      }));

      if (response.imagePrompt) {
        const imageUrl = await generateSceneImage(gameState.apiInstance, response.imagePrompt);
        setGameState(prev => ({ ...prev, currentSceneImage: imageUrl }));
      }

    } catch (err) {
      setGameState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : "Ocorreu um erro desconhecido ao processar sua ação.",
      }));
    } finally {
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  if (!gameState.apiKeyChecked && gameState.isLoading) { // Show API Key check loading only if not checked AND initially loading
     return <LoadingIndicator message="Verificando API Key..." />;
  }
  
  if (gameState.error && gameState.error.includes("A Chave da API está ausente")) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 p-4">
        <div className="bg-red-700 border border-red-900 text-red-100 px-4 py-3 rounded-lg relative max-w-md mx-auto text-center shadow-lg" role="alert">
          <strong className="font-bold block text-lg">Erro de Configuração!</strong>
          <span className="block sm:inline">{gameState.error}</span>
           <p className="text-sm mt-1">Por favor, defina a variável de ambiente API_KEY e atualize a página.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200 p-4">
      <ErrorDisplay message={gameState.error || ""} onClear={() => setGameState(prev => ({ ...prev, error: null }))} />

      <header className="w-full max-w-4xl mx-auto mb-4 text-center sticky top-0 bg-gray-900 py-4 z-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-purple-500 tracking-tight">
          Trilha do Testador Sombrio
        </h1>
      </header>

      <main className="w-full max-w-4xl mx-auto flex-grow flex flex-col overflow-hidden">
        <SceneDisplay
          sceneText={gameState.currentSceneText}
          imageUrl={gameState.currentSceneImage}
          isLoadingImage={gameState.isLoading && !gameState.currentSceneImage} 
          ref={sceneTextRef}
        />
        {gameState.gameMessage && (
          <div className="my-2 p-3 bg-purple-700 bg-opacity-50 text-purple-200 rounded-md text-center">
            {gameState.gameMessage}
          </div>
        )}
        <InventoryDisplay inventory={gameState.inventory} />
      </main>
      
      <footer className="w-full max-w-4xl mx-auto mt-auto sticky bottom-0 bg-gray-900 py-4 z-10">
        {gameState.isLoading && !gameState.isGameOver && gameState.currentSceneText && <LoadingIndicator message="Processando..." />}
        {!gameState.isGameOver ? (
          <ActionInput onActionSubmit={handlePlayerAction} disabled={gameState.isLoading} />
        ) : (
          <div className="text-center">
            <p className="text-xl text-red-500 font-bold mb-4">FIM DE JOGO</p>
            <button
              onClick={handleStartGame}
              className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Jogar Novamente
            </button>
          </div>
        )}
         <p className="text-xs text-gray-600 text-center mt-3">Desenvolvido com Google Gemini & Imagen.</p>
      </footer>
    </div>
  );
};

export default App;
