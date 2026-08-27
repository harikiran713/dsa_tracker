import {
  LastMinPrepCategory,
  LastMinPrepProgress,
  LastMinPrepQuestion,
  PrepDifficulty,
} from './last-min-prep';

export type AmazonPrepProgress = LastMinPrepProgress;

function q(
  leetcodeId: number,
  title: string,
  difficulty: PrepDifficulty,
  pattern: string
): LastMinPrepQuestion {
  return { leetcodeId, title, difficulty, category: 'Amazon Questions', pattern };
}

export const AMAZON_PREP_CATEGORIES: LastMinPrepCategory[] = [
  {
    id: 'amazon-questions',
    name: 'Amazon Questions',
    pattern: 'Curated Amazon-tagged list',
    questions: [
      q(560, 'Subarray Sum Equals K', 'Medium', 'Prefix sum + hash'),
      q(1248, 'Count Number of Nice Subarrays', 'Medium', 'Prefix sum + hash'),
      q(300, 'Longest Increasing Subsequence', 'Medium', '1D DP / LIS'),
      q(673, 'Number of Longest Increasing Subsequence', 'Medium', '1D DP / LIS counting'),
      q(416, 'Partition Equal Subset Sum', 'Medium', '0/1 knapsack'),
      q(494, 'Target Sum', 'Medium', 'Subset DP'),
      q(787, 'Cheapest Flights Within K Stops', 'Medium', 'Bellman-Ford / Dijkstra'),
      q(743, 'Network Delay Time', 'Medium', 'Dijkstra'),
      q(295, 'Find Median from Data Stream', 'Hard', 'Two heaps'),
      q(317, 'Shortest Distance from All Buildings', 'Hard', 'Multi-source BFS'),
      q(994, 'Rotting Oranges', 'Medium', 'Multi-source BFS'),
      q(465, 'Optimal Account Balancing', 'Hard', 'Backtracking / greedy'),
      q(31, 'Next Permutation', 'Medium', 'Array simulation'),
      q(139, 'Word Break', 'Medium', 'String DP'),
      q(875, 'Koko Eating Bananas', 'Medium', 'Binary search on answer'),
      q(417, 'Pacific Atlantic Water Flow', 'Medium', 'Multi-source DFS / BFS'),
      q(2517, 'Maximum Tastiness of Candy Basket', 'Medium', 'Binary search on answer'),
      q(49, 'Group Anagrams', 'Medium', 'Hash map'),
      q(146, 'LRU Cache', 'Medium', 'Design / hash + doubly linked list'),
      q(15, '3Sum', 'Medium', 'Two pointers + sort'),
      q(2115, 'Find All Possible Recipes from Given Supplies', 'Medium', 'Topological sort'),
      q(56, 'Merge Intervals', 'Medium', 'Sort + merge'),
      q(1235, 'Maximum Profit in Job Scheduling', 'Hard', 'DP + binary search'),
      q(1004, 'Max Consecutive Ones III', 'Medium', 'Sliding window'),
      q(475, 'Heaters', 'Medium', 'Binary search'),
      q(662, 'Maximum Width of Binary Tree', 'Medium', 'BFS with indices'),
      q(127, 'Word Ladder', 'Hard', 'BFS on words'),
      q(1423, 'Maximum Points You Can Obtain from Cards', 'Medium', 'Sliding window'),
      q(72, 'Edit Distance', 'Hard', 'String DP'),
      q(200, 'Number of Islands', 'Medium', 'DFS / BFS'),
      q(716, 'Max Stack', 'Hard', 'Design / stack'),
      q(23, 'Merge k Sorted Lists', 'Hard', 'Heap / merge'),
      q(735, 'Asteroid Collision', 'Medium', 'Stack simulation'),
      q(213, 'House Robber II', 'Medium', '1D DP (circular)'),
      q(881, 'Boats to Save People', 'Medium', 'Greedy two pointers'),
      q(2385, 'Amount of Time for Binary Tree to Be Infected', 'Medium', 'Tree-to-graph BFS'),
      q(402, 'Remove K Digits', 'Medium', 'Monotonic stack'),
      q(1552, 'Magnetic Force Between Two Balls', 'Medium', 'Binary search on answer'),
      q(240, 'Search a 2D Matrix II', 'Medium', 'Matrix search'),
      q(312, 'Burst Balloons', 'Hard', 'Interval DP'),
      q(1801, 'Number of Orders in the Backlog', 'Medium', 'Heap simulation'),
      q(88, 'Merge Sorted Array', 'Easy', 'Two pointers'),
      q(540, 'Single Element in a Sorted Array', 'Medium', 'Binary search'),
      q(904, 'Fruit Into Baskets', 'Medium', 'Sliding window'),
      q(621, 'Task Scheduler', 'Medium', 'Greedy / heap'),
      q(1209, 'Remove All Adjacent Duplicates in String II', 'Medium', 'Stack'),
      q(33, 'Search in Rotated Sorted Array', 'Medium', 'Binary search'),
      q(1658, 'Minimum Operations to Reduce X to Zero', 'Medium', 'Sliding window (prefix)'),
      q(75, 'Sort Colors', 'Medium', 'Dutch flag partition'),
      q(911, 'Online Election', 'Medium', 'Binary search + prefix'),
      q(901, 'Online Stock Span', 'Medium', 'Monotonic stack'),
      q(528, 'Random Pick with Weight', 'Medium', 'Prefix sum + binary search'),
      q(83, 'Remove Duplicates from Sorted List', 'Easy', 'Linked list'),
      q(543, 'Diameter of Binary Tree', 'Easy', 'Tree DFS'),
      q(148, 'Sort List', 'Medium', 'Merge sort on linked list'),
      q(250, 'Count Univalue Subtrees', 'Medium', 'Tree DFS'),
      q(863, 'All Nodes Distance K in Binary Tree', 'Medium', 'Tree-to-graph BFS'),
      q(236, 'Lowest Common Ancestor of Binary Tree', 'Medium', 'Tree DFS'),
      q(297, 'Serialize and Deserialize Binary Tree', 'Hard', 'Tree DFS / BFS'),
      q(272, 'Closest Binary Search Tree Value II', 'Hard', 'BST inorder + deque'),
      q(1167, 'Minimum Cost to Connect Sticks', 'Medium', 'Heap / greedy'),
      q(79, 'Word Search', 'Medium', 'Backtracking / DFS'),
      q(210, 'Course Schedule II', 'Medium', 'Topological sort'),
      q(39, 'Combination Sum', 'Medium', 'Backtracking'),
      q(337, 'House Robber III', 'Medium', 'Tree DP'),
      q(931, 'Minimum Falling Path Sum', 'Medium', 'Grid DP'),
      q(1143, 'Longest Common Subsequence', 'Medium', 'String DP'),
      q(355, 'Design Twitter', 'Medium', 'Design / heap'),
      q(380, 'Insert Delete GetRandom O(1)', 'Medium', 'Design / hash + array'),
      q(381, 'Insert Delete GetRandom O(1) Duplicates', 'Hard', 'Design / hash + array'),
      q(1152, 'Analyze User Website Visit Pattern', 'Medium', 'Hash map + sorting'),
      q(5, 'Longest Palindromic Substring', 'Medium', 'Expand around center / DP'),
      q(103, 'Binary Tree Zigzag Level Order Traversal', 'Medium', 'Tree BFS'),
      q(124, 'Binary Tree Maximum Path Sum', 'Hard', 'Tree DFS'),
      q(230, 'Kth Smallest Element in BST', 'Medium', 'BST inorder'),
      q(163, 'Missing Ranges', 'Easy', 'Array scan'),
      q(48, 'Rotate Image', 'Medium', 'Matrix in-place'),
      q(112, 'Path Sum', 'Easy', 'Tree DFS'),
      q(437, 'Path Sum III', 'Medium', 'Prefix sum + DFS'),
      q(1730, 'Shortest Path to Get Food', 'Medium', 'Multi-source BFS'),
      q(305, 'Number of Islands II', 'Hard', 'Union Find'),
      q(394, 'Decode String', 'Medium', 'Stack'),
      q(32, 'Longest Valid Parentheses', 'Hard', 'Stack / DP'),
      q(174, 'Dungeon Game', 'Hard', 'Grid DP (reverse)'),
      q(268, 'Missing Number', 'Easy', 'XOR / math'),
      q(136, 'Single Number', 'Easy', 'XOR'),
      q(1, 'Two Sum', 'Easy', 'Hash map'),
      q(493, 'Reverse Pairs', 'Hard', 'Merge sort'),
      q(1011, 'Capacity To Ship Packages Within D Days', 'Medium', 'Binary search on answer'),
      q(410, 'Split Array Largest Sum', 'Hard', 'Binary search on answer'),
      q(443, 'String Compression', 'Medium', 'Two pointers'),
      q(3, 'Longest Substring Without Repeating Characters', 'Medium', 'Sliding window'),
      q(767, 'Reorganize String', 'Medium', 'Heap / greedy'),
      q(20, 'Valid Parentheses', 'Easy', 'Stack'),
      q(696, 'Count Binary Substrings', 'Easy', 'Two pointers / run-length'),
      q(841, 'Keys and Rooms', 'Medium', 'DFS / BFS'),
      q(198, 'House Robber', 'Medium', '1D DP'),
      q(45, 'Jump Game II', 'Medium', 'Greedy'),
      q(1723, 'Minimum Time Required to Finish Jobs', 'Hard', 'Backtracking + pruning'),
      q(692, 'Top K Frequent Words', 'Medium', 'Heap'),
      q(128, 'Longest Consecutive Sequence', 'Medium', 'Hash set'),
      q(155, 'Min Stack', 'Medium', 'Design / stack'),
      q(227, 'Basic Calculator II', 'Medium', 'Stack'),
      q(838, 'Push Dominoes', 'Medium', 'Two pointers'),
      q(981, 'Time Based Key-Value Store', 'Medium', 'Design / binary search'),
      q(704, 'Binary Search', 'Easy', 'Binary search'),
      q(41, 'First Missing Positive', 'Hard', 'In-place hashing'),
      q(399, 'Evaluate Division', 'Medium', 'Graph DFS / weighted union'),
      q(134, 'Gas Station', 'Medium', 'Greedy'),
      q(460, 'LFU Cache', 'Hard', 'Design / hash + doubly linked list'),
      q(273, 'Integer to English Words', 'Hard', 'String construction'),
      q(373, 'Find K Pairs with Smallest Sums', 'Medium', 'Heap'),
      q(316, 'Remove Duplicate Letters', 'Medium', 'Monotonic stack'),
      q(1392, 'Longest Happy Prefix', 'Hard', 'KMP'),
      q(1101, 'Earliest Moment When Everyone Become Friends', 'Medium', 'Union Find'),
      q(827, 'Making A Large Island', 'Hard', 'DFS / BFS + Union Find'),
      q(642, 'Design Search Autocomplete System', 'Hard', 'Trie + heap'),
      q(277, 'Find the Celebrity', 'Medium', 'Two pointers / graph'),
      q(518, 'Coin Change II', 'Medium', 'Unbounded knapsack'),
      q(199, 'Binary Tree Right Side View', 'Medium', 'Tree BFS'),
      q(1361, 'Validate Binary Tree Nodes', 'Medium', 'Graph validation'),
      q(703, 'Kth Largest Element in a Stream', 'Easy', 'Heap'),
      q(54, 'Spiral Matrix', 'Medium', 'Matrix simulation'),
      q(122, 'Best Time to Buy and Sell Stock II', 'Medium', 'Greedy'),
      q(102, 'Binary Tree Level Order Traversal', 'Medium', 'Tree BFS'),
      q(967, 'Numbers With Same Consecutive Differences', 'Medium', 'Backtracking / BFS'),
    ],
  },
];

export function getAllAmazonPrepQuestions(): LastMinPrepQuestion[] {
  return AMAZON_PREP_CATEGORIES.flatMap((c) => c.questions);
}

const STORAGE_PREFIX = 'amazon_prep_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadAmazonPrepProgress(userId: string): AmazonPrepProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveAmazonPrepProgress(userId: string, rows: AmazonPrepProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}
