import { useState, useEffect } from 'react';
import { User, Crown, Shield, RefreshCw } from 'lucide-react';

// ─────────────────────────────────────────────
// Card Component
// ─────────────────────────────────────────────
const Card = ({ card, hidden = false, index = 0 }) => {
  if (!card) return null;

  const offsetX = index * 56;
  const rotate  = (index - 0.5) * 4;

  const style = {
    transform:  `translateX(${offsetX}px) rotate(${rotate}deg)`,
    position:   index > 0 ? 'absolute' : 'relative',
    top: 0, left: 0,
    zIndex: index,
    transition: 'transform 0.25s ease',
  };

  if (hidden) {
    return (
      <div
        style={style}
        className="w-20 h-30 sm:w-24 sm:h-36 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-800 border-2 border-indigo-400/60 shadow-xl flex items-center justify-center"
      >
        <div className="w-14 h-22 border-2 border-dashed border-indigo-300/30 rounded-lg flex items-center justify-center">
          <div className="w-8 h-8 rounded-full bg-indigo-500/30" />
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className="w-20 h-30 sm:w-24 sm:h-36 rounded-xl bg-white shadow-xl overflow-hidden"
    >
      <img
        src={`/images/pngegg (1)_${card.id}.png`}
        alt={`${card.value} of ${card.suit}`}
        className="w-full h-full object-contain p-1"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#1e293b;">
              <span style="font-size:10px;color:#94a3b8">${card.suit}</span>
              <span style="font-size:22px;font-weight:bold">${card.value}</span>
            </div>`;
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Role Badge
// ─────────────────────────────────────────────
const RoleBadge = ({ isDealer }) =>
  isDealer ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
      <Crown size={11} /> เจ้ามือ
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
      <Shield size={11} /> ลูกมือ
    </span>
  );

// ─────────────────────────────────────────────
// Eval Chip
// ─────────────────────────────────────────────
const EvalChip = ({ evalData }) => {
  if (!evalData) return null;
  const isPok = evalData.type.includes('Pok');
  return (
    <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${
      isPok
        ? 'bg-amber-500/20 text-amber-200 border-amber-500/50'
        : 'bg-slate-700/60 text-slate-200 border-slate-600/50'
    }`}>
      {evalData.type} · {evalData.points} แต้ม · ×{evalData.multiplier}
    </span>
  );
};

