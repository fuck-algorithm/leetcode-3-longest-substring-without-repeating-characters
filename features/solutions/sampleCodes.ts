import type { CodeArtifact, Language } from '../../types';

const java = `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // anchor:init
        Map<Character, Integer> lastSeen = new HashMap<>();
        int left = 0, best = 0;
        // anchor:loop
        for (int right = 0; right < s.length(); right++) {
            char ch = s.charAt(right);
            // anchor:duplicate
            if (lastSeen.containsKey(ch) && lastSeen.get(ch) >= left) {
                left = lastSeen.get(ch) + 1;
            }
            lastSeen.put(ch, right);
            // anchor:update-best
            best = Math.max(best, right - left + 1);
        }
        // anchor:return
        return best;
    }
}`;
const python = `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # anchor:init
        last_seen, left, best = {}, 0, 0
        # anchor:loop
        for right, ch in enumerate(s):
            # anchor:duplicate
            if ch in last_seen and last_seen[ch] >= left:
                left = last_seen[ch] + 1
            last_seen[ch] = right
            # anchor:update-best
            best = max(best, right - left + 1)
        # anchor:return
        return best`;
const go = `func lengthOfLongestSubstring(s string) int {
    // anchor:init
    lastSeen := make(map[rune]int)
    left, best := 0, 0
    // anchor:loop
    for right, ch := range []rune(s) {
        // anchor:duplicate
        if previous, ok := lastSeen[ch]; ok && previous >= left {
            left = previous + 1
        }
        lastSeen[ch] = right
        // anchor:update-best
        if length := right - left + 1; length > best { best = length }
    }
    // anchor:return
    return best
}`;
const javascript = `function lengthOfLongestSubstring(s) {
  // anchor:init
  const lastSeen = new Map();
  let left = 0, best = 0;
  // anchor:loop
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    // anchor:duplicate
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) left = lastSeen.get(ch) + 1;
    lastSeen.set(ch, right);
    // anchor:update-best
    best = Math.max(best, right - left + 1);
  }
  // anchor:return
  return best;
}`;

function artifact(language: Language, code: string): CodeArtifact {
  const lines = code.split('\n');
  const anchorLineMap: Record<string, number[]> = {};
  lines.forEach((line, index) => {
    const match = line.match(/anchor:([\w-]+)/);
    if (match) anchorLineMap[match[1]] = [index + 1, Math.min(index + 2, lines.length)];
  });
  return { language, code, anchorLineMap };
}

export function buildSampleCodes(): Record<Language, CodeArtifact> {
  return { java: artifact('java', java), python: artifact('python', python), go: artifact('go', go), javascript: artifact('javascript', javascript) };
}
