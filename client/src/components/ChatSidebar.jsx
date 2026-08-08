import { useEffect, useRef, useState } from 'react';
import { Box, Drawer, IconButton, InputAdornment, List, ListItem, ListItemText, TextField, Typography, useMediaQuery, useTheme } from '@mui/material';
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

  const handleEmoji = (emoji) => setText((prev) => prev + emoji);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1.5, fontSize: 11 }}>
          ROOM CHAT
        </Typography>
        {onClose && (
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <List
        ref={listRef}
        dense
        sx={{
          flex: 1,
          overflowY: 'auto',
          py: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 },
          '& .MuiListItem-root': { py: 0.5, px: 1.5 },
        }}
      >
        {chatMessages.length === 0 && (
          <ListItem>
            <ListItemText primary={<Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>No messages yet. Say hello!</Typography>} />
          </ListItem>
        )}
        {chatMessages.map((msg, i) => {
          const own = msg.seat === state.you;
          return (
            <ListItem key={i} sx={{ px: 1.5, py: 0.4 }}>
              <ListItemText
                primary={
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: own ? 'primary.main' : 'text.secondary', display: 'block', mb: 0.25, fontSize: 10.5, letterSpacing: 0.04 }}>
                      {msg.name}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-block',
                        px: 1.25,
                        py: 0.6,
                        borderRadius: 2.5,
                        bgcolor: own ? 'rgba(230,178,60,0.09)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: own ? 'rgba(230,178,60,0.22)' : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word', fontSize: 13.5, lineHeight: 1.35 }}>{msg.text}</Typography>
                    </Box>
                  </Box>
                }
              />
            </ListItem>
          );
        })}
      </List>

      {showEmojis && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 0.25, px: 1, py: 0.5, borderTop: '1px solid rgba(255,255,255,0.08)', maxHeight: 90, overflowY: 'auto' }}>
          {EMOJIS.map((emoji) => (
            <IconButton key={emoji} size="small" onClick={() => handleEmoji(emoji)} sx={{ fontSize: 16, p: 0.25 }}>{emoji}</IconButton>
          ))}
        </Box>
      )}

      <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <TextField
          size="small" fullWidth placeholder="Type a message…" value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start"><IconButton size="small" onClick={() => setShowEmojis(!showEmojis)}><EmojiEmotionsIcon fontSize="small" /></IconButton></InputAdornment>,
              endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={handleSend} disabled={!text.trim()}><SendIcon fontSize="small" /></IconButton></InputAdornment>,
            },
          }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 }, '& .MuiInputBase-input': { py: '6px !important' } }}
        />
      </Box>
    </Box>
  );
}

/**
 * Responsive chat: persistent sidebar on desktop, toggleable drawer on mobile.
 */
export default function ChatSidebar() {
  const { state } = useGame();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const [open, setOpen] = useState(false);

  if (!state?.roomCode) return null;

  // Desktop: persistent sidebar
  if (!isMobile) {
    return (
      <Box sx={{ width: { lg: 220, xl: 260 }, height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(15,25,18,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <ChatContent />
      </Box>
    );
  }

  // Mobile: toggle button + drawer
  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{ position: 'fixed', bottom: 12, left: 12, zIndex: 30, bgcolor: 'rgba(0,0,0,0.6)', color: 'text.primary', backdropFilter: 'blur(4px)' }}
      >
        <ChatIcon />
      </IconButton>
      <Drawer anchor="left" open={open} onClose={() => setOpen(false)} transitionDuration={300} PaperProps={{ sx: { width: 280, bgcolor: 'rgba(15,25,18,0.98)' } }}>
        <ChatContent onClose={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
