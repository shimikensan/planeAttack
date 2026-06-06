import { wordManager } from './words.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Game State
    this.isRunning = false;
    this.score = 0;
    this.health = 3;
    
    // Entities
    this.player = null;
    this.bullets = [];
    this.enemies = [];
    
    // Logic Timers
    this.lastTime = 0;
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 3000; // spawn enemies every 3 seconds
    
    // Input
    this.keys = {};
    
    // UI Elements
    this.scoreEl = document.getElementById('score');
    this.healthEl = document.getElementById('health');
    this.questionEl = document.getElementById('current-question');
    
    this.currentQuestion = null;

    this.bindEvents();
  }

  bindEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      // Space to shoot
      if (e.code === 'Space' && this.isRunning && this.player) {
        this.player.shoot();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  start() {
    this.isRunning = true;
    this.score = 0;
    this.health = 3;
    this.bullets = [];
    this.enemies = [];
    this.lastTime = performance.now();
    wordManager.reset();
    
    this.player = new Player(this);
    this.nextQuestion();
    
    this.updateHUD();
    requestAnimationFrame(this.gameLoop.bind(this));
  }

  stop() {
    this.isRunning = false;
  }

  nextQuestion() {
    this.currentQuestion = wordManager.generateQuestion();
    this.questionEl.innerText = this.currentQuestion.vietnamese;
    this.spawnEnemies();
  }

  spawnEnemies() {
    this.enemies = [];
    const options = this.currentQuestion.options;
    
    // Divide screen width into equal parts to place enemies
    const sectionWidth = this.canvas.width / options.length;
    
    options.forEach((word, index) => {
      const x = (index * sectionWidth) + (sectionWidth / 2);
      const y = -50 - Math.random() * 50; // slightly offset vertically
      this.enemies.push(new Enemy(this, x, y, word, word === this.currentQuestion.correctEnglish));
    });
  }

  gameLoop(timestamp) {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.draw();

    requestAnimationFrame(this.gameLoop.bind(this));
  }

  update(deltaTime) {
    // Update player
    if (this.player) {
      if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.player.move(-1);
      if (this.keys['ArrowRight'] || this.keys['KeyD']) this.player.move(1);
      this.player.update(deltaTime);
    }

    // Update bullets
    this.bullets.forEach((bullet, index) => {
      bullet.update(deltaTime);
      // Remove off-screen bullets
      if (bullet.y < 0) this.bullets.splice(index, 1);
    });

    // Update enemies
    let missedCorrectEnemy = false;
    
    this.enemies.forEach((enemy, index) => {
      enemy.update(deltaTime);
      
      // Check collision with player
      if (this.checkCollision(enemy, this.player)) {
        this.handleEnemyHit(enemy);
        this.enemies.splice(index, 1);
      }
      
      // Remove off-screen enemies
      if (enemy.y > this.canvas.height) {
        if (enemy.isCorrect) {
          missedCorrectEnemy = true;
          wordManager.addWrongWord(enemy.word, this.currentQuestion.vietnamese);
        }
        this.enemies.splice(index, 1);
      }
    });

    // Handle missing the correct word
    if (missedCorrectEnemy) {
      this.takeDamage();
      if (this.isRunning) this.nextQuestion(); // Spawn next batch if game isn't over
    }

    // Check bullet-enemy collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const bullet = this.bullets[i];
        const enemy = this.enemies[j];
        
        if (bullet && enemy && this.checkCollision(bullet, enemy)) {
          this.handleEnemyHit(enemy);
          this.bullets.splice(i, 1);
          this.enemies.splice(j, 1);
          break; // Bullet destroyed
        }
      }
    }
  }

  handleEnemyHit(enemy) {
    if (enemy.isCorrect) {
      // Hit correct word
      this.score += 10;
      this.nextQuestion(); // Generate next question
    } else {
      // Hit wrong word
      this.takeDamage();
      wordManager.addWrongWord(enemy.word, "Nghĩa sai: " + this.currentQuestion.vietnamese);
      // Optional: keep same question or move to next
      this.nextQuestion();
    }
    this.updateHUD();
  }

  takeDamage() {
    this.health--;
    this.updateHUD();
    
    // Screen shake or flash effect could go here
    
    if (this.health <= 0) {
      this.gameOver();
    }
  }

  updateHUD() {
    this.scoreEl.innerText = this.score;
    this.healthEl.innerText = this.health;
  }

  gameOver() {
    this.isRunning = false;
    // Dispatch event to main.js to show UI
    const event = new CustomEvent('gameover', {
      detail: { score: this.score }
    });
    window.dispatchEvent(event);
  }

  checkCollision(rect1, rect2) {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + rect1.width > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + rect1.height > rect2.y
    );
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid background (Sci-Fi effect)
    this.drawBackground();

    if (this.player) this.player.draw(this.ctx);
    
    this.bullets.forEach(b => b.draw(this.ctx));
    this.enemies.forEach(e => e.draw(this.ctx));
  }

  drawBackground() {
    this.ctx.strokeStyle = 'rgba(0, 243, 255, 0.1)';
    this.ctx.lineWidth = 1;
    const gridSize = 50;
    
    // Moving grid effect
    const offset = (performance.now() / 20) % gridSize;

    for (let x = 0; x <= this.canvas.width; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
    
    for (let y = 0; y <= this.canvas.height; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y + offset);
      this.ctx.lineTo(this.canvas.width, y + offset);
      this.ctx.stroke();
    }
  }
}

