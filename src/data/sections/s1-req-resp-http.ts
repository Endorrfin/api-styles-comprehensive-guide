// CHANGED (s13b): per-section body chunk — see s0-foundations.ts.
import type { Module } from '../types';
import { m5 } from '../modules/m5-rest';
import { m6 } from '../modules/m6-odata';
import { m7 } from '../modules/m7-soap-xml';
import { m8 } from '../modules/m8-json-rpc';

export const bodies: Module[] = [m5, m6, m7, m8];
