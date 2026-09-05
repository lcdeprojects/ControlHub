import { NextResponse } from 'next/server';
import { db, ensureDatabaseSchema } from '@/db';
import * as s from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { generateTransactionFingerprint } from '@/lib/engines/fingerprint';
import { normalizeTransactionDescription } from '@/lib/engines/matching-algorithm';
import { seedDefaultUserCategories } from '@/lib/auth';

const CATEGORY_SYNONYMS: Record<string, string[]> = {
  cat_restaurantes: ['almoço', 'almoço', 'almço', 'jantar', 'lanche', 'restaurante', 'ifood', 'comida', 'pf', 'padaria', 'bistrô', 'cafe', 'café', 'mcdonalds', 'burguer', 'pizza', 'sushi'],
  cat_mercado: ['mercado', 'supermercado', 'compras', 'açougue', 'feira', 'carrefour', 'pao de acucar', 'assai', 'atacadao'],
  cat_combustivel: ['combustivel', 'combustível', 'gasolina', 'etanol', 'diesel', 'posto', 'shell', 'ipiranga', 'br'],
  cat_transporte: ['uber', '99', 'taxi', 'táxi', 'passagem', 'onibus', 'ônibus', 'metro', 'metrô', 'estacionamento', 'pedagio', 'pedágio'],
  cat_saude: ['farmacia', 'farmácia', 'drogaria', 'remedio', 'remédio', 'medico', 'médico', 'consulta', 'exame', 'hospital', 'mounjaro', 'ozempic'],
  cat_academia: ['academia', 'treino', 'crossfit', 'pilates', 'personal'],
  cat_lazer: ['lazer', 'viagem', 'cinema', 'ingresso', 'show', 'hotel', 'pousada', 'praia'],
  cat_assinaturas: ['netflix', 'spotify', 'prime', 'hbomax', 'disney', 'youtube', 'apple', 'icloud'],
  cat_moradia: ['aluguel', 'condominio', 'condomínio', 'moradia'],
  cat_energia: ['luz', 'energia', 'enel', 'cemig', 'cpfl'],
  cat_agua: ['agua', 'água', 'sabesp', 'saneamento'],
  cat_internet: ['internet', 'fibra', 'wifi', 'wi-fi', 'claro', 'vivo', 'tim'],
  cat_salario: ['salario', 'salário', 'pagamento', 'holerite', 'prolabore', 'pró-labore'],
  cat_rendimentos: ['dividendo', 'rendimento', 'juros', 'investimento'],
};

