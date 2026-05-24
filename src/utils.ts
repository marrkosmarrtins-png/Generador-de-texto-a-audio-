/**
 * Convierte un string de base64 que contiene audio PCM raw (mono de 16 bits, 24000Hz)
 * en un Blob con formato WAV estándar para que pueda ser interpretado por reproductores web estándar
 * y descargado correctamente por el usuario.
 */
export function pcmBase64ToWavBlob(base64Data: string, sampleRate: number = 24000): Blob {
  // Decodificar base64 a cadena binaria
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const pcmBytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    pcmBytes[i] = binaryString.charCodeAt(i);
  }

  // Estructura de cabecera WAV de 44 bytes para PCM linear mono
  const pcmLength = pcmBytes.byteLength;
  const buffer = new ArrayBuffer(44 + pcmLength);
  const view = new DataView(buffer);

  // Helper para escribir strings ASCII
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // 1. "RIFF" chunk descriptor
  writeString(view, 0, "RIFF");
  // Tamaño del archivo - 8 bytes
  view.setUint32(4, 36 + pcmLength, true);
  // Formato "WAVE"
  writeString(view, 8, "WAVE");

  // 2. "fmt " sub-chunk
  writeString(view, 12, "fmt ");
  // Tamaño del sub-chunk (16 para PCM lineal)
  view.setUint32(16, 16, true);
  // AudioFormat (1 para PCM no comprimido)
  view.setUint16(20, 1, true);
  // Número de canales (1 para Mono)
  view.setUint16(22, 1, true);
  // SampleRate (frecuencia de muestreo, Gemini suele usar 24000)
  view.setUint32(24, sampleRate, true);
  // ByteRate = SampleRate * NumChannels * BitsPerSample / 8
  view.setUint32(28, sampleRate * 1 * 16 / 8, true);
  // BlockAlign = NumChannels * BitsPerSample / 8
  view.setUint16(32, 1 * 16 / 8, true);
  // BitsPerSample (16 bits)
  view.setUint16(34, 16, true);

  // 3. "data" sub-chunk
  writeString(view, 36, "data");
  // Tamaño de los datos PCM
  view.setUint32(40, pcmLength, true);

  // Copiar los bytes de audio PCM crudos después de la cabecera
  const output = new Uint8Array(buffer);
  output.set(pcmBytes, 44);

  return new Blob([output], { type: "audio/wav" });
}
