import type { Verdict } from '../Verdict';

/** Driving port: what driving adapters (the content script) call to check a password. */
export type CheckPassword = (password: string) => Promise<Verdict>;
