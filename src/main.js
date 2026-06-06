import './style.css';
import { Game } from './game.js';
import { wordManager } from './words.js';
// import { saveHighscore } from './firebase.js';

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new Game(canvas);
  
  // UI Elements
  const menuLayer = document.getElementById('ui-menu');
  const hudLayer = document.getElementById('ui-hud');
  const gameOverLayer = document.getElementById('ui-game-over');
  
  const btnStart = document.getElementById('btn-start');
  const btnRestart = document.getElementById('btn-restart');
  const btnLeaderboard = document.getElementById('btn-leaderboard');
  
  const finalScoreEl = document.getElementById('final-score');
  const wrongWordsList = document.getElementById('wrong-words-list');

  btnStart.addEventListener('click', startGame);
  btnRestart.addEventListener('click', startGame);

  function startGame() {
    menuLayer.classList.add('hidden');
    gameOverLayer.classList.add('hidden');
    hudLayer.classList.remove('hidden');
    
    game.start();
  }

  // Handle Game Over event
  window.addEventListener('gameover', (e) => {
    const score = e.detail.score;
    
    // Hide HUD, show Game Over
    hudLayer.classList.add('hidden');
    gameOverLayer.classList.remove('hidden');
    
    // Display stats
    finalScoreEl.innerText = score;
    
    // Save score (uncomment when Firebase is ready)
    // saveHighscore("Player", score);

    // Display wrong words for review
    const wrongWords = wordManager.getWrongWords();
    wrongWordsList.innerHTML = '';
    
    if (wrongWords.length === 0) {
      wrongWordsList.innerHTML = '<li>Hoàn hảo! Bạn không sai từ nào.</li>';
    } else {
      wrongWords.forEach(word => {
        const li = document.createElement('li');
        li.innerText = word;
        wrongWordsList.appendChild(li);
      });
    }
  });
  
  // Placeholder for leaderboard button
  btnLeaderboard.addEventListener('click', () => {
    alert("Leaderboard feature will connect to Firebase!");
  });
});
