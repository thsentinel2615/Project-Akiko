import React, { useState, useEffect } from "react";
import { fetchCharacters, getCharacterImageUrl, deleteCharacter, createCharacter, updateCharacter } from "../assets/components/Api";
import { CharacterForm } from "../assets/components/CharacterForm";
import { UpdateCharacterForm } from "../assets/components/UpdateCharacterForm";

const Characters = () => {
  const [characters, setCharacters] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  useEffect(() => {
    fetchCharacters()
      .then(data => setCharacters(data))
      .catch(error => {
        console.error(error);
        history.push('/error');
      });
  }, []);

  const openModal = (character) => {
    setSelectedCharacter(character);
  }

  const closeModal = () => {
    setSelectedCharacter(null);
  }

  function addCharacter(newCharacter) {
    createCharacter(newCharacter)
      .then(avatar => {
        setCharacters([...characters, {...newCharacter, avatar: avatar.avatar}]); // only set the avatar property
      })
      .catch(error => {
        console.error(error);
        history.push('/error');
      });
  }

  function editCharacter(updatedCharacter) {
    updateCharacter(updatedCharacter)
      .then(() => {
        setCharacters(characters.map((c) => c.char_id === updatedCharacter.char_id ? updatedCharacter : c));
        closeModal();
        window.location.reload()
      })
      .catch(error => {
        console.error(error);
        history.push('/error');
      });
  }
  

  const delCharacter = async (charId) => {
    try {
      deleteCharacter(charId)
      setCharacters(characters.filter((c) => c.char_id !== charId));
      closeModal();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <div className="character-buttons">
        <button id="character-button" onClick={() => setShowForm(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        </button>
      </div>
      {showForm && (
        <CharacterForm
          onCharacterSubmit={addCharacter}
          onClose={() => setShowForm(false)}
        />
      )}
      <div className="character-display">
        {characters.map((character) => (
          <div key={character.char_id} className="character-info-box">
            <h2><b>{character.char_name}</b></h2>
            {character.avatar && <img src={getCharacterImageUrl(character.avatar)} alt={character.char_name} id="character-avatar" onClick={() => openModal(character)} />}
            <button id="character-close" onClick={() => delCharacter(character.char_id)} alt="Delete Character">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
            <button id="character-submit" onClick={() => openModal(character)} alt="View Character Details">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      {selectedCharacter && (
        <UpdateCharacterForm
          character={selectedCharacter}
          onUpdateCharacter={editCharacter}
          onClose={() => closeModal()}
        />
      )}
    </div>
  );
};

export default Characters;