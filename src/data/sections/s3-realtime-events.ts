// CHANGED (s13b): per-section body chunk — see s0-foundations.ts.
import type { Module } from '../types';
import { m12 } from '../modules/m12-websockets';
import { m13 } from '../modules/m13-sse';
import { m14 } from '../modules/m14-webrtc';
import { m15 } from '../modules/m15-webhooks';
import { m16 } from '../modules/m16-async-messaging';

export const bodies: Module[] = [m12, m13, m14, m15, m16];
