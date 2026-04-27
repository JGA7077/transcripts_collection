import { NextResponse } from 'next/server';
import GTTS from 'gtts';
import fs from 'fs';
import path from 'path';

const IDIOMS = {
  Inglês: 'en',
  Espanhol: 'es',
};

export async function POST(req: Request) {
  try {
    const { text, lang } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
    }

    const langKey = lang as keyof typeof IDIOMS;
    const language = IDIOMS[langKey] ?? 'es';
    const gtts = new GTTS(` ${text}`, language);

    const isVercel = !process.env.IS_VERCEL;
    const tempDir = isVercel ? '/tmp' : path.join(process.cwd(), 'public', 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const fileName = `audio_${Date.now()}.mp3`;
    const filePath = path.join(tempDir, fileName);

    fs.writeFileSync(filePath, '');

    await new Promise((resolve, reject) => {
      gtts.save(filePath, (err: string) => {
        if (err) {
          console.error('Erro ao salvar áudio:', err);
          reject(err);
        } else {
          console.log('Arquivo de áudio salvo com sucesso:', filePath);
          resolve(null);
        }
      });
    });

    if (!fs.existsSync(filePath)) {
      console.error('Erro: Arquivo não foi criado!');
      return NextResponse.json({ error: 'Erro ao salvar o arquivo de áudio' }, { status: 500 });
    }

    const audioBuffer = fs.readFileSync(filePath);
    const audioBase64 = audioBuffer.toString('base64');

    return NextResponse.json(
      {
        fileName,
        base64: audioBase64,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro no processamento:', error);
    return NextResponse.json({ error: 'Erro ao gerar o áudio' }, { status: 500 });
  }
}
