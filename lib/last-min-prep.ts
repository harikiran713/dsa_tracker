export type PrepStatus = 'todo' | 'done' | 'revise';
export type PrepDifficulty = 'Easy' | 'Medium' | 'Hard';

export interface LastMinPrepQuestion {
  leetcodeId: number;
  title: string;
  difficulty: PrepDifficulty;
  category: string;
  pattern: string;
}

export interface LastMinPrepProgress {
  leetcode_id: number;
  user_id: string;
  status: PrepStatus;
  notes: string;
  updated_at: string;
}

export interface LastMinPrepCategory {
  id: string;
  name: string;
  pattern: string;
  questions: LastMinPrepQuestion[];
}

function q(
  leetcodeId: number,
  title: string,
  difficulty: PrepDifficulty,
  category: string,
  pattern: string
): LastMinPrepQuestion {
  return { leetcodeId, title, difficulty, category, pattern };
}

export const LAST_MIN_PREP_CATEGORIES: LastMinPrepCategory[] = [
  {
    id: 'sliding-window',
    name: '1. Sliding Window',
    pattern: 'Variable / fixed window',
    questions: [
      q(3, 'Longest Substring Without Repeating Characters', 'Medium', '1. Sliding Window', 'Variable window'),
      q(76, 'Minimum Window Substring', 'Hard', '1. Sliding Window', 'Variable window + frequency map'),
      q(209, 'Minimum Size Subarray Sum', 'Medium', '1. Sliding Window', 'Variable window'),
      q(424, 'Longest Repeating Character Replacement', 'Medium', '1. Sliding Window', 'Variable window'),
      q(567, 'Permutation in String', 'Medium', '1. Sliding Window', 'Fixed window + frequency'),
      q(904, 'Fruit Into Baskets', 'Medium', '1. Sliding Window', 'Variable window'),
    ],
  },
  {
    id: 'two-pointers',
    name: '2. Two Pointers',
    pattern: 'Two pointers',
    questions: [
      q(11, 'Container With Most Water', 'Medium', '2. Two Pointers', 'Two pointers'),
      q(15, '3Sum', 'Medium', '2. Two Pointers', 'Two pointers + sort'),
      q(16, '3Sum Closest', 'Medium', '2. Two Pointers', 'Two pointers + sort'),
      q(18, '4Sum', 'Medium', '2. Two Pointers', 'Two pointers + sort'),
      q(42, 'Trapping Rain Water', 'Hard', '2. Two Pointers', 'Two pointers'),
      q(167, 'Two Sum II - Input Array Is Sorted', 'Medium', '2. Two Pointers', 'Two pointers'),
    ],
  },
  {
    id: 'fast-slow',
    name: '3. Fast/Slow Pointers (Linked List)',
    pattern: 'Floyd cycle / two pointers',
    questions: [
      q(141, 'Linked List Cycle', 'Easy', '3. Fast/Slow Pointers (Linked List)', 'Fast/slow pointers'),
      q(142, 'Linked List Cycle II', 'Medium', '3. Fast/Slow Pointers (Linked List)', 'Fast/slow pointers'),
      q(19, 'Remove Nth Node From End of List', 'Medium', '3. Fast/Slow Pointers (Linked List)', 'Two pointers'),
      q(876, 'Middle of the Linked List', 'Easy', '3. Fast/Slow Pointers (Linked List)', 'Fast/slow pointers'),
      q(160, 'Intersection of Two Linked Lists', 'Easy', '3. Fast/Slow Pointers (Linked List)', 'Two pointers'),
      q(234, 'Palindrome Linked List', 'Easy', '3. Fast/Slow Pointers (Linked List)', 'Fast/slow + reverse'),
    ],
  },
  {
    id: 'binary-search-sorted',
    name: '4. Binary Search on Sorted Data',
    pattern: 'Binary search',
    questions: [
      q(33, 'Search in Rotated Sorted Array', 'Medium', '4. Binary Search on Sorted Data', 'Binary search'),
      q(34, 'Find First and Last Position of Element in Sorted Array', 'Medium', '4. Binary Search on Sorted Data', 'Binary search'),
      q(35, 'Search Insert Position', 'Easy', '4. Binary Search on Sorted Data', 'Binary search'),
      q(153, 'Find Minimum in Rotated Sorted Array', 'Medium', '4. Binary Search on Sorted Data', 'Binary search'),
      q(162, 'Find Peak Element', 'Medium', '4. Binary Search on Sorted Data', 'Binary search'),
      q(704, 'Binary Search', 'Easy', '4. Binary Search on Sorted Data', 'Binary search'),
    ],
  },
  {
    id: 'binary-search-answer',
    name: '5. Binary Search on Answer',
    pattern: 'Binary search on answer',
    questions: [
      q(875, 'Koko Eating Bananas', 'Medium', '5. Binary Search on Answer', 'Binary search on answer'),
      q(1011, 'Capacity To Ship Packages Within D Days', 'Medium', '5. Binary Search on Answer', 'Binary search on answer'),
      q(410, 'Split Array Largest Sum', 'Hard', '5. Binary Search on Answer', 'Binary search on answer'),
      q(774, 'Minimize Max Distance to Gas Station', 'Hard', '5. Binary Search on Answer', 'Binary search on answer'),
      q(1283, 'Find the Smallest Divisor Given a Threshold', 'Medium', '5. Binary Search on Answer', 'Binary search on answer'),
      q(1482, 'Minimum Number of Days to Make m Bouquets', 'Medium', '5. Binary Search on Answer', 'Binary search on answer'),
    ],
  },
  {
    id: 'hashing',
    name: '6. Hashing / Frequency Maps',
    pattern: 'Hash map',
    questions: [
      q(1, 'Two Sum', 'Easy', '6. Hashing / Frequency Maps', 'Hash map'),
      q(49, 'Group Anagrams', 'Medium', '6. Hashing / Frequency Maps', 'Hash map'),
      q(128, 'Longest Consecutive Sequence', 'Medium', '6. Hashing / Frequency Maps', 'Hash set'),
      q(217, 'Contains Duplicate', 'Easy', '6. Hashing / Frequency Maps', 'Hash set'),
      q(242, 'Valid Anagram', 'Easy', '6. Hashing / Frequency Maps', 'Frequency map'),
      q(347, 'Top K Frequent Elements', 'Medium', '6. Hashing / Frequency Maps', 'Hash map + heap'),
    ],
  },
  {
    id: 'prefix-sum',
    name: '7. Prefix Sum / Running Sum',
    pattern: 'Prefix sum',
    questions: [
      q(303, 'Range Sum Query - Immutable', 'Easy', '7. Prefix Sum / Running Sum', 'Prefix sum'),
      q(560, 'Subarray Sum Equals K', 'Medium', '7. Prefix Sum / Running Sum', 'Prefix sum + hash'),
      q(724, 'Find Pivot Index', 'Easy', '7. Prefix Sum / Running Sum', 'Prefix sum'),
      q(930, 'Binary Subarrays With Sum', 'Medium', '7. Prefix Sum / Running Sum', 'Prefix sum'),
      q(974, 'Subarray Sums Divisible by K', 'Medium', '7. Prefix Sum / Running Sum', 'Prefix sum + mod'),
      q(523, 'Continuous Subarray Sum', 'Medium', '7. Prefix Sum / Running Sum', 'Prefix sum + mod'),
    ],
  },
  {
    id: 'difference-array',
    name: '8. Difference Array / Range Updates',
    pattern: 'Difference array',
    questions: [
      q(370, 'Range Addition', 'Medium', '8. Difference Array / Range Updates', 'Difference array'),
      q(1094, 'Car Pooling', 'Medium', '8. Difference Array / Range Updates', 'Difference array'),
      q(1109, 'Corporate Flight Bookings', 'Medium', '8. Difference Array / Range Updates', 'Difference array'),
      q(1893, 'Check if All the Integers in a Range Are Covered', 'Easy', '8. Difference Array / Range Updates', 'Difference array'),
      q(1943, 'Describe the Painting', 'Medium', '8. Difference Array / Range Updates', 'Difference array / sweep'),
      q(2381, 'Shifting Letters II', 'Medium', '8. Difference Array / Range Updates', 'Difference array'),
    ],
  },
  {
    id: 'monotonic-stack',
    name: '9. Monotonic Stack',
    pattern: 'Monotonic stack',
    questions: [
      q(739, 'Daily Temperatures', 'Medium', '9. Monotonic Stack', 'Monotonic stack'),
      q(496, 'Next Greater Element I', 'Easy', '9. Monotonic Stack', 'Monotonic stack'),
      q(503, 'Next Greater Element II', 'Medium', '9. Monotonic Stack', 'Monotonic stack'),
      q(84, 'Largest Rectangle in Histogram', 'Hard', '9. Monotonic Stack', 'Monotonic stack'),
      q(85, 'Maximal Rectangle', 'Hard', '9. Monotonic Stack', 'Monotonic stack'),
      q(901, 'Online Stock Span', 'Medium', '9. Monotonic Stack', 'Monotonic stack'),
    ],
  },
  {
    id: 'monotonic-queue',
    name: '10. Monotonic Queue / Deque',
    pattern: 'Monotonic deque',
    questions: [
      q(239, 'Sliding Window Maximum', 'Hard', '10. Monotonic Queue / Deque', 'Monotonic deque'),
      q(862, 'Shortest Subarray with Sum at Least K', 'Hard', '10. Monotonic Queue / Deque', 'Prefix + monotonic deque'),
      q(1425, 'Constrained Subsequence Sum', 'Hard', '10. Monotonic Queue / Deque', 'DP + monotonic deque'),
      q(1438, 'Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit', 'Medium', '10. Monotonic Queue / Deque', 'Monotonic deque'),
      q(1499, 'Max Value of Equation', 'Hard', '10. Monotonic Queue / Deque', 'Monotonic deque'),
      q(1696, 'Jump Game VI', 'Medium', '10. Monotonic Queue / Deque', 'DP + monotonic deque'),
    ],
  },
  {
    id: 'heap-top-k',
    name: '11. Heap / Top K',
    pattern: 'Heap',
    questions: [
      q(215, 'Kth Largest Element in an Array', 'Medium', '11. Heap / Top K', 'Heap / quickselect'),
      q(347, 'Top K Frequent Elements', 'Medium', '11. Heap / Top K', 'Heap'),
      q(692, 'Top K Frequent Words', 'Medium', '11. Heap / Top K', 'Heap'),
      q(703, 'Kth Largest Element in a Stream', 'Easy', '11. Heap / Top K', 'Heap'),
      q(973, 'K Closest Points to Origin', 'Medium', '11. Heap / Top K', 'Heap'),
      q(1046, 'Last Stone Weight', 'Easy', '11. Heap / Top K', 'Heap'),
    ],
  },
  {
    id: 'intervals',
    name: '12. Intervals',
    pattern: 'Intervals',
    questions: [
      q(56, 'Merge Intervals', 'Medium', '12. Intervals', 'Sort + merge'),
      q(57, 'Insert Interval', 'Medium', '12. Intervals', 'Intervals'),
      q(252, 'Meeting Rooms', 'Easy', '12. Intervals', 'Sort'),
      q(253, 'Meeting Rooms II', 'Medium', '12. Intervals', 'Sweep / heap'),
      q(435, 'Non-overlapping Intervals', 'Medium', '12. Intervals', 'Greedy'),
      q(452, 'Minimum Number of Arrows to Burst Balloons', 'Medium', '12. Intervals', 'Greedy'),
    ],
  },
  {
    id: 'greedy',
    name: '13. Greedy Scheduling / Sorting',
    pattern: 'Greedy',
    questions: [
      q(45, 'Jump Game II', 'Medium', '13. Greedy Scheduling / Sorting', 'Greedy'),
      q(55, 'Jump Game', 'Medium', '13. Greedy Scheduling / Sorting', 'Greedy'),
      q(406, 'Queue Reconstruction by Height', 'Medium', '13. Greedy Scheduling / Sorting', 'Greedy + sort'),
      q(621, 'Task Scheduler', 'Medium', '13. Greedy Scheduling / Sorting', 'Greedy'),
      q(763, 'Partition Labels', 'Medium', '13. Greedy Scheduling / Sorting', 'Greedy'),
      q(134, 'Gas Station', 'Medium', '13. Greedy Scheduling / Sorting', 'Greedy'),
    ],
  },
  {
    id: 'linked-list',
    name: '14. Linked List Manipulation',
    pattern: 'Linked list',
    questions: [
      q(21, 'Merge Two Sorted Lists', 'Easy', '14. Linked List Manipulation', 'Linked list'),
      q(23, 'Merge k Sorted Lists', 'Hard', '14. Linked List Manipulation', 'Heap / merge'),
      q(24, 'Swap Nodes in Pairs', 'Medium', '14. Linked List Manipulation', 'Linked list'),
      q(25, 'Reverse Nodes in k-Group', 'Hard', '14. Linked List Manipulation', 'Linked list'),
      q(92, 'Reverse Linked List II', 'Medium', '14. Linked List Manipulation', 'Linked list'),
      q(138, 'Copy List with Random Pointer', 'Medium', '14. Linked List Manipulation', 'Hash / weave'),
    ],
  },
  {
    id: 'tree-dfs',
    name: '15. Tree DFS',
    pattern: 'Tree DFS',
    questions: [
      q(104, 'Maximum Depth of Binary Tree', 'Easy', '15. Tree DFS', 'DFS'),
      q(112, 'Path Sum', 'Easy', '15. Tree DFS', 'DFS'),
      q(113, 'Path Sum II', 'Medium', '15. Tree DFS', 'DFS'),
      q(543, 'Diameter of Binary Tree', 'Easy', '15. Tree DFS', 'DFS'),
      q(124, 'Binary Tree Maximum Path Sum', 'Hard', '15. Tree DFS', 'DFS'),
      q(226, 'Invert Binary Tree', 'Easy', '15. Tree DFS', 'DFS'),
    ],
  },
  {
    id: 'tree-bfs',
    name: '16. Tree BFS / Level Order',
    pattern: 'Tree BFS',
    questions: [
      q(102, 'Binary Tree Level Order Traversal', 'Medium', '16. Tree BFS / Level Order', 'BFS'),
      q(103, 'Binary Tree Zigzag Level Order Traversal', 'Medium', '16. Tree BFS / Level Order', 'BFS'),
      q(199, 'Binary Tree Right Side View', 'Medium', '16. Tree BFS / Level Order', 'BFS'),
      q(515, 'Find Largest Value in Each Tree Row', 'Medium', '16. Tree BFS / Level Order', 'BFS'),
      q(637, 'Average of Levels in Binary Tree', 'Easy', '16. Tree BFS / Level Order', 'BFS'),
      q(116, 'Populating Next Right Pointers in Each Node', 'Medium', '16. Tree BFS / Level Order', 'BFS / links'),
    ],
  },
  {
    id: 'bst',
    name: '17. BST Problems',
    pattern: 'BST',
    questions: [
      q(98, 'Validate Binary Search Tree', 'Medium', '17. BST Problems', 'BST inorder'),
      q(99, 'Recover Binary Search Tree', 'Medium', '17. BST Problems', 'BST'),
      q(230, 'Kth Smallest Element in a BST', 'Medium', '17. BST Problems', 'BST inorder'),
      q(235, 'Lowest Common Ancestor of a Binary Search Tree', 'Medium', '17. BST Problems', 'BST'),
      q(450, 'Delete Node in a BST', 'Medium', '17. BST Problems', 'BST'),
      q(700, 'Search in a Binary Search Tree', 'Easy', '17. BST Problems', 'BST'),
    ],
  },
  {
    id: 'backtracking-basics',
    name: '18. Backtracking Basics',
    pattern: 'Backtracking',
    questions: [
      q(46, 'Permutations', 'Medium', '18. Backtracking Basics', 'Backtracking'),
      q(47, 'Permutations II', 'Medium', '18. Backtracking Basics', 'Backtracking'),
      q(77, 'Combinations', 'Medium', '18. Backtracking Basics', 'Backtracking'),
      q(78, 'Subsets', 'Medium', '18. Backtracking Basics', 'Backtracking'),
      q(90, 'Subsets II', 'Medium', '18. Backtracking Basics', 'Backtracking'),
      q(39, 'Combination Sum', 'Medium', '18. Backtracking Basics', 'Backtracking'),
    ],
  },
  {
    id: 'backtracking-constraints',
    name: '19. Backtracking with Constraints',
    pattern: 'Backtracking',
    questions: [
      q(40, 'Combination Sum II', 'Medium', '19. Backtracking with Constraints', 'Backtracking'),
      q(17, 'Letter Combinations of a Phone Number', 'Medium', '19. Backtracking with Constraints', 'Backtracking'),
      q(79, 'Word Search', 'Medium', '19. Backtracking with Constraints', 'Backtracking / DFS'),
      q(131, 'Palindrome Partitioning', 'Medium', '19. Backtracking with Constraints', 'Backtracking'),
      q(51, 'N-Queens', 'Hard', '19. Backtracking with Constraints', 'Backtracking'),
      q(52, 'N-Queens II', 'Hard', '19. Backtracking with Constraints', 'Backtracking'),
    ],
  },
  {
    id: 'graph-bfs-dfs',
    name: '20. Graph BFS / DFS',
    pattern: 'Graph traversal',
    questions: [
      q(200, 'Number of Islands', 'Medium', '20. Graph BFS / DFS', 'DFS / BFS'),
      q(695, 'Max Area of Island', 'Medium', '20. Graph BFS / DFS', 'DFS / BFS'),
      q(733, 'Flood Fill', 'Easy', '20. Graph BFS / DFS', 'DFS / BFS'),
      q(994, 'Rotting Oranges', 'Medium', '20. Graph BFS / DFS', 'Multi-source BFS'),
      q(1091, 'Shortest Path in Binary Matrix', 'Medium', '20. Graph BFS / DFS', 'BFS'),
      q(1254, 'Number of Closed Islands', 'Medium', '20. Graph BFS / DFS', 'DFS / BFS'),
    ],
  },
  {
    id: 'topo-sort',
    name: '21. Topological Sort / DAG',
    pattern: 'Topological sort',
    questions: [
      q(207, 'Course Schedule', 'Medium', '21. Topological Sort / DAG', 'Topo sort'),
      q(210, 'Course Schedule II', 'Medium', '21. Topological Sort / DAG', 'Topo sort'),
      q(802, 'Find Eventual Safe States', 'Medium', '21. Topological Sort / DAG', 'Topo / cycle'),
      q(1462, 'Course Schedule IV', 'Medium', '21. Topological Sort / DAG', 'Topo / reachability'),
      q(1203, 'Sort Items by Groups Respecting Dependencies', 'Hard', '21. Topological Sort / DAG', 'Two-level topo'),
      q(2115, 'Find All Possible Recipes from Given Supplies', 'Medium', '21. Topological Sort / DAG', 'Topo sort'),
    ],
  },
  {
    id: 'union-find',
    name: '22. Union Find / DSU',
    pattern: 'Union Find',
    questions: [
      q(547, 'Number of Provinces', 'Medium', '22. Union Find / DSU', 'DSU'),
      q(684, 'Redundant Connection', 'Medium', '22. Union Find / DSU', 'DSU'),
      q(1319, 'Number of Operations to Make Network Connected', 'Medium', '22. Union Find / DSU', 'DSU'),
      q(1579, 'Remove Max Number of Edges to Keep Graph Fully Traversable', 'Hard', '22. Union Find / DSU', 'Multiple DSU'),
      q(990, 'Satisfiability of Equality Equations', 'Medium', '22. Union Find / DSU', 'DSU'),
      q(1202, 'Smallest String With Swaps', 'Medium', '22. Union Find / DSU', 'DSU'),
    ],
  },
  {
    id: 'shortest-path',
    name: '23. Shortest Path',
    pattern: 'Dijkstra / BFS',
    questions: [
      q(743, 'Network Delay Time', 'Medium', '23. Shortest Path', 'Dijkstra'),
      q(787, 'Cheapest Flights Within K Stops', 'Medium', '23. Shortest Path', 'Bellman / Dijkstra'),
      q(1514, 'Path with Maximum Probability', 'Medium', '23. Shortest Path', 'Dijkstra'),
      q(1631, 'Path With Minimum Effort', 'Medium', '23. Shortest Path', 'Dijkstra / binary search'),
      q(1334, 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', 'Medium', '23. Shortest Path', 'Floyd / Dijkstra'),
      q(1976, 'Number of Ways to Arrive at Destination', 'Medium', '23. Shortest Path', 'Dijkstra + DP'),
    ],
  },
  {
    id: 'mst',
    name: '24. MST / Graph Greedy',
    pattern: 'MST',
    questions: [
      q(1584, 'Min Cost to Connect All Points', 'Medium', '24. MST / Graph Greedy', 'MST'),
      q(1135, 'Connecting Cities With Minimum Cost', 'Medium', '24. MST / Graph Greedy', 'MST'),
      q(1168, 'Optimize Water Distribution in a Village', 'Hard', '24. MST / Graph Greedy', 'MST'),
      q(1489, 'Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree', 'Hard', '24. MST / Graph Greedy', 'MST + DSU'),
      q(778, 'Swim in Rising Water', 'Hard', '24. MST / Graph Greedy', 'Dijkstra / binary search'),
      q(1102, 'Path With Maximum Minimum Value', 'Medium', '24. MST / Graph Greedy', 'Binary search / Union'),
    ],
  },
  {
    id: 'trie',
    name: '25. Trie',
    pattern: 'Trie',
    questions: [
      q(208, 'Implement Trie (Prefix Tree)', 'Medium', '25. Trie', 'Trie'),
      q(211, 'Design Add and Search Words Data Structure', 'Medium', '25. Trie', 'Trie'),
      q(212, 'Word Search II', 'Hard', '25. Trie', 'Trie + DFS'),
      q(648, 'Replace Words', 'Medium', '25. Trie', 'Trie'),
      q(677, 'Map Sum Pairs', 'Medium', '25. Trie', 'Trie'),
      q(1268, 'Search Suggestions System', 'Medium', '25. Trie', 'Trie / sort'),
    ],
  },
  {
    id: 'bit-manipulation',
    name: '26. Bit Manipulation',
    pattern: 'Bits',
    questions: [
      q(136, 'Single Number', 'Easy', '26. Bit Manipulation', 'XOR'),
      q(137, 'Single Number II', 'Medium', '26. Bit Manipulation', 'Bits'),
      q(191, 'Number of 1 Bits', 'Easy', '26. Bit Manipulation', 'Bits'),
      q(338, 'Counting Bits', 'Easy', '26. Bit Manipulation', 'DP + bits'),
      q(268, 'Missing Number', 'Easy', '26. Bit Manipulation', 'XOR / math'),
      q(190, 'Reverse Bits', 'Easy', '26. Bit Manipulation', 'Bits'),
    ],
  },
  {
    id: '1d-dp',
    name: '27. 1D DP Basics',
    pattern: '1D DP',
    questions: [
      q(70, 'Climbing Stairs', 'Easy', '27. 1D DP Basics', '1D DP'),
      q(198, 'House Robber', 'Medium', '27. 1D DP Basics', '1D DP'),
      q(213, 'House Robber II', 'Medium', '27. 1D DP Basics', '1D DP'),
      q(322, 'Coin Change', 'Medium', '27. 1D DP Basics', 'Unbounded knapsack'),
      q(279, 'Perfect Squares', 'Medium', '27. 1D DP Basics', '1D DP'),
      q(300, 'Longest Increasing Subsequence', 'Medium', '27. 1D DP Basics', 'LIS'),
    ],
  },
  {
    id: 'knapsack-dp',
    name: '28. Knapsack / Subset DP',
    pattern: 'Knapsack DP',
    questions: [
      q(416, 'Partition Equal Subset Sum', 'Medium', '28. Knapsack / Subset DP', '0/1 knapsack'),
      q(494, 'Target Sum', 'Medium', '28. Knapsack / Subset DP', 'Subset DP'),
      q(518, 'Coin Change II', 'Medium', '28. Knapsack / Subset DP', 'Unbounded knapsack'),
      q(474, 'Ones and Zeroes', 'Medium', '28. Knapsack / Subset DP', '2D knapsack'),
      q(1049, 'Last Stone Weight II', 'Medium', '28. Knapsack / Subset DP', 'Subset DP'),
      q(879, 'Profitable Schemes', 'Hard', '28. Knapsack / Subset DP', 'Knapsack counting'),
    ],
  },
  {
    id: 'grid-dp',
    name: '29. Grid DP',
    pattern: 'Grid DP',
    questions: [
      q(62, 'Unique Paths', 'Medium', '29. Grid DP', 'Grid DP'),
      q(63, 'Unique Paths II', 'Medium', '29. Grid DP', 'Grid DP'),
      q(64, 'Minimum Path Sum', 'Medium', '29. Grid DP', 'Grid DP'),
      q(221, 'Maximal Square', 'Medium', '29. Grid DP', 'Grid DP'),
      q(931, 'Minimum Falling Path Sum', 'Medium', '29. Grid DP', 'Grid DP'),
      q(120, 'Triangle', 'Medium', '29. Grid DP', 'Grid DP'),
    ],
  },
  {
    id: 'string-dp',
    name: '30. String DP / Sequence DP',
    pattern: 'String / sequence DP',
    questions: [
      q(1143, 'Longest Common Subsequence', 'Medium', '30. String DP / Sequence DP', 'LCS'),
      q(72, 'Edit Distance', 'Medium', '30. String DP / Sequence DP', 'Edit distance'),
      q(115, 'Distinct Subsequences', 'Hard', '30. String DP / Sequence DP', 'Counting DP'),
      q(583, 'Delete Operation for Two Strings', 'Medium', '30. String DP / Sequence DP', 'LCS'),
      q(97, 'Interleaving String', 'Medium', '30. String DP / Sequence DP', '2D DP'),
      q(1312, 'Minimum Insertion Steps to Make a String Palindrome', 'Hard', '30. String DP / Sequence DP', 'Palindrome DP'),
    ],
  },
];

export function getAllLastMinPrepQuestions(): LastMinPrepQuestion[] {
  return LAST_MIN_PREP_CATEGORIES.flatMap((c) => c.questions);
}

/** Unique by leetcode id (347 appears in two categories). */
export function getUniqueLastMinPrepQuestions(): LastMinPrepQuestion[] {
  const map = new Map<number, LastMinPrepQuestion>();
  for (const q of getAllLastMinPrepQuestions()) {
    if (!map.has(q.leetcodeId)) map.set(q.leetcodeId, q);
  }
  return Array.from(map.values());
}

export function lastMinPrepLeetcodeUrl(title: string, leetcodeId: number): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return `https://leetcode.com/problems/${slug}/`;
}

