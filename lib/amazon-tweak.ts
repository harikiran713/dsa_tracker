import {
  LastMinPrepCategory,
  LastMinPrepProgress,
  LastMinPrepQuestion,
  PrepDifficulty,
} from './last-min-prep';

export type AmazonTweakProgress = LastMinPrepProgress;

function q(
  leetcodeId: number,
  title: string,
  difficulty: PrepDifficulty,
  pattern: string
): LastMinPrepQuestion {
  return { leetcodeId, title, difficulty, category: 'Tweak Amazon Questions', pattern };
}

export const AMAZON_TWEAK_CATEGORIES: LastMinPrepCategory[] = [
  {
    id: 'amazon-tweak-questions',
    name: 'Tweak Amazon Questions',
    pattern: 'Curated Amazon-tagged list (batch 2)',
    questions: [
      q(1584, 'Minimum Cost to Connect All Points', 'Medium', 'MST'),
      q(930, 'Binary Subarrays With Sum', 'Medium', 'Prefix sum + hash'),
      q(354, 'Russian Doll Envelopes', 'Hard', 'LIS (patience sorting)'),
      q(646, 'Maximum Length of Pair Chain', 'Medium', 'Greedy / interval DP'),
      q(1049, 'Last Stone Weight II', 'Medium', 'Subset DP'),
      q(698, 'Partition to K Equal Sum Subsets', 'Medium', 'Backtracking + bitmask'),
      q(1514, 'Path With Maximum Probability', 'Medium', 'Dijkstra'),
      q(1631, 'Path With Minimum Effort', 'Medium', 'Dijkstra / binary search'),
      q(480, 'Sliding Window Median', 'Hard', 'Two heaps / sorted list'),
      q(1162, 'As Far from Land as Possible', 'Medium', 'Multi-source BFS'),
      q(286, 'Walls and Gates', 'Medium', 'Multi-source BFS'),
      q(2305, 'Fair Distribution of Cookies', 'Medium', 'Backtracking'),
      q(987, 'Vertical Order Traversal of Binary Tree', 'Hard', 'BFS / DFS + sort'),
      q(47, 'Permutations II', 'Medium', 'Backtracking'),
      q(2707, 'Extra Characters in a String', 'Medium', 'String DP'),
      q(1870, 'Minimum Speed to Arrive on Time', 'Medium', 'Binary search on answer'),
      q(130, 'Surrounded Regions', 'Medium', 'DFS / BFS'),
      q(438, 'Find All Anagrams in a String', 'Medium', 'Sliding window'),
      q(1472, 'Design Browser History', 'Medium', 'Design / stack'),
      q(18, '4Sum', 'Medium', 'Two pointers + sort'),
      q(207, 'Course Schedule', 'Medium', 'Topological sort'),
      q(57, 'Insert Interval', 'Medium', 'Intervals'),
      q(1751, 'Maximum Number of Events That Can Be Attended II', 'Hard', 'DP + binary search'),
      q(424, 'Longest Repeating Character Replacement', 'Medium', 'Sliding window'),
      q(658, 'Find K Closest Elements', 'Medium', 'Binary search / two pointers'),
      q(515, 'Find Largest Value in Each Tree Row', 'Medium', 'Tree BFS'),
      q(752, 'Open the Lock', 'Medium', 'BFS'),
      q(1463, 'Cherry Pickup II', 'Hard', 'Grid DP'),
      q(1052, 'Grumpy Bookstore Owner', 'Medium', 'Sliding window'),
      q(583, 'Delete Operation for Two Strings', 'Medium', 'LCS DP'),
      q(695, 'Max Area of Island', 'Medium', 'DFS / BFS'),
      q(632, 'Smallest Range Covering Elements from K Lists', 'Hard', 'Heap'),
      q(739, 'Daily Temperatures', 'Medium', 'Monotonic stack'),
      q(740, 'Delete and Earn', 'Medium', '1D DP'),
      q(948, 'Bag of Tokens', 'Medium', 'Greedy two pointers'),
      q(2064, 'Minimized Maximum of Products Distributed to Any Store', 'Medium', 'Binary search on answer'),
      q(1135, 'Connecting Cities With Minimum Cost', 'Medium', 'MST'),
      q(74, 'Search a 2D Matrix', 'Medium', 'Binary search'),
      q(1130, 'Minimum Cost Tree From Leaf Values', 'Medium', 'Monotonic stack DP'),
      q(2402, 'Meeting Rooms III', 'Hard', 'Heap simulation'),
      q(1768, 'Merge Strings Alternately', 'Easy', 'Two pointers'),
      q(153, 'Find Minimum in Rotated Sorted Array', 'Medium', 'Binary search'),
      q(340, 'Longest Substring with At Most K Distinct Characters', 'Medium', 'Sliding window'),
      q(358, 'Rearrange String K Distance Apart', 'Hard', 'Heap / greedy'),
      q(1544, 'Make The String Great', 'Easy', 'Stack'),
      q(154, 'Find Minimum in Rotated Sorted Array II', 'Hard', 'Binary search'),
      q(325, 'Maximum Size Subarray Sum Equals K', 'Medium', 'Prefix sum + hash'),
      q(905, 'Sort Array by Parity', 'Easy', 'Two pointers'),
      q(398, 'Random Pick Index', 'Medium', 'Reservoir sampling'),
      q(82, 'Remove Duplicates from Sorted List II', 'Medium', 'Linked list'),
      q(687, 'Longest Univalue Path', 'Medium', 'Tree DFS'),
      q(21, 'Merge Two Sorted Lists', 'Easy', 'Linked list'),
      q(235, 'Lowest Common Ancestor of a Binary Search Tree', 'Medium', 'BST'),
      q(449, 'Serialize and Deserialize BST', 'Medium', 'BST DFS'),
      q(378, 'Kth Smallest Element in a Sorted Matrix', 'Medium', 'Heap / binary search'),
      q(1046, 'Last Stone Weight', 'Easy', 'Heap'),
      q(1219, 'Path with Maximum Gold', 'Medium', 'Backtracking / DFS'),
      q(802, 'Find Eventual Safe States', 'Medium', 'Topo / cycle detection'),
      q(1136, 'Parallel Courses', 'Medium', 'Topological sort'),
      q(40, 'Combination Sum II', 'Medium', 'Backtracking'),
      q(968, 'Binary Tree Cameras', 'Hard', 'Tree DP / greedy'),
      q(120, 'Triangle', 'Medium', 'Grid DP'),
      q(1035, 'Uncrossed Lines', 'Medium', 'LCS DP'),
      q(1396, 'Design Underground System', 'Medium', 'Design / hash'),
      q(497, 'Random Point in Non-overlapping Rectangles', 'Medium', 'Prefix sum + binary search'),
      q(647, 'Palindromic Substrings', 'Medium', 'Expand around center'),
      q(107, 'Binary Tree Level Order Traversal II', 'Medium', 'Tree BFS'),
      q(1372, 'Longest ZigZag Path in a Binary Tree', 'Medium', 'Tree DFS'),
      q(228, 'Summary Ranges', 'Easy', 'Array scan'),
      q(113, 'Path Sum II', 'Medium', 'Tree DFS'),
      q(2588, 'Count Paths With the Given XOR Value', 'Hard', 'Prefix XOR + hash'),
      q(1091, 'Shortest Path in Binary Matrix', 'Medium', 'BFS'),
      q(253, 'Meeting Rooms II', 'Medium', 'Heap / sweep'),
      q(323, 'Number of Connected Components in an Undirected Graph', 'Medium', 'Union Find'),
      q(224, 'Basic Calculator', 'Hard', 'Stack'),
      q(1249, 'Minimum Remove to Make Valid Parentheses', 'Medium', 'Stack'),
      q(1289, 'Minimum Falling Path Sum II', 'Hard', 'Grid DP'),
      q(287, 'Find the Duplicate Number', 'Medium', 'Binary search / cycle detection'),
      q(137, 'Single Number II', 'Medium', 'Bit manipulation'),
      q(167, 'Two Sum II – Input Array Is Sorted', 'Medium', 'Two pointers'),
      q(315, 'Count of Smaller Numbers After Self', 'Hard', 'Merge sort / BIT'),
      q(1531, 'String Compression II', 'Hard', 'String DP'),
      q(159, 'Longest Substring with At Most Two Distinct Characters', 'Medium', 'Sliding window'),
      q(921, 'Minimum Add to Make Parentheses Valid', 'Medium', 'Stack / greedy'),
      q(797, 'All Paths From Source to Target', 'Medium', 'DFS / backtracking'),
      q(1911, 'Maximum Alternating Subsequence Sum', 'Medium', 'DP'),
      q(1696, 'Jump Game VI', 'Medium', 'DP + monotonic deque'),
      q(451, 'Sort Characters By Frequency', 'Medium', 'Heap / bucket sort'),
      q(448, 'Find All Numbers Disappeared in an Array', 'Easy', 'In-place hashing'),
      q(150, 'Evaluate Reverse Polish Notation', 'Medium', 'Stack'),
      q(821, 'Shortest Distance to a Character', 'Easy', 'Two-pass scan'),
      q(1146, 'Snapshot Array', 'Medium', 'Design / binary search'),
      q(35, 'Search Insert Position', 'Easy', 'Binary search'),
      q(135, 'Candy', 'Hard', 'Greedy two-pass'),
      q(432, 'All O`one Data Structure', 'Hard', 'Design / doubly linked list'),
      q(13, 'Roman to Integer', 'Easy', 'String parsing'),
      q(719, 'Kth Smallest Pair Distance', 'Hard', 'Binary search on answer'),
      q(1081, 'Smallest Subsequence of Distinct Characters', 'Medium', 'Monotonic stack'),
      q(28, "Implement strStr()", 'Easy', 'String matching'),
      q(547, 'Number of Provinces', 'Medium', 'DSU / DFS'),
      q(1268, 'Search Suggestions System', 'Medium', 'Trie / sort'),
      q(278, 'First Bad Version', 'Easy', 'Binary search'),
      q(279, 'Perfect Squares', 'Medium', '1D DP'),
      q(958, 'Check Completeness of a Binary Tree', 'Medium', 'Tree BFS'),
      q(215, 'Kth Largest Element in an Array', 'Medium', 'Heap / quickselect'),
      q(59, 'Spiral Matrix II', 'Medium', 'Matrix simulation'),
      q(714, 'Best Time to Buy and Sell Stock with Transaction Fee', 'Medium', 'Greedy DP'),
      q(429, 'N-ary Tree Level Order Traversal', 'Medium', 'Tree BFS'),
      q(17, 'Letter Combinations of a Phone Number', 'Medium', 'Backtracking'),
      q(2435, 'Paths in Matrix Whose Sum Is Divisible by K', 'Hard', 'Grid DP'),
      q(1489, 'Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree', 'Hard', 'MST + DSU'),
    ],
  },
];

export function getAllAmazonTweakQuestions(): LastMinPrepQuestion[] {
  return AMAZON_TWEAK_CATEGORIES.flatMap((c) => c.questions);
}

const STORAGE_PREFIX = 'amazon_tweak_prep_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadAmazonTweakProgress(userId: string): AmazonTweakProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveAmazonTweakProgress(userId: string, rows: AmazonTweakProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}
