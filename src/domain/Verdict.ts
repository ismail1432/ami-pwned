export type Verdict =
  | { readonly kind: 'compromised'; readonly occurrences: number }
  | { readonly kind: 'not-compromised' }
  | { readonly kind: 'skipped'; readonly reason: 'empty-password' };
