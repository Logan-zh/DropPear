import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HomeScreen, GameScreen, ResultScreen } from './Screens';
import {
  emptyBoard,
  pushRow,
  occupiedRows,
  selectBead,
  checkMatch,
  checkGameOver,
  GAME_TIME,
  WIN_SCORE,
  LEVEL_CONFIG,
  MAX_ROWS,
  WARN_ROWS,
  BAG_MAX,
  CANVAS_DIMS,
} from './gameLogic';
import '../style.css';

export default function App() {
  // Screen state
  const [screen, setScreen] = useState('home'); // 'home', 'game', 'result'

  // Game state
  const [level, setLevel] = useState(0);
  const [board, setBoard] = useState(emptyBoard());
  const [bag, setBag] = useState([]);
  const [score, setScore] = useState(0);
  const [timer, setTimer] = useState(GAME_TIME);
  const [gameActive, setGameActive] = useState(false);
  const [completedLevels, setCompletedLevels] = useState(0);

  // Result state
  const [resultTitle, setResultTitle] = useState('');
  const [resultReason, setResultReason] = useState('');
  const [resultScore, setResultScore] = useState(0);

  // Warning state
  const [showWarning, setShowWarning] = useState(false);

  // Refs for intervals
  const dropIntervalRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const scoreRef = useRef(0);
  const levelRef = useRef(0);

  // Start a new game
  const startGame = useCallback((selectedLevel) => {
    const cfg = LEVEL_CONFIG[selectedLevel - 1];
    let newBoard = emptyBoard();

    // Initialize board with initial rows
    for (let i = 0; i < cfg.initRows; i++) {
      newBoard = pushRow(newBoard, selectedLevel);
    }

    setLevel(selectedLevel);
    levelRef.current = selectedLevel;
    setBoard(newBoard);
    setBag([]);
    setScore(0);
    scoreRef.current = 0;
    setTimer(GAME_TIME);
    setGameActive(true);
    setShowWarning(false);
    setScreen('game');
  }, []);

  // End game
  const endGame = useCallback((reason, msg, finalScore, finalLevel) => {
    setGameActive(false);

    if (reason === 'time' || reason === 'win') {
      setCompletedLevels(prev => Math.max(prev, finalLevel));
    }

    if (reason === 'time') {
      setResultTitle('時間到！');
    } else if (reason === 'win') {
      setResultTitle('通關成功！');
    } else {
      setResultTitle('遊戲結束');
    }
    setResultReason(msg);
    setResultScore(finalScore);
    setScreen('result');
  }, []);

  // Handle bead click
  const handleBeadClick = useCallback(
    (clickRow, col) => {
      if (!gameActive) return;

      const result = selectBead(board, bag, clickRow, col);
      if (!result.valid) return;

      setBoard(result.board);

      // Add bead to bag
      const newBag = [...bag, result.color];
      setBag(newBag);

      // Check for match
      let currentBag = newBag;
      let addedScore = 0;

      const performMatch = (bagToCheck) => {
        const matchResult = checkMatch(bagToCheck);
        if (matchResult.matched) {
          currentBag = matchResult.bag;
          addedScore += matchResult.score;
          performMatch(matchResult.bag);
        }
      };

      performMatch(newBag);
      setBag(currentBag);
      const finalScore = score + addedScore;
      setScore(finalScore);
      scoreRef.current = finalScore;

      // v0.41: Check if win condition (score >= 100)
      if (finalScore >= WIN_SCORE) {
        endGame('win', '恭喜通關！', finalScore, level);
        return;
      }

      // Check if bag is full
      if (currentBag.length >= BAG_MAX) {
        endGame('bag', '儲存袋已滿！', finalScore, level);
        return;
      }

      // Check game over
      const overCheck = checkGameOver(result.board);
      if (overCheck.gameOver) {
        endGame('overflow', overCheck.message, finalScore, level);
        return;
      }

      // Check warning
      setShowWarning(occupiedRows(result.board) >= WARN_ROWS);
    },
    [gameActive, board, bag, score, level, endGame]
  );

  // Setup game intervals
  useEffect(() => {
    if (!gameActive) {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const cfg = LEVEL_CONFIG[level - 1];

    // Drop interval
    dropIntervalRef.current = setInterval(() => {
      setBoard(prevBoard => {
        const newBoard = pushRow(prevBoard, levelRef.current);
        const overCheck = checkGameOver(newBoard);
        if (overCheck.gameOver) {
          endGame('overflow', overCheck.message, scoreRef.current, levelRef.current);
        } else {
          setShowWarning(occupiedRows(newBoard) >= WARN_ROWS);
        }
        return newBoard;
      });
    }, cfg.interval);

    // Timer interval
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev - 1 <= 0) {
          endGame('time', '時間到！', scoreRef.current, levelRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameActive, level, endGame]);

  // Handle canvas click
  const handleCanvasClick = useCallback(
    (e) => {
      if (!gameActive) return;
      const canvas = document.getElementById('game-canvas');
      if (!canvas) return;

      const { CELL, PAD } = CANVAS_DIMS;
      const rect = canvas.getBoundingClientRect();
      const col = Math.floor((e.clientX - rect.left - PAD) / (CELL + PAD));
      const row = Math.floor((e.clientY - rect.top - PAD) / (CELL + PAD));

      if (col < 0 || col >= 6 || row < 0 || row >= MAX_ROWS) return;
      handleBeadClick(row, col);
    },
    [gameActive, handleBeadClick]
  );

  useEffect(() => {
    if (screen === 'game') {
      const canvas = document.getElementById('game-canvas');
      if (canvas) {
        canvas.addEventListener('click', handleCanvasClick);
        return () => canvas.removeEventListener('click', handleCanvasClick);
      }
    }
  }, [screen, handleCanvasClick]);

  const handleLevelSelect = (selectedLevel) => {
    if (selectedLevel > completedLevels + 1) return;
    startGame(selectedLevel);
  };

  const handleBack = () => {
    setGameActive(false);
    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setScreen('home');
  };

  const handleRetry = () => {
    startGame(level);
  };

  const handleHome = () => {
    if (dropIntervalRef.current) clearInterval(dropIntervalRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setScreen('home');
  };

  return (
    <div className="app">
      {screen === 'home' && (
        <HomeScreen onLevelSelect={handleLevelSelect} completedLevels={completedLevels} />
      )}
      {screen === 'game' && (
        <GameScreen
          level={level}
          score={score}
          timer={timer}
          difficulty={LEVEL_CONFIG[level - 1]?.label || ''}
          onBack={handleBack}
          onCanvasClick={handleCanvasClick}
          board={board}
          bag={bag}
          showWarning={showWarning}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          title={resultTitle}
          reason={resultReason}
          score={resultScore}
          onRetry={handleRetry}
          onHome={handleHome}
        />
      )}
    </div>
  );
}
