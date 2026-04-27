/**
 * JavaScript Obfuscator Configuration
 * Bảo vệ source code client-side
 */

export default {
  // Nén code tối đa
  compact: true,
  
  // Control flow flattening - làm rối logic code
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75, // 75% code sẽ bị flatten
  
  // Dead code injection - thêm code giả
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4, // 40% dead code
  
  // Debug protection - chặn DevTools
  debugProtection: false, // Tắt vì ảnh hưởng UX
  debugProtectionInterval: 0,
  
  // Disable console output trong production
  disableConsoleOutput: true,
  
  // Đổi tên biến thành hex
  identifierNamesGenerator: 'hexadecimal',
  
  // Không log
  log: false,
  
  // Chuyển numbers thành expressions
  numbersToExpressions: true,
  
  // Không rename globals (tránh break React)
  renameGlobals: false,
  
  // Self defending - code tự bảo vệ
  selfDefending: true,
  
  // Simplify code
  simplify: true,
  
  // Split strings
  splitStrings: true,
  splitStringsChunkLength: 10,
  
  // String array encoding
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.75,
  stringArrayEncoding: ['base64'], // rc4 quá chậm
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  
  // Transform object keys
  transformObjectKeys: true,
  
  // Unicode escape
  unicodeEscapeSequence: false, // Tắt để giảm size
  
  // Target
  target: 'browser',
  
  // Source map (tắt trong production)
  sourceMap: false,
  sourceMapMode: 'separate'
};
