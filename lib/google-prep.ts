import {
  LastMinPrepCategory,
  LastMinPrepProgress,
  LastMinPrepQuestion,
  PrepDifficulty,
} from './last-min-prep';

export type GooglePrepProgress = LastMinPrepProgress;

function q(
  leetcodeId: number,
  title: string,
  difficulty: PrepDifficulty,
  pattern: string
): LastMinPrepQuestion {
  return { leetcodeId, title, difficulty, category: 'Google Questions', pattern };
}

export const GOOGLE_PREP_CATEGORIES: LastMinPrepCategory[] = [
  {
    id: 'google-questions',
    name: 'Google Questions',
    pattern: 'Curated Google-tagged list',
    questions: [
      q(295, 'Find Median from Data Stream', 'Hard', 'Two heaps'),
      q(692, 'Top K Frequent Words', 'Medium', 'Heap'),
      q(228, 'Summary Ranges', 'Easy', 'Array scan'),
      q(205, 'Isomorphic Strings', 'Easy', 'Hash map'),
      q(221, 'Maximal Square', 'Medium', 'Grid DP'),
      q(85, 'Maximal Rectangle', 'Hard', 'Monotonic stack (histogram)'),
      q(346, 'Moving Average from Data Stream', 'Easy', 'Queue / sliding window'),
      q(53, 'Maximum Subarray', 'Medium', "Kadane's algorithm"),
      q(1834, 'Single-Threaded CPU', 'Medium', 'Heap + sorting'),
      q(200, 'Number of Islands', 'Medium', 'DFS / BFS'),
      q(208, 'Implement Trie (Prefix Tree)', 'Medium', 'Trie'),
      q(23, 'Merge k Sorted Lists', 'Hard', 'Heap / merge'),
      q(359, 'Logger Rate Limiter', 'Easy', 'Hash map'),
      q(2013, 'Detect Squares', 'Medium', 'Hash map counting'),
      q(2155, 'All Divisions With the Highest Score of a Binary Array', 'Medium', 'Prefix sum'),
      q(853, 'Car Fleet', 'Medium', 'Monotonic stack'),
      q(1776, 'Car Fleet II', 'Hard', 'Monotonic stack'),
      q(968, 'Binary Tree Cameras', 'Hard', 'Tree DP / greedy'),
      q(1791, 'Find Center of Star Graph', 'Easy', 'Graph observation'),
      q(146, 'LRU Cache', 'Medium', 'Design / hash + doubly linked list'),
      q(307, 'Range Sum Query - Mutable', 'Medium', 'Fenwick tree / BIT'),
      q(986, 'Interval List Intersections', 'Medium', 'Two pointers'),
      q(939, 'Minimum Area Rectangle', 'Medium', 'Hash set'),
      q(963, 'Minimum Area Rectangle II', 'Medium', 'Hash map + geometry'),
      q(2050, 'Parallel Courses III', 'Hard', 'Topological sort DP'),
      q(1971, 'Find if Path Exists in Graph', 'Easy', 'Union Find / DFS'),
      q(33, 'Search in Rotated Sorted Array', 'Medium', 'Binary search'),
      q(261, 'Graph Valid Tree', 'Medium', 'Union Find / DFS'),
      q(402, 'Remove K Digits', 'Medium', 'Monotonic stack'),
      q(17, 'Letter Combinations of a Phone Number', 'Medium', 'Backtracking'),
      q(1525, 'Number of Good Ways to Split a String', 'Medium', 'Prefix/suffix distinct counts'),
      q(772, 'Basic Calculator III', 'Hard', 'Stack'),
      q(715, 'Range Module', 'Hard', 'Ordered map / segment tree'),
      q(300, 'Longest Increasing Subsequence', 'Medium', '1D DP / patience sorting'),
      q(1091, 'Shortest Path in Binary Matrix', 'Medium', 'BFS'),
      q(207, 'Course Schedule', 'Medium', 'Topological sort'),
      q(1268, 'Search Suggestions System', 'Medium', 'Trie / sort'),
      q(485, 'Max Consecutive Ones', 'Easy', 'Array scan'),
      q(1004, 'Max Consecutive Ones III', 'Medium', 'Sliding window'),
      q(102, 'Binary Tree Level Order Traversal', 'Medium', 'Tree BFS'),
      q(75, 'Sort Colors', 'Medium', 'Dutch flag partition'),
      q(1155, 'Number of Dice Rolls With Target Sum', 'Medium', 'DP'),
      q(743, 'Network Delay Time', 'Medium', 'Dijkstra'),
      q(49, 'Group Anagrams', 'Medium', 'Hash map'),
      q(994, 'Rotting Oranges', 'Medium', 'Multi-source BFS'),
      q(253, 'Meeting Rooms II', 'Medium', 'Heap / sweep'),
      q(852, 'Peak Index in a Mountain Array', 'Medium', 'Binary search'),
      q(55, 'Jump Game', 'Medium', 'Greedy'),
      q(312, 'Burst Balloons', 'Hard', 'Interval DP'),
      q(704, 'Binary Search', 'Easy', 'Binary search'),
      q(209, 'Minimum Size Subarray Sum', 'Medium', 'Sliding window'),
      q(366, 'Find Leaves of Binary Tree', 'Medium', 'Tree DFS (post-order depth)'),
      q(1616, 'Split Two Strings to Make Palindrome', 'Medium', 'Two pointers + palindrome check'),
      q(1293, 'Shortest Path in a Grid with Obstacles Elimination', 'Hard', 'BFS with state'),
      q(818, 'Race Car', 'Hard', 'BFS / DP'),
      q(1499, 'Max Value of Equation', 'Hard', 'Monotonic deque'),
      q(360, 'Sort Transformed Array', 'Medium', 'Two pointers'),
      q(282, 'Expression Add Operators', 'Hard', 'Backtracking'),
      q(947, 'Most Stones Removed with Same Row or Column', 'Medium', 'Union Find'),
      q(215, 'Kth Largest Element in an Array', 'Medium', 'Heap / quickselect'),
      q(863, 'All Nodes Distance K in Binary Tree', 'Medium', 'Tree-to-graph BFS'),
      q(518, 'Coin Change II', 'Medium', 'Unbounded knapsack'),
      q(1494, 'Parallel Courses II', 'Hard', 'Bitmask DP'),
      q(2402, 'Meeting Rooms III', 'Hard', 'Heap simulation'),
      q(2265, 'Count Nodes Equal to Average of Subtree', 'Medium', 'Tree DFS'),
      q(907, 'Sum of Subarray Minimums', 'Medium', 'Monotonic stack'),
      q(337, 'House Robber III', 'Medium', 'Tree DP'),
      q(174, 'Dungeon Game', 'Hard', 'Grid DP (reverse)'),
      q(416, 'Partition Equal Subset Sum', 'Medium', '0/1 knapsack'),
      q(2035, 'Partition Array Into Two Arrays to Minimize Sum Difference', 'Hard', 'Meet in the middle'),
      q(315, 'Count of Smaller Numbers After Self', 'Hard', 'Merge sort / BIT'),
      q(128, 'Longest Consecutive Sequence', 'Medium', 'Hash set'),
      q(1011, 'Capacity To Ship Packages Within D Days', 'Medium', 'Binary search on answer'),
    ],
  },
];

export function getAllGooglePrepQuestions(): LastMinPrepQuestion[] {
  return GOOGLE_PREP_CATEGORIES.flatMap((c) => c.questions);
}

const STORAGE_PREFIX = 'google_prep_';

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

export function loadGooglePrepProgress(userId: string): GooglePrepProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveGooglePrepProgress(userId: string, rows: GooglePrepProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}
