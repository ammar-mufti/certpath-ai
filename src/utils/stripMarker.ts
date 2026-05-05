const BULLET_RE = /^[\s\u2022\u25cf\u25cb\u2013\u2014*#\-–—]*\d*[.)]*\s*/

export function stripMarker(text: string): string {
  return text.replace(BULLET_RE, '').trim()
}
