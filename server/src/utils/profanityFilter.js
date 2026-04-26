// Basic server-side profanity filter — blocks the most common slurs
// Extend this list or swap with a proper library (e.g., `bad-words`) as needed
const BLOCKED = ['fuck', 'shit', 'asshole', 'bitch', 'nigger', 'faggot'];
const regex = new RegExp(BLOCKED.join('|'), 'gi'); // Cache regex

export function containsProfanity(text) {
  return regex.test(text);
}

export function sanitize(text) {
  return text.replace(regex, (match) => '*'.repeat(match.length));
}
