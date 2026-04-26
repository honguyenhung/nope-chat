const adjectives = [
  'Ghost', 'Shadow', 'Silent', 'Phantom', 'Mystic', 'Neon', 'Cyber',
  'Stealth', 'Void', 'Cosmic', 'Dark', 'Lunar', 'Solar', 'Frozen', 'Wild',
];

const nouns = [
  'Fox', 'Wolf', 'Hawk', 'Raven', 'Panda', 'Tiger', 'Lynx', 'Viper',
  'Falcon', 'Cobra', 'Shark', 'Eagle', 'Panther', 'Jaguar', 'Cipher',
];

export function generateUsername() {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${adj}_${noun}_${num}`;
}
