import React, { useState, useEffect } from 'react';
import { PetModel, PlayerModel } from './types/pet';
import { getPetsForOwner, saveCurrentSession, adoptPet, updatePet } from './services/storage';
import { initFirebaseIfAvailable } from './services/firebase';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { LoginScreen } from './pages/LoginScreen';
import { RegisterScreen } from './pages/RegisterScreen';
import { PetSelectionScreen } from './pages/PetSelectionScreen';
import { PetRoomScreen } from './pages/PetRoomScreen';
import { MyPetsScreen } from './pages/MyPetsScreen';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'welcome' | 'login' | 'register' | 'adopt' | 'room' | 'my-pets'>('welcome');
  const [player, setPlayer] = useState<PlayerModel | null>(null);
  const [pets, setPets] = useState<PetModel[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Initialize Firebase connection in the background
  useEffect(() => {
    initFirebaseIfAvailable();
  }, []);

  // Fetch pets for player
  const loadPlayerPets = async (currentPlayer: PlayerModel) => {
    setLoading(true);
    try {
      const userPets = await getPetsForOwner(currentPlayer.id);
      setPets(userPets);

      if (userPets.length > 0) {
        setActivePetId(userPets[0].petId);
        setCurrentView('my-pets');
      } else {
        setCurrentView('adopt');
      }
    } catch (err) {
      console.error('Failed to load pets', err);
    } finally {
      setLoading(false);
    }
  };

  // Login success
  const handleLoginSuccess = async (loggedInPlayer: PlayerModel) => {
    setPlayer(loggedInPlayer);
    await loadPlayerPets(loggedInPlayer);
  };

  // Register success -> go to adopt first pet
  const handleRegisterSuccess = (registeredPlayer: PlayerModel) => {
    setPlayer(registeredPlayer);
    setPets([]);
    setCurrentView('adopt');
  };

  // Pet creation success
  const handlePetCreated = (newPet: PetModel) => {
    const updated = [...pets, newPet];
    setPets(updated);
    setActivePetId(newPet.petId);
    setCurrentView('room');
  };

  // Give in adoption / Delete pet
  const handleAdoptPet = async (petId: string) => {
    await adoptPet(petId);
    const updated = pets.filter((p) => p.petId !== petId);
    setPets(updated);
    if (updated.length === 0) {
      setActivePetId(null);
      setCurrentView('adopt');
    } else {
      if (activePetId === petId) {
        setActivePetId(updated[0].petId);
      }
      setCurrentView('my-pets');
    }
  };

  // Rename pet
  const handleRenamePet = async (petId: string, newName: string) => {
    const target = pets.find((p) => p.petId === petId);
    if (!target) return;
    const updatedPet: PetModel = { ...target, name: newName };
    const updatedList = pets.map((p) => (p.petId === petId ? updatedPet : p));
    setPets(updatedList);
    await updatePet(updatedPet);
  };

  // Logout
  const handleLogout = () => {
    setPlayer(null);
    setPets([]);
    setActivePetId(null);
    saveCurrentSession(null);
    setCurrentView('welcome');
  };

  // Refresh active pets list
  const handleRefreshPets = async () => {
    if (!player) return;
    const userPets = await getPetsForOwner(player.id);
    setPets(userPets);
    if (userPets.length === 0) {
      setCurrentView('adopt');
    } else if (!userPets.some((p) => p.petId === activePetId)) {
      setActivePetId(userPets[0].petId);
    }
  };

  const activePet = pets.find((p) => p.petId === activePetId) || pets[0];

  return (
    <div className="w-screen h-[100vh] h-[100svh] overflow-hidden bg-slate-950 flex items-center justify-center relative select-none">
      {/* Ambient background glow on desktop */}
      <div className="fixed inset-0 pointer-events-none opacity-25 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500/30 via-orange-950/20 to-slate-950" />

      {/* Strict 9:16 Aspect Ratio Viewport Container (ancho = altura * 9 / 16) */}
      <div
        style={{
          height: '100svh',
          width: 'min(calc(100svh * 9 / 16), 100vw)',
          maxHeight: '100svh',
          aspectRatio: '9 / 16',
        }}
        className="relative bg-amber-50 shadow-2xl flex flex-col justify-between overflow-hidden sm:rounded-3xl sm:border sm:border-amber-900/10"
      >
        {loading && (
          <div className="w-full h-full flex items-center justify-center bg-amber-50">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center text-3xl animate-bounce shadow-lg">
                🐾
              </div>
              <p className="font-['Fredoka'] font-bold text-lg text-amber-900">
                Cargando Mascoticas IA...
              </p>
            </div>
          </div>
        )}

        {!loading && currentView === 'welcome' && (
          <WelcomeScreen
            onSelectExisting={() => setCurrentView('login')}
            onSelectCreate={() => setCurrentView('register')}
          />
        )}

        {!loading && currentView === 'login' && (
          <LoginScreen
            onSuccess={handleLoginSuccess}
            onBack={() => setCurrentView('welcome')}
            onGoToRegister={() => setCurrentView('register')}
          />
        )}

        {!loading && currentView === 'register' && (
          <RegisterScreen
            onSuccess={handleRegisterSuccess}
            onBack={() => setCurrentView('welcome')}
            onGoToLogin={() => setCurrentView('login')}
          />
        )}

        {!loading && currentView === 'adopt' && player && (
          <PetSelectionScreen
            player={player}
            onPetCreated={handlePetCreated}
            onCancel={pets.length > 0 ? () => setCurrentView('my-pets') : undefined}
          />
        )}

        {!loading && currentView === 'my-pets' && player && (
          <MyPetsScreen
            player={player}
            pets={pets}
            onSelectPet={(petId) => {
              setActivePetId(petId);
              setCurrentView('room');
            }}
            onAddNewPet={() => setCurrentView('adopt')}
            onLogout={handleLogout}
            onAdoptPet={handleAdoptPet}
            onRenamePet={handleRenamePet}
          />
        )}

        {!loading && currentView === 'room' && player && activePet && (
          <PetRoomScreen
            player={player}
            pets={pets}
            activePet={activePet}
            onSelectPet={(petId) => setActivePetId(petId)}
            onAddNewPet={() => setCurrentView('adopt')}
            onLogout={handleLogout}
            onRefreshPets={handleRefreshPets}
            onGoToMyPets={() => setCurrentView('my-pets')}
            onRenamePet={handleRenamePet}
          />
        )}
      </div>
    </div>
  );
};

export default App;
