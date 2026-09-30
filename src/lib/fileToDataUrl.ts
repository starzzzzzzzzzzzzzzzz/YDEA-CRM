/**
 * Converte um arquivo em data URL pra guardar direto no Firestore, sem depender
 * do Firebase Storage (que hoje exige o plano pago Blaze mesmo pra uso pequeno).
 *
 * - Imagens são redimensionadas e recomprimidas como JPEG antes de virar data URL,
 *   assim cabem tranquilamente no limite de 1MB por documento do Firestore.
 * - Outros arquivos (PDF, etc.) não dá pra comprimir do mesmo jeito — por isso
 *   têm um limite de tamanho bruto antes mesmo de tentar ler, com um erro claro
 *   se passar disso.
 */

const LIMITE_ARQUIVO_NAO_IMAGEM = 700 * 1024; // ~700KB brutos → ~950KB em base64, com folga do limite de 1MB

export function isImagem(file: File): boolean {
  return file.type.startsWith("image/");
}

function resizeImagemParaDataUrl(file: File, maxSize = 1600, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível ler a imagem."));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas não suportado neste navegador."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function lerArquivoComoDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

export async function arquivoParaDataUrl(file: File): Promise<string> {
  if (isImagem(file)) {
    return resizeImagemParaDataUrl(file);
  }
  if (file.size > LIMITE_ARQUIVO_NAO_IMAGEM) {
    const limiteKB = Math.round(LIMITE_ARQUIVO_NAO_IMAGEM / 1024);
    throw new Error(
      `Esse arquivo tem ${(file.size / 1024).toFixed(0)}KB — o limite pra documentos (não-imagem) é ${limiteKB}KB, porque ficam guardados direto no banco de dados. Tenta um PDF menor ou comprimido.`
    );
  }
  return lerArquivoComoDataUrl(file);
}

/**
 * Foto pra anotação: mais comprimida que a de documento, porque várias fotos
 * dividem o limite de 1MB do documento da anotação no Firestore.
 */
export async function fotoParaDataUrl(file: File): Promise<string> {
  if (!isImagem(file)) {
    throw new Error(`"${file.name}" não é uma imagem.`);
  }
  return resizeImagemParaDataUrl(file, 1100, 0.7);
}