// ─────────────────────────────────────────────
// Player Panel
// ─────────────────────────────────────────────
const PlayerPanel = ({
  name, playerData, isDealer, isMe,
  revealCards, isMyTurn, isResolving,
  onAction, onNextRound,
}) => {
  if (!playerData) return null;

  const { cards, money, diff, evaluate, status } = playerData;
  const showEval = isResolving || evaluate?.type.includes('Pok');
  const thinking = status === 'turn' && !isMyTurn;      // opponent is thinking
  const done     = status === 'done' && !isResolving;

  return (
    <div className={`relative rounded-3xl border backdrop-blur-xl shadow-2xl overflow-hidden
      ${isMe
        ? 'bg-slate-800/70 border-slate-600/40'
        : 'bg-slate-900/60 border-slate-700/30'
      }
    `}>
      {/* Glow accent for active turn */}
      {isMyTurn && (
        <div className="absolute inset-0 rounded-3xl ring-2 ring-indigo-500/60 pointer-events-none animate-pulse" />
      )}

      <div className="p-5 sm:p-6 flex flex-col gap-4">
        {/* ── Info Row ── */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-white/80 font-medium">
            <User size={15} />
            <span>{isMe ? `คุณ (${name})` : name}</span>
            <RoleBadge isDealer={isDealer} />
            {thinking && (
              <span className="text-xs text-blue-400 animate-pulse">⏳ กำลังคิด...</span>
            )}
            {done && (
              <span className="text-xs text-emerald-400">✓</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-yellow-400 font-bold text-lg">฿{money}</span>
            {isResolving && diff !== 0 && (
              <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                diff > 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-red-500/20 text-red-300'
              }`}>
                {diff > 0 ? '+' : ''}฿{diff}
              </span>
            )}
          </div>
        </div>

        {/* ── Cards ── */}
        <div className="relative flex justify-center items-start" style={{ height: '9rem' }}>
          {cards && cards.length > 0 ? (
            cards.map((card, i) => (
              <Card
                key={card.id ?? i}
                card={card}
                hidden={!revealCards}
                index={i}
              />
            ))
          ) : (
            <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-xl border-2 border-dashed border-white/10" />
          )}
        </div>

        {/* ── Eval ── */}
        <div className="flex justify-center min-h-[24px]">
          {showEval && <EvalChip evalData={evaluate} />}
        </div>

        {/* ── Actions (only for "me" panel) ── */}
        {isMe && (
          <div className="flex gap-3 justify-center flex-wrap">
            {isMyTurn ? (
              <>
                <button
                  id="btn-stay"
                  onClick={() => onAction('stay')}
                  className="px-6 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-all border border-slate-600/50 shadow"
                >
                  🛑 อยู่
                </button>
                <button
                  id="btn-draw"
                  onClick={() => onAction('draw')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 transition-all transform hover:scale-[1.02]"
                >
                  🃏 จั่วไพ่ (ใบที่ 3)
                </button>
              </>
            ) : isResolving ? (
              <button
                id="btn-next-round"
                onClick={onNextRound}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold shadow-lg transition-all animate-bounce"
              >
                ▶ เล่นรอบต่อไป
              </button>
            ) : (
              <div className="text-slate-500 text-sm py-2">
                {status === 'done'
                  ? '✓ รอคู่แข่ง...'
                  : status === 'waiting'
                  ? 'รอถึงตาคุณ...'
                  : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main GameTable
// ─────────────────────────────────────────────
export default function GameTable({ socket, username }) {
  const [gameState, setGameState]       = useState('waiting');
  const [players, setPlayers]           = useState({});
  const [currentDealer, setCurrentDealer] = useState(null);

  useEffect(() => {
    socket.on('state_update', (state) => {
      setGameState(state.gameState);
      setPlayers(state.players);
      setCurrentDealer(state.currentDealer);
    });
    socket.emit('request_state');
    return () => socket.off('state_update');
  }, [socket]);

  const me           = players[username];
  const opponentName = username === 'x1ertz' ? 'konsuay' : 'x1ertz';
  const opponent     = players[opponentName];

  const iAmDealer   = currentDealer === username;
  const isResolving = gameState === 'resolving';

  if (!me) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-400">กำลังโหลด...</span>
      </div>
    );
  }

  const handleAction  = (action)  => socket.emit('action', { username, action });
  const handleNext    = ()        => socket.emit('next_round');
  const handleReset   = ()        => socket.emit('reset_game');

  const myTurn       = gameState === 'player_turns' && me.status === 'turn';

  // Reveal opponent cards when: resolving, OR either side has Pok
  const revealOpponent =
    isResolving ||
    opponent?.evaluate?.type.includes('Pok') ||
    me?.evaluate?.type.includes('Pok');

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#134e4a_0%,_#0f172a_60%)] flex flex-col relative overflow-hidden">

      {/* Felt texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}
      />

      {/* Decorative glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Header ── */}
      <header className="relative z-10 flex justify-between items-center px-4 sm:px-8 py-4">
        <div className="flex items-center gap-3 bg-slate-900/50 backdrop-blur-md border border-white/10 px-4 py-2.5 rounded-2xl">
          <User size={16} className="text-emerald-400 shrink-0" />
          <span className="font-semibold text-white">{username}</span>
          <div className="w-px h-4 bg-white/20" />
          <RoleBadge isDealer={iAmDealer} />
          <div className="w-px h-4 bg-white/20" />
          <span className="text-yellow-400 font-bold">฿{me.money}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-reset"
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-500/80 hover:bg-red-500 border border-red-400/40 text-white text-sm font-bold px-4 py-2.5 rounded-2xl transition-all shadow-lg"
          >
            <RefreshCw size={14} /> Reset
          </button>
          <div className="hidden sm:block bg-slate-900/40 backdrop-blur-md border border-white/10 text-white/40 text-sm px-4 py-2.5 rounded-2xl">
            ห้อง VIP
          </div>
        </div>
      </header>

      {/* ── Table ── */}
      <main className="relative z-0 flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full px-4 pb-6 pt-2 gap-4">

        {/* Opponent (top) */}
        <PlayerPanel
          name={opponentName}
          playerData={opponent}
          isDealer={!iAmDealer}
          isMe={false}
          revealCards={revealOpponent}
          isMyTurn={false}
          isResolving={isResolving}
          onAction={null}
          onNextRound={null}
        />

        {/* Center status */}
        <div className="flex items-center justify-center py-1">
          {gameState === 'waiting' && (
            <div className="flex items-center gap-2 text-white/50 bg-slate-900/40 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 text-sm font-medium">
              <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
              รอผู้เล่นทั้งสองฝ่าย...
            </div>
          )}
          {gameState === 'dealing' && (
            <div className="text-white font-bold text-lg animate-pulse">
              🃏 กำลังแจกไพ่...
            </div>
          )}
          {isResolving && (
            <div className={`text-lg font-extrabold px-6 py-2.5 rounded-full border backdrop-blur-md ${
              me.diff > 0
                ? 'text-emerald-300 bg-emerald-900/40 border-emerald-500/40'
                : me.diff < 0
                ? 'text-red-300 bg-red-900/40 border-red-500/40'
                : 'text-white/70 bg-slate-800/40 border-white/10'
            }`}>
              {me.diff > 0 ? '🎉 คุณชนะ!' : me.diff < 0 ? '💀 คุณแพ้' : '🤝 เสมอกัน'}
            </div>
          )}
        </div>

        {/* Me (bottom) */}
        <PlayerPanel
          name={username}
          playerData={me}
          isDealer={iAmDealer}
          isMe={true}
          revealCards={true}
          isMyTurn={myTurn}
          isResolving={isResolving}
          onAction={handleAction}
          onNextRound={handleNext}
        />
      </main>
    </div>
  );
}