export function emptyPrepProgress(userId: string, leetcodeId: number): LastMinPrepProgress {
  return {
    leetcode_id: leetcodeId,
    user_id: userId,
    status: 'todo',
    notes: '',
    updated_at: new Date().toISOString(),
  };
}

function storageKey(userId: string): string {
  return `last_min_prep_${userId}`;
}

export function loadLastMinPrepProgress(userId: string): LastMinPrepProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(userId)) || '[]');
  } catch {
    return [];
  }
}

export function saveLastMinPrepProgress(userId: string, rows: LastMinPrepProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(storageKey(userId), JSON.stringify(rows));
}

export function mergeLastMinPrepProgress(
  local: LastMinPrepProgress[],
  remote: LastMinPrepProgress[]
): LastMinPrepProgress[] {
  const map = new Map<number, LastMinPrepProgress>();
  for (const row of [...local, ...remote]) {
    const existing = map.get(row.leetcode_id);
    if (!existing || row.updated_at > existing.updated_at) {
      map.set(row.leetcode_id, row);
    }
  }
  return Array.from(map.values());
}

export function progressMapFromRows(
  rows: LastMinPrepProgress[]
): Map<number, LastMinPrepProgress> {
  const map = new Map<number, LastMinPrepProgress>();
  for (const row of rows) map.set(row.leetcode_id, row);
  return map;
}

export function getPrepStats(rows: LastMinPrepProgress[], totalUnique: number) {
  const map = progressMapFromRows(rows);
  let done = 0;
  let revise = 0;
  for (const row of map.values()) {
    if (row.status === 'done') done++;
    else if (row.status === 'revise') revise++;
  }
  const tracked = map.size;
  const todo = Math.max(0, totalUnique - done - revise);
  return { done, revise, todo, total: totalUnique, tracked };
}
