import axios from 'axios';
import FormData from 'form-data';
import config from '../config';
import { logger } from '../utils/logger';

const PINATA_API_URL = 'https://api.pinata.cloud';
const PINATA_GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs';

interface PinataMetadata {
  name: string;
  keyvalues?: Record<string, string>;
}

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

/**
 * Upload a file buffer to IPFS via Pinata
 */
export async function uploadDocument(
  buffer: Buffer,
  filename: string,
  metadata: PinataMetadata
): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', buffer, filename);

    const pinataMetadata = JSON.stringify({
      name: metadata.name,
      keyvalues: metadata.keyvalues || {},
    });

    formData.append('pinataMetadata', pinataMetadata);

    const response = await axios.post<PinataResponse>(
      `${PINATA_API_URL}/pinning/pinFileToIPFS`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: config.PINATA_API_KEY,
          pinata_secret_api_key: config.PINATA_SECRET_KEY,
        },
        maxBodyLength: Infinity,
      }
    );

    const cid = response.data.IpfsHash;
    logger.info({ cid, filename, size: response.data.PinSize }, 'Document uploaded to IPFS');

    return cid;
  } catch (error) {
    logger.error({ error, filename }, 'Failed to upload document to IPFS');
    throw error;
  }
}

/**
 * Get the Pinata gateway URL for a given CID
 */
export function getDocumentUrl(cid: string): string {
  return `${PINATA_GATEWAY_URL}/${cid}`;
}

/**
 * Unpin a document from IPFS (for cancelled/expired trades)
 */
export async function unpinDocument(cid: string): Promise<void> {
  try {
    await axios.delete(`${PINATA_API_URL}/pinning/unpin/${cid}`, {
      headers: {
        pinata_api_key: config.PINATA_API_KEY,
        pinata_secret_api_key: config.PINATA_SECRET_KEY,
      },
    });

    logger.info({ cid }, 'Document unpinned from IPFS');
  } catch (error) {
    logger.error({ error, cid }, 'Failed to unpin document from IPFS');
    throw error;
  }
}

/**
 * Check if a CID is pinned
 */
export async function isPinned(cid: string): Promise<boolean> {
  try {
    const response = await axios.get(`${PINATA_API_URL}/data/pinList`, {
      params: {
        hashContains: cid,
      },
      headers: {
        pinata_api_key: config.PINATA_API_KEY,
        pinata_secret_api_key: config.PINATA_SECRET_KEY,
      },
    });

    return response.data.count > 0;
  } catch (error) {
    logger.error({ error, cid }, 'Failed to check pin status');
    return false;
  }
}
