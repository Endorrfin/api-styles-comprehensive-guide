// CHANGED (s13b): per-section body chunk — see s0-foundations.ts.
import type { Module } from '../types';
import { m9 } from '../modules/m9-graphql';
import { m10 } from '../modules/m10-grpc';
import { m11 } from '../modules/m11-trpc';

export const bodies: Module[] = [m9, m10, m11];
