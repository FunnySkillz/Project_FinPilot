import { canExtractWithCloud } from '@/utils/ai-permissions';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';
import { aiGatewayService } from './ai-gateway-service';
import type { AiSettings, AppLanguage } from '@/types/finpilot';

const MAX_BYTES = 8 * 1024 * 1024;
export type BankFile = { uri: string; name: string; mimeType: string; size?: number; base64?: string };
export class BankImportError extends Error {}

function checkFile(file: BankFile) {
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.mimeType))
    throw new BankImportError('type');
  if ((file.size ?? 0) > MAX_BYTES || (file.base64?.length ?? 0) > Math.ceil(MAX_BYTES / 3) * 4)
    throw new BankImportError('size');
  return file;
}

export async function selectBankFile(source: 'file' | 'photo' | 'paste'): Promise<BankFile | null> {
  if (source === 'paste') {
    const image = await Clipboard.getImageAsync({ format: 'png' });
    if (!image) throw new BankImportError('clipboard');
    const base64 = image.data.replace(/^data:image\/[^;]+;base64,/, '');
    return checkFile({ uri: 'data:image/png;base64,' + base64, name: 'screenshot.png', mimeType: 'image/png', base64 });
  }
  if (source === 'photo') {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, base64: true });
    if (result.canceled) return null;
    const asset = result.assets[0];
    // Native pickers normally return JPEG; web preserves the source encoding.
    const mimeType = asset.base64?.startsWith('iVBOR')
      ? 'image/png'
      : asset.base64?.startsWith('/9j/')
        ? 'image/jpeg'
        : asset.base64?.startsWith('UklGR')
          ? 'image/webp'
          : (asset.mimeType ?? 'image/jpeg');
    return checkFile({
      uri: asset.uri,
      name: asset.fileName ?? 'screenshot.jpg',
      mimeType,
      size: asset.base64 ? undefined : asset.fileSize,
      base64: asset.base64 ?? undefined,
    });
  }
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const extension = asset.name.split('.').pop()?.toLowerCase();
  const mimeType =
    asset.mimeType ||
    ({ pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' }[
      extension ?? ''
    ] ??
      '');
  return checkFile({ uri: asset.uri, name: asset.name, mimeType, size: asset.size });
}

export async function extractBankTransactions(
  file: BankFile,
  language: AppLanguage,
  ai: AiSettings,
  uploadConfirmed: boolean,
) {
  if (!uploadConfirmed || !canExtractWithCloud(ai)) throw new BankImportError('consent');
  checkFile(file);
  let fileData = file.base64;
  if (!fileData && Platform.OS === 'web') {
    const blob = await (await fetch(file.uri)).blob();
    if (blob.size > MAX_BYTES) throw new BankImportError('size');
    fileData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } else if (!fileData) {
    const localFile = new File(file.uri);
    if (localFile.size > MAX_BYTES) throw new BankImportError('size');
    fileData = await localFile.base64();
  }
  checkFile({ ...file, base64: fileData });
  return aiGatewayService.importTransactions({
    fileData,
    fileName: file.name,
    mimeType: file.mimeType,
    language,
    cloudConsent: true,
  });
}
