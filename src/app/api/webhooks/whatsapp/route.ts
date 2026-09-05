import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';

export const dynamic = 'force-dynamic';

// Verification GET & Test Simulation for WhatsApp Webhook Setup
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'nexumhub_whatsapp_secret';

  if (mode === 'subscribe' && token === verifyToken) {
    return new Response(challenge, { status: 200 });
  }

  // Diagnostic Test Simulation via Browser GET query params
  const isTest = searchParams.get('test') === 'true';
  if (isTest) {
    await ensureDatabaseSchema();
    const phone = searchParams.get('phone') || '5541988767210';
    const text = searchParams.get('text') || 'Gastei 45 almoço';

    const cleanFrom = phone.replace(/\D/g, '');
    const allUsers = await db.select().from(s.users);
    const matchedUser = allUsers.find((u) => {
      if (!u.phoneNumber) return false;
      const cleanUserPhone = u.phoneNumber.replace(/\D/g, '');
      return cleanUserPhone && (cleanUserPhone === cleanFrom || cleanFrom.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanFrom));
    });

    const defaultUser = allUsers[0] || null;
    const activeUser = matchedUser || defaultUser;

    const evolutionUrl = process.env.EVOLUTION_API_URL || null;
    const evolutionKey = process.env.EVOLUTION_API_KEY ? '*****' + process.env.EVOLUTION_API_KEY.slice(-4) : null;
    const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'nexumhub';

    return NextResponse.json({
      status: 'NexumHub WhatsApp Diagnostic Test',
      timestamp: new Date().toISOString(),
      testedPhone: phone,
      testedText: text,
      matchedUserByPhone: matchedUser ? { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, phoneNumber: matchedUser.phoneNumber } : null,
      defaultFallbackUser: defaultUser ? { id: defaultUser.id, name: defaultUser.name, email: defaultUser.email } : null,
      activeUserUsed: activeUser ? { id: activeUser.id, name: activeUser.name, email: activeUser.email } : null,
      environment: {
        EVOLUTION_API_URL: evolutionUrl,
        EVOLUTION_API_KEY: evolutionKey ? 'Configurada (OK)' : 'NÃO CONFIGURADA ⚠️',
        EVOLUTION_INSTANCE_NAME: evolutionInstance,
      },
    });
  }

  return NextResponse.json({
    status: 'NexumHub WhatsApp Webhook Ready',
    timestamp: new Date().toISOString(),
    guide: 'Acesse ?test=true&phone=5541988767210 para testar o diagnóstico',
  });
}

