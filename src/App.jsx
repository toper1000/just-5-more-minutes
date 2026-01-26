import React, { useState, useEffect, useRef } from 'react';
import { AlarmClock, Volume2, Skull, Zap, Share2, RefreshCw } from 'lucide-react';

// --- GAME CONFIGURATION & LEVELS ---
const FAKE_EVENT_OBJECT = { preventDefault: () => {} };
const RANDOM_NUMBER_1 = Math.floor(Math.random() * 400 + 100);
const RANDOM_NUMBER_2 = Math.floor(Math.random() * 400 + 100);
const L9_TARGET_CLOCKS = 10; // How many clocks to catch to pass
const L9_SPAWN_TIME = 800; // Time in ms to catch a clock before it vanishes
let Fcounter = 0;
let wasLevel8MessageDisplayed = false;

const LEVELS = [
	{
		id: 1,
		prompt: 'It is already 8:00, wake up!',
		placeholder: '',
		//validate: (input) => input.trim().toUpperCase() === "OFF",
		validate: () => true,
		showInput: false,
	},
	{
		id: 2,
		prompt: "You won't catch me! WAKE UP!",
		placeholder: '',
		validate: () => true,
		showInput: false,
	},
	{
		id: 3,
		prompt: "Don't you understand you need to wake up? How many chromosomes do you have?",
		placeholder: '',
		validate: (input) => {
			const num = input.trim().toLowerCase();
			return num == '47' || num == '48';
		},
		showInput: true,
	},
	{
		id: 4,
		prompt: 'If you want to sleep a little bit more, you must feed me with an emoji of fruit',
		placeholder: 'I like apples by the way :)',
		validate: (input) => {
			// prettier-ignore
			const allFruitEmojis = ['🍇', '🍈', '🍉', '🍊', '🍋', '🍋‍🟩', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🫐', '🥝', '🍅', '🫒', '🥥', '🥑', '🍆', '🌶️', '🫑', '🥒', '🌽', '🎃', '🌰'];
			return allFruitEmojis.includes(input.trim().toLowerCase());
		},
		showInput: true,
	},
	{
		id: 5,
		prompt: 'Ronaldo or Messi?',
		placeholder: 'Think carefully...',
		validate: (input) => {
			return input.trim().toLowerCase() === 'neymar';
		},
		showInput: true,
	},
	{
		id: 6,
		prompt: `Quick math. What is ${RANDOM_NUMBER_1} + ${RANDOM_NUMBER_2}?`,
		placeholder: '?',
		validate: (input) => input.trim() === `${RANDOM_NUMBER_1 + RANDOM_NUMBER_2}`,
		showInput: true,
	},
	{
		id: 7,
		prompt: "Press 'F' to pay respects to your sleep schedule.",
		placeholder: '',
		validate: (input) => {
			if (input.trim().toLowerCase() !== 'f') {
				return false;
			}
			if (Fcounter == 19) {
				return true;
			} else {
				Fcounter++;
			}
		},
		showInput: true,
	},
	{
		id: 8,
		prompt: 'Type the name of the current day of the week.',
		placeholder: '',
		validate: (input) => {
			const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
			const today = new Date().getDay(); // 0-6
			if (wasLevel8MessageDisplayed) {
				return true;
			} else if (input.trim().toLowerCase() !== days[today]) {
				return false;
			}
		},
		showInput: true,
	},
	{
		id: 9,
		prompt: 'Catch the alarms before they ring!',
		placeholder: '',
		validate: () => true,
		showInput: false,
	},
	{
		id: 10,
		prompt: "How is the word 'snooze' written in Morse code?",
		placeholder: '',
		validate: (input) => input.trim().toLowerCase() === '... -. --- --- --.. .',
		showInput: true,
	},
	{
		id: 11,
		prompt: 'Will you marry me?',
		placeholder: '',
		validate: (input) => input.trim().toLowerCase() === 'yes',
		showInput: true,
	},
	{
		id: 12,
		prompt: "I CAN'T HEAR YOU! (Scream 'STOP')",
		placeholder: 'USE CAPS LOCK',
		validate: (input) => input.trim() === 'STOP', // Case sensitive check
		showInput: true,
	},
	{
		id: 13,
		prompt: 'What is the square root of -1?',
		placeholder: 'Imaginary...',
		validate: (input) => {
			const val = input.trim().toLowerCase();
			return val === 'i' || val === 'j'; // Engineers use j
		},
		showInput: true,
	},
	{
		id: 14,
		prompt: "Press 'F' to pay respects to your sleep schedule.",
		placeholder: 'F',
		validate: (input) => input.trim().toLowerCase() === 'f',
		showInput: true,
	},
	{
		id: 15,
		prompt: 'Type the name of the current day of the week.',
		placeholder: 'Monday, Tuesday...',
		validate: (input) => {
			const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
			const today = new Date().getDay(); // 0-6
			return input.trim().toLowerCase() === days[today];
		},
		showInput: true,
	},
	{
		id: 16,
		prompt: 'Prove you are human. What is 0 / 0?',
		placeholder: 'Math error...',
		validate: (input) => {
			const val = input.trim().toLowerCase();
			return val === 'undefined' || val === 'error' || val === 'nan';
		},
		showInput: true,
	},
	{
		id: 17,
		prompt: "Create a password. Must contain 'z', '7', and 'cat'.",
		placeholder: 'Security first...',
		validate: (input) => {
			const val = input.toLowerCase();
			return val.includes('z') && val.includes('7') && val.includes('cat');
		},
		showInput: true,
	},
	{
		id: 18,
		prompt: 'Are you awake? (Yes/No)',
		placeholder: 'Be honest...',
		validate: (input) => {
			const val = input.trim().toLowerCase();
			// If they type Yes, they are awake. If they type No, they are lying (so they are awake).
			return val === 'yes' || val === 'no';
		},
		showInput: true,
	},
];

// Fallback for endless mode if they beat level 9
const INFINITE_LEVEL = {
	id: 999,
	prompt: "JUST TYPE 'PLEASE' TO SLEEP!",
	placeholder: 'BEG',
	validate: (input) => input.trim().toLowerCase() === 'please',
};

const SHAKE_ANIMATION = `
    @keyframes shake {
        0% { transform: translate(1px, 1px) rotate(0deg); }
        10% { transform: translate(-1px, -2px) rotate(-1deg); }
        20% { transform: translate(-3px, 0px) rotate(1deg); }
        30% { transform: translate(3px, 2px) rotate(0deg); }
        40% { transform: translate(1px, -1px) rotate(1deg); }
        50% { transform: translate(-1px, 2px) rotate(-1deg); }
        60% { transform: translate(-3px, 1px) rotate(0deg); }
        70% { transform: translate(3px, 1px) rotate(-1deg); }
        80% { transform: translate(-1px, -1px) rotate(1deg); }
        90% { transform: translate(1px, 2px) rotate(0deg); }
        100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .shake-screen {
        animation: shake 0.5s;
        animation-iteration-count: infinite;
    }
`;
const CUSTOM_ANIMATIONS = `
    @keyframes popIn {
        0% { transform: scale(0); opacity: 0; }
        60% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeOutHit {
        0% { transform: scale(1); opacity: 1; }
        100% { transform: scale(1.5); opacity: 0; }
    }
    @keyframes fadeOutMiss {
        0% { transform: scale(1) rotate(0deg); opacity: 1; background-color: rgba(220, 38, 38, 0.5); }
        100% { transform: scale(0.5) rotate(45deg); opacity: 0; }
    }
    .clock-spawn { animation: popIn 0.3s ease-out forwards; }
    .clock-hit { animation: fadeOutHit 0.2s ease-out forwards; }
    .clock-miss { animation: fadeOutMiss 0.3s ease-in forwards; }
`;

const roundDuration = 60000; // 1 minute
const wrongAnswerPenalty = 20; // in %

export default function Just5MoreMinutes() {
	// Game State
	const [gameState, setGameState] = useState('start'); // start, playing, snoozed, gameover
	const [levelIndex, setLevelIndex] = useState(0);
	const [noise, setNoise] = useState(0);
	const [inputVal, setInputVal] = useState('');
	const [shake, setShake] = useState(false);
	const [flashError, setFlashError] = useState(false);
	const [copied, setCopied] = useState(false);
	const [offset, setOffset] = useState({ x: 0, y: 0 });
	const [dynamicPrompt, setDynamicPrompt] = useState(null);
	// --- LEVEL 9 STATE ---
	const [l9Score, setL9Score] = useState(0);
	const [l9ClockState, setL9ClockState] = useState(null); // { id, x, y, status: 'active'|'hit'|'miss' }
	const l9TimerRef = useRef(null);

	const inputRef = useRef(null);
	const interval = useRef(null);
	const startTime = useRef(Date.now());
	const ronaldoWritten = useRef(false);
	const messiWritten = useRef(false);

	useEffect(() => {
		setDynamicPrompt(null);
	}, [levelIndex]);

	// Focus input automatically
	useEffect(() => {
		if (gameState === 'playing' && inputRef.current) {
			inputRef.current.focus();
		}
	}, [gameState, flashError]);

	// Game Loop (Noise Meter)
	useEffect(() => {
		if (gameState === 'playing') {
			startTime.current = Date.now();

			interval.current = setInterval(() => {
				let elapsedTime = Date.now() - startTime.current;
				let percentageOfMinute = (elapsedTime / roundDuration) * 100;
				setNoise(() => {
					if (percentageOfMinute >= 100) {
						setGameState('gameover');
						return 100;
					}
					return percentageOfMinute;
				});
			}, 50);
		}
		return () => clearInterval(interval.current);
	}, [gameState, levelIndex]);

	// Shake Trigger
	useEffect(() => {
		if (noise > 80 && gameState === 'playing') {
			setShake(true);
		} else {
			setShake(false);
		}
	}, [noise, gameState]);

	const handleHover = () => {
		if (currentLevel.id === 2) {
			const multiplier1 = Math.random() > 0.5 ? 1 : -1;
			const multiplier2 = Math.random() > 0.5 ? 1 : -1;
			const randomX = (Math.random() * 100 + 100) * multiplier1; // Random in range [-200; -100]&&[100; 200]
			const randomY = (Math.random() * 100 + 100) * multiplier2; // Random in range [-200; -100]&&[100; 200]
			setOffset({ x: randomX, y: randomY });
		}
	};

	// level 9
	useEffect(() => {
		// Check if we are on Level 9 (ID 9)
		const currentLvl = LEVELS[levelIndex];
		let startTimer;

		if (currentLvl && currentLvl.id === 9 && gameState === 'playing') {
			setL9Score(0);
			setL9ClockState(null);
			startTimer = setTimeout(() => {
				spawnClock();
			}, 2000);
		}

		return () => {
			if (l9TimerRef.current) clearTimeout(l9TimerRef.current);
			if (startTimer) clearTimeout(startTimer);
			setL9ClockState(null);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [levelIndex, gameState]);

	// Handlers
	const startGame = () => {
		resetLevels();
		setLevelIndex(10);
		setNoise(0);
		setInputVal('');
		setGameState('playing');
	};

	const handleInput = (e) => {
		setInputVal(e.target.value);
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (gameState !== 'playing') return;
		if (LEVELS[levelIndex].id === 2) setOffset({ x: 0, y: 0 }); //setting button to place after level 2

		const currentLevelObj = LEVELS[levelIndex] || INFINITE_LEVEL;
		const isCorrect = currentLevelObj.validate(inputVal);

		if (isCorrect) {
			// Success Logic
			setGameState('snoozed');
			// "Sleep" for 1 second then wake up
			setTimeout(() => {
				setNoise(0);
				setInputVal('');
				setLevelIndex((prev) => prev + 1);
				setGameState('playing');
			}, 2000);
		} else {
			// Failure Logic
			handleLevels(e);
			setInputVal('');
			// Penalty logic
			if (isCorrect === false) {
				startTime.current -= (wrongAnswerPenalty / 100) * roundDuration; // Penalty (+wrongAnswerPenalty% noise)
				setFlashError(true);
				setTimeout(() => setFlashError(false), 200);
			}
		}
	};

	const handleLevels = (e) => {
		const currentLevelObj = LEVELS[levelIndex] || INFINITE_LEVEL;
		const input = e.target.elements.inputField.value;
		const level5NewPrompt = 'Are you dumb? Everybody knows Neymar is the best';
		const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
		const today = new Date().getDay(); // 0-6

		if (currentLevelObj.id == 3 && Number(inputVal) < 47) {
			// level 3
			setDynamicPrompt('I think a little more...');
		} else if (currentLevelObj.id == 5) {
			if (input.trim().toLowerCase() === 'ronaldo') {
				ronaldoWritten.current = true;
				if (messiWritten.current === true) {
					setDynamicPrompt(level5NewPrompt);
				}
			} else if (input.trim().toLowerCase() === 'messi') {
				messiWritten.current = true;
				if (ronaldoWritten.current === true) {
					setDynamicPrompt(level5NewPrompt);
				}
			}
		} else if (currentLevelObj.id == 7) {
			if (input.trim().toLowerCase() === 'f' && Fcounter === 1) {
				setDynamicPrompt('Again');
			} else if (input.trim().toLowerCase() === 'f') {
				setDynamicPrompt((prev) => prev + ' and again');
			}
		} else if (currentLevelObj.id == 8) {
			if (input.trim().toLowerCase() === days[today]) {
				setDynamicPrompt('WRONG');
				setTimeout(() => {
					setDynamicPrompt('Never mind, just kidding');
					setTimeout(() => {
						wasLevel8MessageDisplayed = true;
						handleSubmit(e);
					}, 1000);
				}, 1000);
			}
		}
	};

	const resetLevels = () => {
		setOffset({ x: 0, y: 0 }); // level 2
		ronaldoWritten.current = false; // level 5
		messiWritten.current = false; // level 5
		Fcounter = 0; // level 7
		wasLevel8MessageDisplayed = false; // level 8
	};

	const copyScore = () => {
		const text = `I survived ${levelIndex} alarms in #Just5MoreMinutes ⏰💀. Can you sleep in?`;
		navigator.clipboard.writeText(text);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const spawnClock = () => {
		const id = Date.now();
		// 5% to 90% to avoid edges, but cover the whole screen
		const x = Math.floor(Math.random() * 85) + 5;
		const y = Math.floor(Math.random() * 85) + 5;

		setL9ClockState({ id, x, y, status: 'active' });

		if (l9TimerRef.current) clearTimeout(l9TimerRef.current);
		l9TimerRef.current = setTimeout(() => {
			handleClockMiss();
		}, L9_SPAWN_TIME);
	};

	const handleClockClick = () => {
		if (!l9ClockState || l9ClockState.status !== 'active') return;

		if (l9TimerRef.current) clearTimeout(l9TimerRef.current);

		setL9ClockState((prev) => ({ ...prev, status: 'hit' }));
		const newScore = l9Score + 1;
		setL9Score(newScore);

		// Check win condition
		if (newScore >= L9_TARGET_CLOCKS) {
			setTimeout(() => {
				setL9ClockState(null);
				handleSubmit(FAKE_EVENT_OBJECT);
			}, 300);
		} else {
			setTimeout(spawnClock, 300);
		}
	};

	const handleClockMiss = () => {
		// Visual indication of failure
		setL9ClockState((prev) => ({ ...prev, status: 'miss' }));

		startTime.current -= (wrongAnswerPenalty / 100) * roundDuration; // Penalty (+wrongAnswerPenalty% noise)
		setFlashError(true);
		setTimeout(() => setFlashError(false), 200);

		setTimeout(spawnClock, 300);
	};

	// --- RENDER HELPERS ---

	const getMeterColor = () => {
		if (noise < 50) return 'bg-green-500';
		if (noise < 80) return 'bg-yellow-500';
		return 'bg-red-600';
	};

	// --- SCREENS ---

	if (gameState === 'start') {
		return (
			<div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-mono">
				<AlarmClock className="w-24 h-24 mb-6 text-red-500 animate-bounce" />
				<h1 className="text-4xl md:text-6xl font-bold mb-4 text-center tracking-tighter">
					Just 5 More Minutes
				</h1>
				<p className="text-slate-400 mb-8 text-center max-w-md">
					Your AI Alarm Clock is sentient. It demands answers. <br />
					Type correctly to snooze. <br />
					<span className="text-red-400 font-bold">Don't let the noise meter hit 100%.</span>
				</p>
				<button
					onClick={startGame}
					className="bg-white text-slate-900 px-8 py-4 text-xl font-bold rounded hover:bg-slate-200 transition-colors flex items-center gap-2"
				>
					<Volume2 className="w-6 h-6" /> WAKE UP
				</button>
			</div>
		);
	}

	if (gameState === 'snoozed') {
		return (
			<div className="min-h-screen bg-black flex items-center justify-center text-white font-mono">
				<div className="text-center animate-pulse">
					<p className="text-2xl italic text-slate-500">...zzzz...</p>
					<p className="text-sm text-slate-700 mt-2">snoozing for 5 minutes</p>
				</div>
			</div>
		);
	}

	if (gameState === 'gameover') {
		return (
			<div className="min-h-screen bg-red-950 text-white flex flex-col items-center justify-center p-4 font-mono border-8 border-red-600">
				<Skull className="w-32 h-32 mb-6 text-white animate-pulse" />
				<h2 className="text-5xl font-black mb-2 uppercase tracking-widest text-center">WAKE UP!</h2>
				<p className="text-xl mb-6 text-red-200 text-center">The neighbor broke through the wall.</p>

				<div className="bg-slate-900 p-6 rounded-lg mb-8 text-center border border-slate-700 w-full max-w-md">
					<p className="text-slate-400 uppercase text-sm mb-1">Score</p>
					<p className="text-3xl font-bold text-yellow-400">Survived {levelIndex} Alarms</p>
				</div>

				<div className="flex flex-col gap-4 w-full max-w-md">
					<button
						onClick={copyScore}
						className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 px-6 rounded font-bold flex items-center justify-center gap-2 transition-all"
					>
						{copied ? (
							'COPIED!'
						) : (
							<>
								{' '}
								<Share2 className="w-5 h-5" /> SHARE SCORE{' '}
							</>
						)}
					</button>

					<button
						onClick={startGame}
						className="w-full bg-white text-black py-3 px-6 rounded font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
					>
						<RefreshCw className="w-5 h-5" /> TRY AGAIN
					</button>
				</div>
			</div>
		);
	}

	// PLAYING STATE
	const currentLevel = LEVELS[levelIndex] || INFINITE_LEVEL;

	return (
		<div
			className={`min-h-screen bg-slate-900 text-white flex flex-col font-mono overflow-hidden relative ${shake ? 'shake-screen' : ''}`}
		>
			<style>{SHAKE_ANIMATION}</style>

			{/* --- HUD --- */}
			<div className="absolute top-0 left-0 w-full h-2 bg-slate-800 z-50">
				<div
					className={`h-full transition-all duration-100 ease-linear ${getMeterColor()}`}
					style={{ width: `${noise}%` }}
				/>
			</div>

			<div className="flex justify-between p-4 text-base text-slate-500 uppercase tracking-widest">
				<span>Level {levelIndex + 1}</span>
				<span className={`${noise > 80 ? 'text-red-500 font-bold' : ''}`}>Noise: {Math.floor(noise)}%</span>
			</div>

			{/* --- MAIN GAME CONTENT --- */}
			<div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full z-10">
				{/* Alarm Visual */}
				<div
					className={`mb-8 relative rounded-full p-8 border-4 ${noise > 80 ? 'border-red-500 bg-red-900/20' : 'border-slate-700 bg-slate-800'}`}
				>
					<AlarmClock className={`w-24 h-24 ${noise > 50 ? 'animate-ping' : ''} text-white`} />
					{noise > 80 && (
						<div className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-bounce">
							CRITICAL
						</div>
					)}
				</div>

				{/* Prompt */}
				<div className="mb-8 text-center space-y-2">
					<p className="text-slate-400 text-sm uppercase tracking-widest">Alarm Demand</p>
					<h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
						{dynamicPrompt || currentLevel.prompt}
					</h2>
				</div>

				{/* Input Area */}

				<style>{SHAKE_ANIMATION + CUSTOM_ANIMATIONS}</style>

				{/* Condition: If Level 9, show Mini Game. Else, show Standard Form */}
				{LEVELS[levelIndex]?.id === 9 ? (
					<>
						{/* Placeholder div to keep layout height stable so prompt doesn't jump */}
						<div className="w-full h-32"></div>

						{/* FULL SCREEN OVERLAY */}
						<div className="fixed inset-0 z-40 pointer-events-none">
							{/* HUD for clocks caught */}
							<div className="absolute top-16 left-1/2 -translate-x-1/2 bg-slate-800/80 px-4 py-2 rounded-full text-sm text-white font-bold border border-slate-600 backdrop-blur-sm">
								Clocks Caught: {l9Score} / {L9_TARGET_CLOCKS}
							</div>

							{l9ClockState && (
								<button
									type="button"
									onClick={handleClockClick}
									disabled={l9ClockState.status !== 'active'}
									className={`
                                pointer-events-auto absolute p-6 rounded-full shadow-2xl transition-colors cursor-pointer border-4 border-white
                                ${l9ClockState.status === 'active' ? 'bg-slate-100 text-slate-900 hover:bg-red-100 clock-spawn' : ''}
                                ${l9ClockState.status === 'hit' ? 'bg-green-500 text-white border-green-300 clock-hit' : ''}
                                ${l9ClockState.status === 'miss' ? 'bg-red-600 text-white border-red-800 clock-miss' : ''}
                                `}
									style={{
										top: `${l9ClockState.y}%`,
										left: `${l9ClockState.x}%`,
										transform: 'translate(-50%, -50%)',
									}}
								>
									<AlarmClock className="w-10 h-10 md:w-12 md:h-12" />
								</button>
							)}

							{/* Overlay instruction */}
							{l9Score === 0 && !l9ClockState && (
								<div className="absolute inset-0 flex items-center justify-center text-white/50 text-[20rem] font-black animate-pulse">
									READY?
								</div>
							)}
						</div>
					</>
				) : (
					<form onSubmit={handleSubmit} className="w-full relative">
						{currentLevel.showInput && (
							<>
								<div
									className={`absolute inset-0 bg-red-500 blur opacity-20 transition-opacity ${flashError ? 'opacity-40' : 'opacity-0'} pointer-events-none`}
								></div>
								<input
									ref={inputRef}
									type="text"
									name="inputField"
									value={inputVal}
									onChange={handleInput}
									placeholder={currentLevel.placeholder}
									className={`
                                    w-full bg-slate-950 border-2 text-center text-xl md:text-2xl py-6 px-4 rounded shadow-2xl outline-none transition-all
                                    ${flashError ? 'border-red-500 text-red-500' : 'border-slate-600 focus:border-white text-white'}
                                `}
									autoComplete="off"
									autoCorrect="off"
									spellCheck="false"
								/>
							</>
						)}
						<button
							type="submit"
							onMouseEnter={handleHover}
							style={{
								transform: `translate(${offset.x}px, ${offset.y}px)`,
							}}
							className={`mt-4 w-full bg-slate-100 hover:bg-white text-slate-900 font-black py-4 rounded text-xl 
                                    shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer`}
						>
							<Zap className="w-5 h-5 fill-slate-900" /> SNOOZE
						</button>
					</form>
				)}

				{/* Hints/Flavor */}
				<div className="mt-8 text-center opacity-50 text-xs">
					<p>Penalty for wrong answer: +{wrongAnswerPenalty}% Noise</p>
				</div>
			</div>

			{/* Visual Noise Overlay when critical */}
			{noise > 80 && (
				<div className="absolute inset-0 pointer-events-none bg-red-500 mix-blend-overlay opacity-20 z-0"></div>
			)}
		</div>
	);
}
