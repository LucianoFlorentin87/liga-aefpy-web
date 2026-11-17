/** Validate names before forwarding them as an encoded eFHUB search parameter. */
export function isValidEfhubSearch(search: string): boolean {
  return search.length >= 2 && search.length <= 80 && /^[\p{L}\p{M}\p{N} .’'-]+$/u.test(search);
}
