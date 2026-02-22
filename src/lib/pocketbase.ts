import PocketBase from 'pocketbase';
import { TypedPocketBase } from '@/types/pocketbase-types';

export type { RecordModel } from 'pocketbase';

export const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090') as TypedPocketBase;

