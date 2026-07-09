// CHANGED (s13b): per-section body chunk (standard-§4.4 follow-up) — ModulePage loads bodies
// via data/bodies.ts, so a cold module open pulls only its own section, not all 25 modules.
import type { Module } from '../types';
import { m1 } from '../modules/m1-what-is-an-api';
import { m2 } from '../modules/m2-decision-axes';
import { m3 } from '../modules/m3-http-transport';
import { m4 } from '../modules/m4-data-formats';

export const bodies: Module[] = [m1, m2, m3, m4];
