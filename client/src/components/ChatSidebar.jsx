import { useEffect, useRef, useState } from 'react';
import { Box, Drawer, IconButton, InputAdornment, List, ListItem, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import { useGame } from '../GameContext.jsx';

const EMOJIS = [
  '😀','😂','😍','🥳','😎','🤔','👍','👎','❤️','🔥',
  '🎉','♠️','♥️','♦️','♣️','🏆','💪','😱','🤣','😊',
  '🙏','👏','💯','✨','🎮','🃏','💰','🫡','😴','🤝',
];

function ChatContent({ onClose }) {
  const { chatMessages, sendChat, state } = useGame();
  const [text, setText] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = () => {
    if (!text.trim()) return;
    sendChat(text.trim());
    setText('');
    setShowEmojis(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#e6b23c', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Chat
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Messages */}
      <List
        ref={listRef}
        dense
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 1,
          px: 1,
          '&::-webkit-scrollbar': { width: 3 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2 },
        }}
      >
        {chatMessages.length === 0 && (
          <ListItem sx={{ py: 2 }}>
            <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center', width: '100%' }}>
              No messages yet
            </Typography>
          </ListItem>
        )}
        {chatMessages.map((msg, i) => {
          const own = msg.seat === state.you;
          return (
            <ListItem key={i} sx={{ px: 0.5, py: 0.3 }}>
              <Box sx={{ width: '100%' }}>
                <Typography sx={{ fontSize: 10, fontWeight: 600, color: own ? '#e6b23c' : 'text.secondary', mb: 0.25 }}>
                  {msg.name}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-block',
                    px: 1.25,
                    py: 0.5,
                    borderRadius: '12px 12px 12px 4px',
                    bgcolor: own ? 'rgba(230,178,60,0.1)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid',
                    borderColor: own ? 'rgba(230,178,60,0.2)' : 'rgba(255,255,255,0.06)',
                    maxWidth: '85%',
                  }}
                >
                  <Typography sx={{ fontSize: 12.5, lineHeight: 1.35, wordBreak: 'break-word' }}>{msg.text}</Typography>
                </Box>
              </Box>
            </ListItem>
          );
        })}
      </List>

      {/* Emoji picker */}
      {showEmojis && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.25, px: 1, py: 0.5, borderTop: '1px solid rgba(255,255,255,0.06)', maxHeight: 80, overflowY: 'auto' }}>
          {EMOJIS.map((emoji) => (
            <IconButton key={emoji} size="small" onClick={() => setText((p) => p + emoji)} sx={{ fontSize: 15, p: 0.25 }}>{emoji}</IconButton>
          ))}
        </Box>
      )}

      {/* Input */}
      <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Message…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <IconButton size="small" onClick={() => setShowEmojis(!showEmojis)} sx={{ color: showEmojis ? '#e6b23c' : 'text.secondary' }}>
                    <EmojiEmotionsIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSend} disabled={!text.trim()} sx={{ color: text.trim() ? '#e6b23c' : 'text.disabled' }}>
                    <SendIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              fontSize: 12.5,
              bgcolor: 'rgba(255,255,255,0.04)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(230,178,60,0.4)' },
            },
            '& .MuiInputBase-input': { py: '7px !important' },
          }}
        />
      </Box>
    </Box>
  );
}

/**
 * Collapsible chat — toggle button with unread badge.
 * Defaults collapsed; slides in from the right.
 */
export default function ChatSidebar() {
  const { state, chatMessages } = useGame();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const prevCountRef = useRef(0);

  // Track unread messages when closed
  useEffect(() => {
    if (!open && chatMessages.length > prevCountRef.current) {
      setUnread((u) => u + (chatMessages.length - prevCountRef.current));
    }
    prevCountRef.current = chatMessages.length;
  }, [chatMessages.length, open]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  if (!state?.roomCode) return null;

  return (
    <>
      {/* Toggle button */}
      <IconButton
        onClick={() => setOpen((o) => !o)}
        sx={{
          position: 'fixed',
          bottom: { xs: 12, sm: 16 },
          right: { xs: 12, sm: 16 },
          zIndex: 30,
          bgcolor: open ? 'rgba(230,178,60,0.15)' : 'rgba(255,255,255,0.08)',
          color: open ? '#e6b23c' : 'text.primary',
          border: '1px solid',
          borderColor: open ? 'rgba(230,178,60,0.3)' : 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
          transition: 'all 0.2s ease',
        }}
      >
        {open ? <CloseIcon fontSize="small" /> : <ChatIcon fontSize="small" />}
        {/* Unread badge */}
        {unread > 0 && !open && (
          <Box
            sx={{
              position: 'absolute', top: -4, right: -4,
              width: 18, height: 18, borderRadius: 999,
              bgcolor: '#ef4444', color: '#fff',
              fontSize: 10, fontWeight: 800,
              display: 'grid', placeItems: 'center',
              boxShadow: '0 2px 6px rgba(239,68,68,0.4)',
            }}
          >
            {unread > 9 ? '9+' : unread}
          </Box>
        )}
      </IconButton>

      {/* Chat panel — slides in from right */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        transitionDuration={250}
        PaperProps={{
          sx: {
            width: { xs: 280, sm: 300 },
            bgcolor: 'rgba(12,18,14,0.92)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.4)',
          },
        }}
      >
        <ChatContent onClose={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