function parseWhatsAppMessage(text: string) {
  const textClean = text.trim();
  const lower = textClean.toLowerCase();

  // Detecta se é receita ou despesa
  const isIncome = /\b(recebi|recebido|deposito|depósito|ganhei|pix|entrada|rendimento|salario|salário)\b/i.test(lower) && !/\b(paguei|gastei|gastri|gaste|comprei|envei|enviei)\b/i.test(lower);
  const txType: 'INCOME' | 'EXPENSE' = isIncome ? 'INCOME' : 'EXPENSE';

  // Extrai valor numérico (suporta 45, 45.00, 45,50, R$ 45, R$45,50)
  const amountMatch = textClean.match(/(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i);
  if (!amountMatch) {
    return null;
  }

  const amountStr = amountMatch[1].replace(',', '.');
  const amountVal = parseFloat(amountStr);
  if (isNaN(amountVal) || amountVal <= 0) {
    return null;
  }

  // Extrai a descrição removendo o valor, R$, palavras de ação e preposições
  let rawDesc = textClean
    .replace(amountMatch[0], '') // remove o valor
    .replace(/\b(gastei|gastri|gaste|lançar|lancar|adicionar|paguei|pagou|comprei|compra|recebi|de|r\$|em|no|na|com|para)\b/gi, '')
    .trim();

  // Se a descrição ficou vazia após remover a palavra "pix" ou similares (ex: "Recebi 100 pix" ou "Pix 100")
  if (!rawDesc && lower.includes('pix')) {
    rawDesc = 'PIX';
  } else if (!rawDesc) {
    rawDesc = 'Lançamento WhatsApp';
  }

  return {
    amountVal,
    rawDesc,
    isIncome,
    txType,
  };
}

function findBestCategory(desc: string, categories: any[], isIncome: boolean) {
  if (!categories || categories.length === 0) return null;
  const descLower = desc.toLowerCase().trim();

  // 1. Se for RECEITA, prioriza categorias do tipo INCOME
  if (isIncome) {
    const incomeCats = categories.filter((c) => c.type === 'INCOME');
    if (incomeCats.length > 0) {
      const matchInc = incomeCats.find((c) =>
        descLower.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(descLower)
      );
      return matchInc || incomeCats[0];
    }
  }

  // 2. Despesas: Match exato/parcial pelo NOME da categoria do usuário
  for (const cat of categories) {
    const catNameLower = cat.name.toLowerCase().trim();
    if (catNameLower.length >= 3 && descLower.length >= 3) {
      if (descLower.includes(catNameLower) || (catNameLower.includes(descLower) && descLower.length >= 4)) {
        return cat;
      }
    }
  }

  // 3. Match por sinônimos conhecidos
  for (const [sysId, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (synonyms.some((syn) => descLower.includes(syn) || syn.includes(descLower))) {
      const matched = categories.find((c) => {
        const cName = c.name.toLowerCase();
        if (sysId === 'cat_restaurantes') return cName.includes('restaurante') || cName.includes('alimenta') || cName.includes('comida') || cName.includes('refeição');
        if (sysId === 'cat_mercado') return cName.includes('mercado') || cName.includes('supermercado');
        if (sysId === 'cat_combustivel') return cName.includes('combust') || cName.includes('posto') || cName.includes('gasolina');
        if (sysId === 'cat_transporte') return cName.includes('transport') || cName.includes('uber');
        if (sysId === 'cat_saude') return cName.includes('saúde') || cName.includes('saude') || cName.includes('farmá') || cName.includes('farmacia');
        if (sysId === 'cat_lazer') return cName.includes('lazer') || cName.includes('viagem');
        return c.id === sysId;
      });
      if (matched) return matched;
    }
  }

  // 4. Fallback genérico seguro (Nunca pega Moujaro se o item não for medicamento)
  const defaultExpense = categories.find((c) => {
    const cName = c.name.toLowerCase();
    return (cName.includes('outro') || cName.includes('geral') || cName.includes('despesa') || cName.includes('diversos')) && c.type !== 'INCOME';
  }) || categories.find((c) => {
    const cName = c.name.toLowerCase();
    return (cName.includes('alimenta') || cName.includes('mercado') || cName.includes('restaurante')) && c.type !== 'INCOME';
  }) || categories.find((c) => c.type === 'EXPENSE' && !c.name.toLowerCase().includes('moujaro'))
     || categories[0];

  return defaultExpense;
}

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
      const msgObj = body.data?.message || body.message || {};
      text = msgObj.conversation || msgObj.extendedTextMessage?.text || msgObj.imageMessage?.caption || msgObj.videoMessage?.caption || '';

      // Evita loops infinitos ignorando respostas geradas pelo próprio robô NexumHub
      if (text.includes('NexumHub Bot') || text.includes('Lançamento registrado')) {
        return NextResponse.json({ success: true, ignored: 'botSelfReply' });
      }

      const jid = keyData.remoteJid || body.data?.remoteJid || body.sender || '';

      // Ignora mensagens enviadas em grupos do WhatsApp
      if (jid.includes('@g.us') || body.data?.isGroup || body.isGroup) {
        return NextResponse.json({ success: true, ignored: 'groupMessage' });
      }

      fromNumber = jid.split('@')[0];

      // Se a mensagem veio da própria instância (fromMe), só ignora se for mensagem automática do robô
      if (keyData.fromMe && (text.includes('NexumHub Bot') || !text)) {
        return NextResponse.json({ success: true, ignored: 'fromMe' });
      }
    } else if (body.entry && body.entry[0]?.changes[0]?.value?.messages[0]) {
      // 2. Meta Cloud API
      const msgObj = body.entry[0].changes[0].value.messages[0];
      text = msgObj.text?.body || '';
      fromNumber = msgObj.from || '';
    } else {
      // 3. Z-API / Generic Payload
      const rawFrom = body.from || body.phone || body.sender || '';
      if (rawFrom.includes('@g.us') || body.isGroup || body.data?.isGroup) {
        return NextResponse.json({ success: true, ignored: 'groupMessage' });
      }
      text = body.text || body.message || body.body || body.data?.conversation || '';
      fromNumber = rawFrom.split('@')[0];
    }

    // Trava de segurança adicional para qualquer remetente de grupo
    if (fromNumber.includes('@g.us')) {
      return NextResponse.json({ success: true, ignored: 'groupMessage' });
    }

    text = (text || '').trim();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Mensagem vazia' });
    }

    // Função de verificação flexível de número (suporta DDDs do Brasil com/sem 9º dígito)
    const isMatchPhone = (phoneA: string, phoneB: string) => {
      const cA = phoneA.replace(/\D/g, '');
      const cB = phoneB.replace(/\D/g, '');
      if (!cA || !cB) return false;
      if (cA === cB || cA.endsWith(cB) || cB.endsWith(cA)) return true;
      const last8A = cA.slice(-8);
      const last8B = cB.slice(-8);
      return last8A.length === 8 && last8A === last8B;
    };

    // Identifica o usuário pelo telefone cadastrado
    const allUsers = await db.select().from(s.users);
    let user: any = null;

    if (fromNumber) {
      user = allUsers.find((u) => u.phoneNumber && isMatchPhone(fromNumber, u.phoneNumber));
    }

    // Se houver apenas 1 usuário cadastrado no sistema, associa automaticamente para facilitar testes
    if (!user && (allUsers.length === 1 || process.env.ALLOW_UNMATCHED_WHATSAPP_FALLBACK === 'true')) {
      user = allUsers[0];
    }

    if (!user) {
      console.log(`[WhatsApp Webhook] Mensagem ignorada: número ${fromNumber} não está cadastrado.`);
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

    let [accounts, categories] = await Promise.all([
      db.select().from(s.accounts).where(eq(s.accounts.userId, userId)),
      db.select().from(s.categories).where(eq(s.categories.userId, userId)),
    ]);

    // Garante que o usuário possua as categorias padrões do sistema sem depender de criação manual
    if (!categories || categories.length <= 2) {
      await seedDefaultUserCategories(userId).catch(() => {});
      categories = await db.select().from(s.categories).where(eq(s.categories.userId, userId));
    }

    let replyMessage = '';
    let txIdCreated: string | null = null;

    // Extrai informações do lançamento usando o analisador inteligente de mensagens do WhatsApp
    const parsedMsg = parseWhatsAppMessage(text);

    if (parsedMsg) {
      const { amountVal, rawDesc, isIncome, txType } = parsedMsg;

      const matchedCategory = findBestCategory(rawDesc, categories, isIncome);

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