class Player {
  constructor(game) {
    this.game = game;
    this.width = 40;
    this.height = 40;
    this.x = game.canvas.width / 2 - this.width / 2;
    this.y = game.canvas.height - this.height - 20;
    this.speed = 300; // pixels per second
    this.color = '#00f3ff';
    this.lastShotTime = 0;
    this.shootDelay = 300; // ms
  }

  move(direction) {
    // direction: -1 for left, 1 for right
    // Handled in update based on keys
  }

  update(deltaTime) {
    const deltaSpeed = this.speed * (deltaTime / 1000);
    if (this.game.keys['ArrowLeft'] || this.game.keys['KeyA']) {
      this.x -= deltaSpeed;
    }
    if (this.game.keys['ArrowRight'] || this.game.keys['KeyD']) {
      this.x += deltaSpeed;
    }

    // Clamp to screen
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.game.canvas.width) this.x = this.game.canvas.width - this.width;
  }

  shoot() {
    const now = performance.now();
    if (now - this.lastShotTime > this.shootDelay) {
      this.game.bullets.push(new Bullet(this.x + this.width / 2 - 2, this.y));
      this.lastShotTime = now;
    }
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    
    // Draw triangle spaceship
    ctx.beginPath();
    ctx.moveTo(this.x + this.width / 2, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.closePath();
    ctx.fill();
    
    ctx.shadowBlur = 0; // reset
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 4;
    this.height = 15;
    this.speed = 500;
    this.color = '#ff00ea';
  }

  update(deltaTime) {
    this.y -= this.speed * (deltaTime / 1000);
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.shadowBlur = 0;
  }
}

class Enemy {
  constructor(game, x, y, word, isCorrect) {
    this.game = game;
    this.word = word;
    this.isCorrect = isCorrect;
    
    this.ctx = game.ctx;
    this.ctx.font = '20px Orbitron';
    const textMetrics = this.ctx.measureText(this.word);
    
    this.width = Math.max(textMetrics.width + 20, 60);
    this.height = 40;
    this.x = x - this.width / 2; // Center based on x
    this.y = y;
    this.speed = 80; // falling speed
    this.color = '#39ff14'; // green
  }

  update(deltaTime) {
    this.y += this.speed * (deltaTime / 1000);
  }

  draw(ctx) {
    // Draw box
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw text
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 0;
    ctx.font = 'bold 18px Orbitron';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.word, this.x + this.width / 2, this.y + this.height / 2);
  }
}
