// CHANGED (s13b): per-section body chunk — see s0-foundations.ts.
import type { Module } from '../types';
import { m17 } from '../modules/m17-auth-identity';
import { m18 } from '../modules/m18-versioning';
import { m19 } from '../modules/m19-errors-status';
import { m20 } from '../modules/m20-pagination-limits';
import { m21 } from '../modules/m21-idempotency';
import { m22 } from '../modules/m22-security-threats';
import { m23 } from '../modules/m23-observability';

export const bodies: Module[] = [m17, m18, m19, m20, m21, m22, m23];
