import React from 'react';
import { GameCanvas, BagCanvas } from './GameCanvas';
import { LEVEL_CONFIG } from './gameLogic';

export function HomeScreen({ onLevelSelect, completedLevels }) {
  return (
    <div id="screen-home" className="screen active">
      <h1 className="game-title">DropPear</h1>
      <div className="level-grid">
        {LEVEL_CONFIG.map((level, idx) => {
          const levelNum = idx + 1;
          const isUnlocked = levelNum <= completedLevels + 1;
          let className = 'btn ';
          if (levelNum <= 3) className += 'lv-easy';
          else if (levelNum <= 6) className += 'lv-mid';
          else if (levelNum <= 8) className += 'lv-normal';
          else className += 'lv-hard';

          return (
            <button
              key={levelNum}
              className={className}
              data-level={levelNum}
              onClick={() => onLevelSelect(levelNum)}
              disabled={!isUnlocked}
              style={{
                opacity: isUnlocked ? '1' : '0.5',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
              }}
            >
              {level.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GameScreen({ level, score, timer, difficulty, onBack, onCanvasClick, board, bag }) {
  return (
    <div id="screen-game" className="screen active">
      <div id="game-ui">
        <div id="ui-top">
          <button id="btn-back" onClick={onBack}>
            &#8592; 返回
          </button>
          <span id="ui-difficulty">{difficulty}</span>
          <div id="ui-score-wrap">
            得分：<span id="ui-score">{score}</span>
          </div>
          <div id="ui-timer-wrap">
            時間：<span id="ui-timer">{timer}</span>s
          </div>
        </div>

        <div id="canvas-wrap">
          <GameCanvas board={board} />
          <div id="red-flash"></div>
        </div>

        <div id="hint-bag-area">
          <span className="bag-label">Store</span>
          <BagCanvas bag={bag} />
        </div>
      </div>
    </div>
  );
}

export function ResultScreen({ title, reason, score, onRetry, onHome }) {
  return (
    <div id="screen-result" className="screen active">
      <h2 id="result-title">{title}</h2>
      <p id="result-reason">{reason}</p>
      <p className="result-score">
        得分：<span id="result-score">{score}</span>
      </p>
      <button className="btn btn-easy" id="btn-retry" onClick={onRetry}>
        再玩一次
      </button>
      <button className="btn" id="btn-home" onClick={onHome}>
        回主頁
      </button>
    </div>
  );
}