// Handler POST for Incoming WhatsApp Messages (Evolution API / Meta / Z-API)
export async function POST(req: Request) {
  try {
    await ensureDatabaseSchema();
    const body = await req.json().catch(() => ({}));

    let text = '';
    let fromNumber = '';

    // 1. Payload da Evolution API (MESSAGES_UPSERT)
    if (body.data?.key || body.data?.message || body.event === 'messages.upsert' || body.event === 'MESSAGES_UPSERT') {
      const keyData = body.data?.key || body.key || {};
      if (keyData.fromMe) {
        // Ignora mensagens enviadas pelo próprio robô para evitar loop
        return NextResponse.json({ success: true, ignored: 'fromMe' });
      }
      const jid = keyData.remoteJid || body.data?.remoteJid || body.sender || '';
      fromNumber = jid.split('@')[0];
      const msgObj = body.data?.message || body.message || {};
      text = msgObj.conversation || msgObj.extendedTextMessage?.text || msgObj.imageMessage?.caption || msgObj.videoMessage?.caption || '';
    } else if (body.entry && body.entry[0]?.changes[0]?.value?.messages[0]) {
      // 2. Meta Cloud API
      const msgObj = body.entry[0].changes[0].value.messages[0];
      text = msgObj.text?.body || '';
      fromNumber = msgObj.from || '';
    } else {
      // 3. Z-API / Generic Payload
      text = body.text || body.message || body.body || body.data?.conversation || '';
      fromNumber = body.from || body.phone || body.sender || '';
    }

    text = (text || '').trim();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Mensagem vazia' });
    }

    // Identifica o usuário estritamente pelo número de telefone cadastrado
    let user: any = null;
    if (fromNumber) {
      const cleanFrom = fromNumber.replace(/\D/g, '');
      if (cleanFrom) {
        const allUsers = await db.select().from(s.users);
        user = allUsers.find((u) => {
          if (!u.phoneNumber) return false;
          const cleanUserPhone = u.phoneNumber.replace(/\D/g, '');
          return cleanUserPhone && (cleanUserPhone === cleanFrom || cleanFrom.endsWith(cleanUserPhone) || cleanUserPhone.endsWith(cleanFrom));
        });
      }
    }

    // Fallback opcional apenas se explicitamente habilitado nas variáveis de ambiente
    if (!user && process.env.ALLOW_UNMATCHED_WHATSAPP_FALLBACK === 'true') {
      user = await db.query.users.findFirst();
    }

    if (!user) {
      console.log(`[WhatsApp Webhook] Mensagem ignorada: número ${fromNumber} não está cadastrado em nenhum usuário do sistema.`);
      return NextResponse.json({
        success: true,
        ignored: 'Telefone não cadastrado no sistema',
        fromNumber,
      });
    }

    const userId = user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const [accounts, categories] = await Promise.all([
      db.select().from(s.accounts).where(eq(s.accounts.userId, userId)),
      db.select().from(s.categories).where(eq(s.categories.userId, userId)),
    ]);

    const msgLower = text.toLowerCase();
    let replyMessage = '';
    let txIdCreated: string | null = null;

    // Tenta extrair lançamento do WhatsApp (Ex: "Almoço 45 reais", "Gastei 120 mercado", "Recebi 500 pix")
    const createMatch = msgLower.match(
      /(gastei|lançar|adicionar|paguei|compra|recebi|pix)?\s*(?:de\s+)?(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)\s*(?:em|no|na|com|para)?\s*(.*)/i
    );

    if (createMatch) {
      const actionWord = (createMatch[1] || '').toLowerCase();
      const amountStr = createMatch[2].replace(',', '.');
      const rawDesc = createMatch[3].trim() || 'Lançamento WhatsApp';
      const amountVal = parseFloat(amountStr);

      if (!isNaN(amountVal) && amountVal > 0) {
        const isIncome = actionWord.includes('recebi');
        const txType = isIncome ? 'INCOME' : 'EXPENSE';

        let matchedCategory = categories.find((c) =>
          rawDesc.toLowerCase().includes(c.name.toLowerCase())
        );

        if (!matchedCategory) {
          if (isIncome) {
            matchedCategory = categories.find((c) => c.type === 'INCOME') || categories[0];
          } else {
            matchedCategory = categories.find((c) => c.name.toLowerCase().includes('mercado') || c.type === 'EXPENSE') || categories[0];
          }
        }

        const defaultAccount = accounts[0];
        const dateStr = now.toISOString().slice(0, 10);
        const norm = normalizeTransactionDescription(rawDesc);
        txIdCreated = `tx_wa_${Date.now()}`;
        const fp = generateTransactionFingerprint({
          userId,
          transactionDate: dateStr,
          amount: amountVal,
          normalizedDescription: norm.normalizedDescription,
          sourceId: defaultAccount?.id || 'GENERIC',
        });

        await db.insert(s.transactions).values({
          id: txIdCreated,
          userId,
          accountId: defaultAccount?.id || null,
          categoryId: matchedCategory?.id || null,
          transactionType: txType,
          amount: amountVal,
          transactionDate: dateStr,
          competenceMonth: currentMonth,
          competenceYear: currentYear,
          billingMonth: currentMonth,
          billingYear: currentYear,
          description: rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1),
          normalizedDescription: norm.normalizedDescription,
          paymentMethod: 'DEBIT',
          fingerprint: fp,
        });

        if (defaultAccount) {
          const newBal = isIncome
            ? defaultAccount.currentBalance + amountVal
            : defaultAccount.currentBalance - amountVal;

          await db.update(s.accounts).set({ currentBalance: newBal }).where(eq(s.accounts.id, defaultAccount.id));
        }

        replyMessage = `✅ *NexumHub Bot*\n\n` +
          `Lançamento registrado com sucesso!\n` +
          `• *Item:* ${rawDesc}\n` +
          `• *Valor:* ${formatCurrency(amountVal)}\n` +
          `• *Tipo:* ${isIncome ? 'Receita 📈' : 'Despesa 📉'}\n` +
          `• *Categoria:* ${matchedCategory?.name || 'Geral'}`;
      }
    }

    if (!replyMessage) {
      replyMessage = `🤖 *NexumHub Bot*\n\nPara lançar uma despesa via WhatsApp, digite por exemplo:\n• *"Gastei 45 almoço"*\n• *"Recebi 500 pix cliente"*`;
    }

    // Se a Evolution API estiver configurada em variáveis de ambiente, envia a resposta de volta ao WhatsApp!
    const evolutionUrl = process.env.EVOLUTION_API_URL;
    const evolutionKey = process.env.EVOLUTION_API_KEY;
    const evolutionInstance = process.env.EVOLUTION_INSTANCE_NAME || 'nexumhub';

    if (evolutionUrl && evolutionKey && fromNumber) {
      try {
        await fetch(`${evolutionUrl.replace(/\/$/, '')}/message/sendText/${evolutionInstance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': evolutionKey,
          },
          body: JSON.stringify({
            number: fromNumber,
            text: replyMessage,
          }),
        });
      } catch (err) {
        console.error('Erro ao enviar mensagem de resposta via Evolution API:', err);
      }
    }

    return NextResponse.json({
      success: true,
      whatsappReply: replyMessage,
      transactionId: txIdCreated,
    });
  } catch (error: any) {
    console.error('WhatsApp Webhook Error:', error);
    return NextResponse.json({ error: error.message || 'Erro no webhook do WhatsApp' }, { status: 500 });
  }
}
