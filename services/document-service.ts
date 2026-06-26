import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Directory, File, Paths } from 'expo-file-system';

import type { Category, FinancialDocument } from '@/types/finpilot';
import { newId } from '@/utils/finance';

const SUPPORTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

function safeFileName(name: string) {
  return name.replace(/[^a-z0-9._-]/gi, '-').replace(/-+/g, '-').toLowerCase();
}

function titleFromFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function inferCategory(name: string): Category {
  const value = name.toLowerCase();

  if (value.includes('versicherung') || value.includes('insurance') || value.includes('arag')) {
    return 'Insurance';
  }
  if (value.includes('car') || value.includes('auto') || value.includes('vehicle')) {
    return 'Car';
  }
  if (value.includes('rechnung') || value.includes('invoice') || value.includes('warranty')) {
    return 'Warranty';
  }
  if (value.includes('fine') || value.includes('penalty') || value.includes('bussgeld')) {
    return 'Fines';
  }
  if (value.includes('tax') || value.includes('steuer')) {
    return 'Tax';
  }

  return 'Other';
}

function inferProvider(name: string) {
  const lowerName = name.toLowerCase();
  const providers = ['ARAG', 'HUK-COBURG', 'Allianz', 'AXA', 'MediaMarkt', 'Vodafone', 'Telekom'];

  return providers.find((provider) => lowerName.includes(provider.toLowerCase()));
}

function copyIntoVault(asset: { uri: string; name: string }, id: string) {
  try {
    const vault = new Directory(Paths.document, 'finpilot-documents');
    vault.create({ intermediates: true, idempotent: true });
    const destination = new File(vault, `${id}-${safeFileName(asset.name)}`);
    const source = new File(asset.uri);
    source.copy(destination);
    return destination.uri;
  } catch {
    return asset.uri;
  }
}

function documentFromImageAsset(asset: { uri: string; fileName?: string | null; mimeType?: string | null }, tag: string) {
  const id = newId('doc');
  const fileName = asset.fileName ?? `${tag}-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? 'image/jpeg';
  const category = inferCategory(fileName);
  const now = new Date().toISOString();

  return {
    id,
    title: titleFromFileName(fileName),
    category,
    fileUri: copyIntoVault({ uri: asset.uri, name: fileName }, id),
    fileName,
    mimeType,
    tags: [category.toLowerCase(), tag],
    createdAt: now,
    updatedAt: now,
  };
}

export const documentService = {
  async pickDocument(): Promise<FinancialDocument | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: SUPPORTED_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
      base64: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    const asset = result.assets[0];
    const id = newId('doc');
    const title = titleFromFileName(asset.name);
    const category = inferCategory(asset.name);
    const now = new Date().toISOString();

    const document: FinancialDocument = {
      id,
      title,
      category,
      provider: inferProvider(asset.name),
      fileUri: copyIntoVault(asset, id),
      fileName: asset.name,
      mimeType: asset.mimeType,
      tags: [category.toLowerCase()],
      createdAt: now,
      updatedAt: now,
    };

    return document;
  },

  async pickImage(): Promise<FinancialDocument | null> {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Photo permission is required to import a document.');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    return documentFromImageAsset(result.assets[0], 'photo');
  },

  async scanDocument(): Promise<FinancialDocument | null> {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Camera permission is required to scan a document.');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) {
      return null;
    }

    return documentFromImageAsset(result.assets[0], 'scan');
  },
};
