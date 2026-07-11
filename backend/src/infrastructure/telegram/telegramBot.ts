import TelegramBot from 'node-telegram-bot-api';
import { parseCommand } from './commandParser';
import {
  handleVentas,
  handleTop,
  handleAyuda,
  handleComandoInvalido,
  handleDefault,
} from './commandHandlers';
import { formatStart } from './templates';

let botInstance: TelegramBot | null = null;
let pollingStarted = false;

export const initTelegramBot = async (): Promise<TelegramBot | null> => {
  if (botInstance) return botInstance;

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[telegram] TELEGRAM_BOT_TOKEN no seteado. El bot no iniciara.');
    return null;
  }

  const bot = new TelegramBot(token, { polling: false });
  botInstance = bot;

  const allowedRaw = process.env.TELEGRAM_ALLOWED_USERS ?? '';
  const allowed = new Set(
    allowedRaw
      .split(',')
      .map((s) => s.trim().replace(/[^\d]/g, ''))
      .filter(Boolean)
  );
  if (allowed.size === 0) {
    console.log('[telegram] TELEGRAM_ALLOWED_USERS no seteado. Bot abierto: cualquiera puede usarlo.');
  } else {
    console.log(`[telegram] Whitelist activa: ${allowed.size} usuarios autorizados.`);
  }

  bot.onText(/^\/start(?:@\w+)?(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await bot.sendMessage(chatId, formatStart(), { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[telegram] Error respondiendo /start:', err);
    }
  });

  bot.onText(/^\/ayuda(?:@\w+)?(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await bot.sendMessage(chatId, await handleAyuda('es'), { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[telegram] Error respondiendo /ayuda:', err);
    }
  });

  bot.onText(/^\/help(?:@\w+)?(?:\s|$)/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      await bot.sendMessage(chatId, await handleAyuda('en'), { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[telegram] Error respondiendo /help:', err);
    }
  });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = String(msg.from?.id ?? '');
    const text = (msg.text ?? '').trim();
    if (!text) return;

    if (text.startsWith('/')) return;

    if (allowed.size > 0 && !allowed.has(userId)) {
      console.warn(`[telegram] Mensaje rechazado de user_id=${userId} (no esta en TELEGRAM_ALLOWED_USERS).`);
      try {
        await bot.sendMessage(chatId, 'No tienes permiso para usar este bot.');
      } catch {
        /* ignore */
      }
      return;
    }
    // allowed.size === 0 -> bot abierto, todos pasan

    console.log(`[telegram] Mensaje de ${userId}: "${text}"`);

    try {
      const parsed = parseCommand(text);
      let response: string;
      if (!parsed) {
        response = await handleComandoInvalido('es');
      } else if (parsed.cmd === 'ventas') {
        response = await handleVentas(parsed.args as Parameters<typeof handleVentas>[0], parsed.lang);
      } else if (parsed.cmd === 'top') {
        response = await handleTop(parsed.args as Parameters<typeof handleTop>[0], parsed.lang);
      } else if (parsed.cmd === 'ayuda') {
        response = await handleAyuda(parsed.lang);
      } else {
        response = await handleDefault(parsed.lang);
      }
      await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(`[telegram] Error respondiendo a ${userId}:`, err);
      try {
        await bot.sendMessage(chatId, 'Ups, algo salio mal al procesar tu mensaje. Reintentá en un rato.');
      } catch {
        /* ignore */
      }
    }
  });

  bot.on('polling_error', (err) => {
    console.error('[telegram] polling_error:', err.message);
  });

  try {
    console.log('[telegram] Llamando bot.startPolling()...');
    await bot.startPolling();
    pollingStarted = true;
    console.log('[telegram] startPolling() retorno OK. Pidiendo getMe()...');
    const me = await bot.getMe();
    console.log(`[telegram] Bot iniciado: @${me.username} (id=${me.id}). Polling activo.`);
    console.log(`[telegram] TELEGRAM_BOT_TOKEN primer_chars=${token.substring(0, 10)}... longitud=${token.length}`);
  } catch (err) {
    console.error('[telegram] No pude iniciar el polling:', err);
  }

  return bot;
};

export const stopTelegramBot = async (): Promise<void> => {
  if (botInstance && pollingStarted) {
    try {
      await botInstance.stopPolling();
    } catch {
      /* ignore */
    }
  }
  botInstance = null;
  pollingStarted = false;
};

export const getTelegramBot = (): TelegramBot | null => botInstance;