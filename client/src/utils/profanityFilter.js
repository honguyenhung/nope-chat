// Client-side profanity filter (mirrors server-side)
const BLOCKED = ['fuck', 'shit', 'asshole', 'bitch', 'nigger', 'faggot'];
const regex = new RegExp(BLOCKED.join('|'), 'gi'); // Cache regex

export function sanitize(text) {
  return text.replace(regex, (m) => '*'.repeat(m.length));
}
