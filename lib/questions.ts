import {
  CP_LEARNING_CATEGORIES,
  LAST_MIN_PREP_CATEGORIES,
  getBroadTopic,
  getQuestionsFromCategories,
} from './last-min-prep';
import { AMAZON_PREP_CATEGORIES } from './amazon-prep';
import { AMAZON_TWEAK_CATEGORIES } from './amazon-tweak';
import { GOOGLE_PREP_CATEGORIES } from './google-prep';
import { DESIGN_PREP_CATEGORIES } from './design-prep';

export interface Question {
  id: string;
  number: number;
  title: string;
  phase: 'Easy' | 'Medium' | 'Hard';
  status: 'todo' | 'done' | 'revise';
  notes: string;
  leetcodeUrl?: string;
  /** Broad topic bucket (e.g. "Graphs", "DP", "Stack") inferred from curated prep data / title. */
  pattern: string;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** Title -> broad topic, built from every curated prep list that already tags a technique. */
const TITLE_TOPIC_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  const add = (title: string, topic: string) => {
    const key = normalizeTitle(title);
    if (!map[key]) map[key] = topic;
  };
  for (const q of getQuestionsFromCategories(LAST_MIN_PREP_CATEGORIES)) add(q.title, getBroadTopic(q.pattern));
  for (const q of getQuestionsFromCategories(CP_LEARNING_CATEGORIES)) add(q.title, getBroadTopic(q.pattern));
  for (const q of getQuestionsFromCategories(AMAZON_PREP_CATEGORIES)) add(q.title, getBroadTopic(q.pattern));
  for (const q of getQuestionsFromCategories(AMAZON_TWEAK_CATEGORIES)) add(q.title, getBroadTopic(q.pattern));
  for (const q of getQuestionsFromCategories(GOOGLE_PREP_CATEGORIES)) add(q.title, getBroadTopic(q.pattern));
  for (const q of getQuestionsFromCategories(DESIGN_PREP_CATEGORIES)) add(q.title, 'Design');
  return map;
})();

/** Best-effort keyword fallback for titles absent from every curated prep list above. */
function inferTopicFromTitle(title: string): string {
  const t = title.toLowerCase();
  const rules: [RegExp, string][] = [
    [/\btrie\b/, 'Trie'],
    [/linked list/, 'Linked List'],
    [/\bheap\b|kth (largest|smallest)|top k frequent|median/, 'Heap'],
    [/\bstack\b/, 'Stack'],
    [/\bqueue\b|deque/, 'Queue / Deque'],
    [
      /\btree\b|\bbst\b|binary search tree|ancestor|\bgraph\b|island|province|connected|course schedule|bipartite|itinerary|critical connections|topological|shortest path|dijkstra|network delay|eulerian|redundant connection|valid path|reachable/,
      'Graphs',
    ],
    [/\bmatrix\b|\bgrid\b/, 'Grid / Matrix'],
    [/permutations?|combinations?|subsets?|n-queens|word search|letter combinations|backtrack/, 'Backtracking'],
    [/binary search|search in rotated|search insert|peak index|kth missing|guess number|find minimum in rotated/, 'Binary Search'],
    [/sliding window|longest substring|minimum window|max consecutive/, 'Sliding Window'],
    [/two sum ii|3sum|4sum|container with most water|trapping rain water|two pointers/, 'Two Pointers'],
    [/interval|meeting rooms/, 'Intervals'],
    [/\bxor\b|\bbits?\b/, 'Bit Manipulation'],
    [
      /subsequence|partition|knapsack|coin change|climbing stairs|house robber|distinct subsequences|edit distance|palindromic partition|\bdp\b/,
      'DP',
    ],
    [/greedy|jump game|gas station|task scheduler/, 'Greedy'],
    [/\bdesign\b/, 'Design'],
    [/\bsort\b|sorting/, 'Sorting'],
    [/anagram|duplicate|\bhash/, 'Hashing'],
    [/prefix sum|subarray sum|difference array/, 'Prefix Sum'],
    [/palindrome|substring|\bstring\b/, 'String'],
    [/\bmath\b|divisors|\bgcd\b|prime|probability/, 'Math'],
    [/subarray|kadane/, 'Arrays'],
  ];
  for (const [regex, topic] of rules) {
    if (regex.test(t)) return topic;
  }
  return 'Other';
}

/**
 * Manual overrides for titles that are unique to this curated list (not present in any
 * other prep list) and too obscurely-named for the keyword fallback to classify correctly.
 */
const TOPIC_OVERRIDES: [string, string][] = [
  ['Minimum Genetic Mutation', 'Graphs'],
  ['Nearest Exit from Entrance in Maze', 'Graphs'],
  ['Find Champion II', 'Graphs'],
  ['Maximum Ice Cream Bars', 'Greedy'],
  ['Maximum 69 Number', 'Greedy'],
  ['Broken Calculator', 'Greedy'],
  ['Destroying Asteroids', 'Greedy'],
  ['Maximum Bags With Full Capacity of Rocks', 'Greedy'],
  ['Maximum Number of Integers to Choose From a Range', 'Greedy'],
  ['Maximum Distance in Arrays', 'Arrays'],
  ['Maximum Distance Between a Pair of Values', 'Two Pointers'],
  ['Minimize Maximum Pair Sum in Array', 'Greedy'],
  ['Most Beautiful Item for Each Query', 'Binary Search'],
  ['Maximum Candies Allocated to K Children', 'Binary Search'],
  ['Number of Houses at a Certain Distance I', 'Graphs'],
  ['Shortest Distance After Road Addition Queries I', 'Graphs'],
  ['Delete Nodes and Return Forest', 'Graphs'],
  ['Sum Root to Leaf Numbers', 'Graphs'],
  ['Flip Equivalent Binary Trees', 'Graphs'],
  ['Number of Good Leaf Nodes Pairs', 'Graphs'],
  ['Reorder Routes to Make All Paths Lead to the City Zero', 'Graphs'],
  ['Bus Routes', 'Graphs'],
  ['Maximum Total Importance of Roads', 'Graphs'],
  ['Find Closest Node to Given Two Nodes', 'Graphs'],
  ['Maximum Employees to Be Invited to a Meeting', 'Graphs'],
  ['Count the Number of Complete Components', 'Graphs'],
  ['Divide Nodes Into the Maximum Number of Groups', 'Graphs'],
  ['Freedom Trail', 'DP'],
  ['Maximum Number of Tasks You Can Assign', 'Binary Search'],
  ['Maximum Running Time of Computers', 'Binary Search'],
  ['Successful Pairs of Spells and Potions', 'Binary Search'],
  ['Count the Number of Fair Pairs', 'Binary Search'],
  ['Maximum Fruits Harvested After at Most K Steps', 'Sliding Window'],
  ['Minimize the Maximum Difference of Pairs', 'Binary Search'],
  ['Number of Flowers in Full Bloom', 'Binary Search'],
  ['Minimum Time to Repair Cars', 'Binary Search'],
  ['Minimum Time to Complete Trips', 'Binary Search'],
  ['Magnetic Force Between Balls', 'Binary Search'],
  ['Minimum Limit of Balls in a Bag', 'Binary Search'],
  ['Minimum Cost to Make Array Equal', 'Binary Search'],
  ['Maximum Value at a Given Index in a Bounded Array', 'Binary Search'],
  ['Most Profit Assigning Work', 'Binary Search'],
  ['Avoid Flood in The City', 'Greedy'],
  ['Maximum Width Ramp', 'Stack'],
  ['Furthest Building You Can Reach', 'Heap'],
  ['Minimum Increment to Make Array Unique', 'Greedy'],
  ['Eliminate Maximum Number of Monsters', 'Greedy'],
  ['Maximum Average Pass Ratio', 'Heap'],
  ['Rearranging Fruits', 'Greedy'],
  ['Greatest Sum Divisible by Three', 'DP'],
  ['Minimum Domino Rotations For Equal Row', 'Greedy'],
  ['Patching Array', 'Greedy'],
  ['Remove Colored Pieces if Both Neighbors are the Same Color', 'Greedy'],
  ['Minimum Time to Make Rope Colorful', 'Greedy'],
  ['Dota2 Senate', 'Queue / Deque'],
  ['Earliest Possible Day of Full Bloom', 'Greedy'],
  ['Minimum Rounds to Complete All Tasks', 'Greedy'],
  ['Maximum Number of Points with Cost', 'DP'],
  ['Find the Longest Valid Obstacle Course at Each Position', 'Binary Search'],
  ['Solving Questions With Brainpower', 'DP'],
  ['Domino and Tromino Tiling', 'DP'],
  ['Number of Music Playlists', 'DP'],
  ['Restore The Array', 'DP'],
  ['Predict the Winner', 'DP'],
  ['Stone Game II', 'DP'],
  ['Stone Game III', 'DP'],
  ['Soup Servings', 'DP'],
  ['Minimum Number of Taps to Open to Water a Garden', 'Greedy'],
  ['Count All Possible Routes', 'DP'],
  ['Painting the Walls', 'DP'],
  ['Filling Bookcase Shelves', 'DP'],
  ['Tallest Billboard', 'DP'],
  ['Strange Printer', 'DP'],
  ['Minimum Cost to Cut a Stick', 'DP'],
  ['Minimum Score Triangulation of Polygon', 'DP'],
  ['Make Array Strictly Increasing', 'DP'],
  ['Minimum Difficulty of a Job Schedule', 'DP'],
  ['Maximum Value of K Coins From Piles', 'DP'],
  ['Reducing Dishes', 'DP'],
  ['Number of Ways of Cutting a Pizza', 'DP'],
  ['K Inverse Pairs Array', 'DP'],
  ['Concatenated Words', 'Trie'],
  ['Smallest Sufficient Team', 'DP'],
  ['All Possible Full Binary Trees', 'Graphs'],
  ['Find All Possible Stable Binary Arrays I', 'DP'],
  ['Find All Possible Stable Binary Arrays II', 'DP'],
  ['Delete Columns to Make Sorted III', 'DP'],
  ['Count Digit Groupings of a Number', 'DP'],
  ['Ways to Express an Integer as Sum of Powers', 'DP'],
  ['Maximum Amount of Money Robot Can Earn', 'Grid / Matrix'],
  ['Minimum Distance to Type a Word Using Two Fingers', 'DP'],
  ['Maximum Total Damage With Spell Casting', 'DP'],
  ['Maximum Array Sum', 'DP'],
  ['Length of Longest V-Shaped Diagonal Segment', 'Grid / Matrix'],
  ['Count Ways to Build Good Strings', 'DP'],
  ['Dice Rolls With Target Sum', 'DP'],
  ['Minimum Sideway Jumps', 'DP'],
  ['Knight Dialer', 'DP'],
  ['Minimize the Difference Between Target and Chosen Elements', 'DP'],
  ['Longest Path With Different Adjacent Characters', 'Graphs'],
  ['Fraction to Recurring Decimal', 'Math'],
  ['Minimum Operations to Make the Integer Zero', 'Math'],
  ['Count Good Numbers', 'Math'],
  ['Closest Prime Numbers in Range', 'Math'],
  ['Distribute Candies Among Children II', 'Math'],
  ['Number of Good Paths', 'Graphs'],
  ['Checking Existence of Edge Length Limited Paths', 'Graphs'],
  ['Second Minimum Time to Reach Destination', 'Graphs'],
  ['Maximize the Minimum Powered City', 'Binary Search'],
  ['Last Day Where You Can Still Cross', 'Binary Search'],
  ['Apply Operations to Maximize Frequency Score', 'Binary Search'],
  ['Separate Squares I', 'Binary Search'],
  ['Maximum Building Height', 'Greedy'],
  ['Set Intersection Size At Least Two', 'Greedy'],
  ['Find Maximum Sum of Node Values', 'Bit Manipulation'],
  ['Maximum Manhattan Distance After K Changes', 'Math'],
  ['Reschedule Meetings for Maximum Free Time II', 'Intervals'],
  ['Maximize Happiness of Children', 'Greedy'],
  ['Earliest Second to Mark Indices I', 'Binary Search'],
  ['Maximum Number of K-Divisible Components', 'Graphs'],
  ['Minimize Hamming Distance After Swap Operations', 'Graphs'],
  ['Minimum Score Path Between Two Cities', 'Graphs'],
  ['Maximum Candies You Can Get from Boxes', 'Graphs'],
  ['Find All People With Secret', 'Graphs'],
  ['Minimum Initial Energy to Finish Tasks', 'Greedy'],
  ['Maximum Number of Operations to Move Ones to the End', 'Arrays'],
  ['Minimum Equal Sum of Two Arrays After Replacing Zeros', 'Math'],
  ['Minimum Number of People to Teach', 'Greedy'],
  ['Minimum Number of Operations to Make Array Empty', 'Hashing'],
  ['Maximum Element After Decreasing and Rearranging', 'Greedy'],
  ['Find Polygon With the Largest Perimeter', 'Greedy'],
  ['Special Array With X Elements Greater Than or Equal X', 'Binary Search'],
  ['Find in Mountain Array', 'Binary Search'],
  ['Maximize Score After N Operations', 'DP'],
  ['Maximum Points After Collecting Coins From All Nodes', 'Graphs'],
  ['Minimum Total Distance Traveled', 'DP'],
  ['Minimum Sum of Values by Dividing Array', 'DP'],
  ['Best Time to Buy and Sell Stock V', 'DP'],
  ['Minimum Cost Path with Teleportations', 'Graphs'],
  ['Maximum Number of Moves to Kill All Pawns', 'Graphs'],
  ['Minimum Array Sum', 'DP'],
  ['Word Ladder II', 'Graphs'],
  ['Alien Dictionary', 'Graphs'],
  ['The Maze III', 'Graphs'],
  ['Cracking the Safe', 'Graphs'],
  ['Sliding Puzzle', 'Graphs'],
  ['Number of Restricted Paths From First to Last Node', 'Graphs'],
  ['Minimum Weighted Subgraph With the Required Paths', 'Graphs'],
  ['Edit Distance', 'DP'],
  ['Wildcard Matching', 'DP'],
  ['Regular Expression Matching', 'DP'],
  ['Minimum Cost to Merge Stones', 'DP'],
  ['Remove Boxes', 'DP'],
  ['Cherry Pickup', 'Grid / Matrix'],
  ['Frog Jump', 'DP'],
  ['Best Time to Buy and Sell Stock IV', 'DP'],
  ['Minimum Number of Operations to Make Array Continuous', 'Sorting'],
  ['Maximum Number of Visible Points', 'Sorting'],
  ['Maximum Number of Robots Within Budget', 'Queue / Deque'],
  ['Maximum Difference Between Even and Odd Frequency II', 'Hashing'],
  ['Bricks Falling When Hit', 'Graphs'],
  ['Contain Virus', 'Graphs'],
  ['Minimum Cost to Reach Destination in Time', 'Graphs'],
  ['Checking Existence of Edge Length Limited Paths II', 'Graphs'],
  ['Cat and Mouse', 'Graphs'],
  ['Best Time to Buy and Sell Stock III', 'DP'],
  ['Form Largest Integer With Digits That Add up to Target', 'DP'],
  ['Number of Digit One', 'Math'],
  ['Count of Integers', 'DP'],
  ['Delivering Boxes from Storage to Ports', 'DP'],
  ['Number of Ways to Reorder Array to Get Same BST', 'Math'],
  ['Count the Number of Ideal Arrays', 'Math'],
  ['Apply Operations to Maximize Score', 'Math'],
  ['Sorted GCD Pair Queries', 'Math'],
  ['Total Characters After Transformations II', 'Math'],
  ['Find the Count of Good Integers', 'Math'],
  ['Poor Pigs', 'Math'],
];
// Overrides win outright: some cross-list pattern text (e.g. "Edit distance", lacking the
// literal word "DP") fails getBroadTopic's classification, so a hand-checked override here
// must replace it rather than only filling gaps.
for (const [title, topic] of TOPIC_OVERRIDES) {
  TITLE_TOPIC_MAP[normalizeTitle(title)] = topic;
}

function getQuestionTopic(title: string): string {
  const key = normalizeTitle(title);
  const mapped = TITLE_TOPIC_MAP[key];
  return mapped ?? inferTopicFromTitle(title);
}

// Slugs that differ from standard alphanumeric transformations
const SLUG_OVERRIDES: Record<string, string> = {
  'partitioning-into-minimum-number-of-deci-binary-numbers': 'partitioning-into-minimum-number-of-deci-binary-numbers',
  'maximum-sum-of-3-non-overlapping-subarrays': 'maximum-sum-of-3-non-overlapping-subarrays',
  'number-of-ways-to-paint-n-3-grid': 'number-of-ways-to-paint-n-3-grid',
  'painting-a-grid-with-three-different-colors': 'painting-a-grid-with-three-different-colors',
  'special-array-with-x-elements-greater-than-or-equal-x': 'special-array-with-x-elements-greater-than-or-equal-x',
  'longest-binary-subsequence-less-than-or-equal-to-k': 'longest-binary-subsequence-less-than-or-equal-to-k',
};

// Helper function to convert title to LeetCode URL slug
function getTitleSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/×/g, '')             // Handle specific math symbols like '×'
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special characters except hyphens
    .trim()
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .replace(/-+/g, '-');          // Remove consecutive hyphens

  return SLUG_OVERRIDES[baseSlug] ?? baseSlug;
}

// Phase 1: Easy
const easyQuestions = [
  'Reverse Vowels of a String',
  'Remove Duplicates from Sorted Array',
  'Reverse Words in a String',
  // Keep a small tree core only
  'Path Sum',
  'Same Tree',
  'Symmetric Tree',
  'Binary Tree Inorder Traversal',
  'Minimum Depth of Binary Tree',
  'Keys and Rooms',
  'Find if Path Exists in Graph',
  'Minimum Genetic Mutation',
  'Nearest Exit from Entrance in Maze',
  'Find Champion II',
  'Maximum Ice Cream Bars',
  'Maximum 69 Number',
  'Broken Calculator',
  'Partitioning Into Minimum Number Of Deci-Binary Numbers',
  'Destroying Asteroids',
  'Maximum Bags With Full Capacity of Rocks',
  'Maximum Number of Integers to Choose From a Range',
  'Maximum Distance in Arrays',
  'Find the Longest Balanced Substring of a Binary String',
  'Maximum Distance Between a Pair of Values',
  'Minimize Maximum Pair Sum in Array',
  'Minimum Length of String After Deleting Similar Ends',
  'Find Minimum in Rotated Sorted Array',
  'Guess Number Higher or Lower',
  'Kth Missing Positive Number',
  'Peak Index in a Mountain Array',
  'Most Beautiful Item for Each Query',
  'House Robber IV',
  'Maximum Candies Allocated to K Children',
  'Count the Number of Good Partitions',
  'Number of Houses at a Certain Distance I',
  'Shortest Distance After Road Addition Queries I',
  'Maximum Number of Fish in a Grid',
  'Find All Possible Recipes from Given Supplies',
  'Check if There is a Valid Path in a Grid',
];

// Phase 2: Medium (165 questions)
const mediumQuestions = [
  'Binary Tree Right Side View',
  'Construct Binary Tree from Preorder and Inorder Traversal',
  'Construct Binary Tree from Inorder and Postorder Traversal',
  'Binary Tree Pruning',
  'Delete Nodes and Return Forest',
  'Path Sum II',
  'Sum Root to Leaf Numbers',
  'Longest ZigZag Path in a Binary Tree',
  'Maximum Width of Binary Tree',
  'Maximum Level Sum of a Binary Tree',
  'All Nodes Distance K in Binary Tree',
  'Validate Binary Tree Nodes',
  'Distribute Coins in Binary Tree',
  'Even Odd Tree',
  'Smallest String Starting From Leaf',
  'Linked List in Binary Tree',
  'Flip Equivalent Binary Trees',
  'Reverse Odd Levels of Binary Tree',
  'Recover a Tree From Preorder Traversal',
  'Construct Binary Tree from Preorder and Postorder Traversal',
  'Lowest Common Ancestor of Deepest Leaves',
  'Diameter of Binary Tree',
  'Find Duplicate Subtrees',
  'Maximum Difference Between Node and Ancestor',
  'Number of Good Leaf Nodes Pairs',
  'Step-By-Step Directions From a Binary Tree Node to Another',
  'Clone Graph',
  'Cheapest Flights Within K Stops',
  'Reorder Routes to Make All Paths Lead to the City Zero',
  'Evaluate Division',
  'Open the Lock',
  'Bus Routes',
  'Most Stones Removed with Same Row or Column',
  'Similar String Groups',
  'Path with Maximum Probability',
  'Count Unreachable Pairs of Nodes in an Undirected Graph',
  'Longest Cycle in a Graph',
  'Find Eventual Safe States',
  'Minimum Height Trees',
  'Reconstruct Itinerary',
  'Maximum Total Importance of Roads',
  'All Ancestors of a Node in a Directed Acyclic Graph',
  'Find Closest Node to Given Two Nodes',
  'Maximum Employees to Be Invited to a Meeting',
  'Swim in Rising Water',
  'Making A Large Island',
  'Number of Ways to Arrive at Destination',
  'Count the Number of Complete Components',
  'Most Profitable Path in a Tree',
  'Redundant Connection',
  'Divide Nodes Into the Maximum Number of Groups',
  'Parallel Courses III',
  'Course Schedule IV',
  'Build a Matrix With Conditions',
  'Minimum Cost to Convert String I',
  'Find Edges in Shortest Paths',
  'Freedom Trail',
  'Maximum Number of Tasks You Can Assign',
  'Maximum Running Time of Computers',
  'Successful Pairs of Spells and Potions',
  'Count the Number of Fair Pairs',
  'Maximum Fruits Harvested After at Most K Steps',
  'Minimize the Maximum Difference of Pairs',
  'Number of Flowers in Full Bloom',
  'Minimum Speed to Arrive on Time',
  'Minimum Time to Repair Cars',
  'Minimum Time to Complete Trips',
  'Kth Smallest Pair Distance',
  'Magnetic Force Between Balls',
  'Minimum Number of Days to Make m Bouquets',
  'Minimum Limit of Balls in a Bag',
  'Minimized Maximum of Products Distributed to Any Store',
  'Minimum Cost to Make Array Equal',
  'Maximum Value at a Given Index in a Bounded Array',
  'Most Profit Assigning Work',
  'Avoid Flood in The City',
  'Maximum Width Ramp',
  'Partition Labels',
  'Push Dominoes',
  'Number of Subsequences That Satisfy the Given Sum Condition',
  'Furthest Building You Can Reach',
  'Minimum Increment to Make Array Unique',
  'Maximum Score of a Good Subarray',
  'Eliminate Maximum Number of Monsters',
  'Longest Binary Subsequence Less Than or Equal To K',
  'Maximum Average Pass Ratio',
  'Rearranging Fruits',
  'Greatest Sum Divisible by Three',
  'Minimum Domino Rotations For Equal Row',
  'Patching Array',
  'Remove Colored Pieces if Both Neighbors are the Same Color',
  'Minimum Time to Make Rope Colorful',
  'Longest Palindrome by Concatenating Two-Letter Words',
  'Minimum Replacements to Sort the Array',
  'Dota2 Senate',
  'Earliest Possible Day of Full Bloom',
  'Minimum Rounds to Complete All Tasks',
  'Minimum Falling Path Sum',
  'Cherry Pickup II',
  'Number of Increasing Paths in a Grid',
  'Maximum Number of Points with Cost',
  'Number of Ways to Paint N × 3 Grid',
  'Painting a Grid With Three Different Colors',
  'Longest Arithmetic Subsequence',
  'Length of Longest Fibonacci Subsequence',
  'Find the Longest Valid Obstacle Course at Each Position',
  'Max Dot Product of Two Subsequences',
  'Solving Questions With Brainpower',
  'Partition Array for Maximum Sum',
  'Maximum Profit in Job Scheduling',
  'Domino and Tromino Tiling',
  'Number of Music Playlists',
  'Profitable Schemes',
  'Restore The Array',
  'Number of Ways to Form a Target String Given a Dictionary',
  'Predict the Winner',
  'Stone Game II',
  'Stone Game III',
  'Knight Probability in Chessboard',
  'Soup Servings',
  'Minimum Number of Taps to Open to Water a Garden',
  'Count All Possible Routes',
  'Painting the Walls',
  'Filling Bookcase Shelves',
  'Tallest Billboard',
  'Strange Printer',
  'Scramble String',
  'String Compression II',
  'Arithmetic Slices II - Subsequence',
  'Maximum Number of Events That Can Be Attended II',
  'Minimum Cost to Cut a Stick',
  'Minimum Score Triangulation of Polygon',
  'Check if There is a Valid Partition For The Array',
  'Make Array Strictly Increasing',
  'Constrained Subsequence Sum',
  'Minimum Difficulty of a Job Schedule',
  'Maximum Value of K Coins From Piles',
  'Reducing Dishes',
  'Number of Ways of Cutting a Pizza',
  'Valid Parenthesis String',
  'K Inverse Pairs Array',
  'Concatenated Words',
  'Maximum Sum of 3 Non-Overlapping Subarrays',
  'Smallest Sufficient Team',
  'All Possible Full Binary Trees',
  'Find All Possible Stable Binary Arrays I',
  'Find All Possible Stable Binary Arrays II',
  'Delete Columns to Make Sorted III',
  'Count Digit Groupings of a Number',
  'Ways to Express an Integer as Sum of Powers',
  'Longest Unequal Adjacent Groups Subsequence II',
  'Find the Maximum Length of Valid Subsequence I',
  'Maximum Amount of Money Robot Can Earn',
  'Minimum Distance to Type a Word Using Two Fingers',
  'Maximum Total Damage With Spell Casting',
  'Maximum Array Sum',
  'Maximum Path Score in a Grid',
  'Length of Longest V-Shaped Diagonal Segment',
  // Medium DP set (append-only so existing #s stay stable)
  'Minimum Cost For Tickets',
  'Count Ways to Build Good Strings',
  'Dice Rolls With Target Sum',
  'Maximum Alternating Subsequence Sum',
  'Minimum Sideway Jumps',
  'Knight Dialer',
  'Minimize the Difference Between Target and Chosen Elements',
  'Longest Path With Different Adjacent Characters',
  // Sliding-window / subarray set (append-only)
  'Longest Subarray With At Most K Frequency',
  'Count the Number of Good Subarrays',
  'Count Substrings That Satisfy K-Constraint I',
  'Longest Continuous Subarray With Absolute Diff Less Than or Equal to Limit',
  'Continuous Subarrays',
  'Longest Nice Subarray',
  'Minimum Number of Flips to Make the Binary String Alternating',
  // Math / combinatorics set (append-only)
  'New 21 Game',
  'Fraction to Recurring Decimal',
  'Minimum Operations to Make the Integer Zero',
  'Count Good Numbers',
  'Closest Prime Numbers in Range',
  'Distribute Candies Among Children II',
];

// Phase 3: Hard
const hardQuestions = [
  'Binary Tree Maximum Path Sum',
  'Maximum Product of Splitted Binary Tree',
  'Height of Binary Tree After Subtree Removal Queries',
  'Cousins in Binary Tree II',
  'Minimum Operations to Sort a Binary Tree by Level',
  'Pseudo-Palindromic Paths in a Binary Tree',
  'Number of Good Paths',
  'Sum of Distances in Tree',
  'Largest Color Value in a Directed Graph',
  'Find Critical and Pseudo-Critical Edges in Minimum Spanning Tree',
  'Sort Items by Groups Respecting Dependencies',
  'Checking Existence of Edge Length Limited Paths',
  'Remove Max Number of Edges to Keep Graph Fully Traversable',
  'Detonate the Maximum Bombs',
  'Second Minimum Time to Reach Destination',
  'Modify Graph Edge Weights',
  'Minimum Obstacle Removal to Reach Corner',
  'Minimum Time to Visit a Cell In a Grid',
  'Minimum Cost to Make at Least One Valid Path in a Grid',
  'Design Graph With Shortest Path Calculator',
  'Lexicographically Smallest Equivalent String',
  'Lexicographically Smallest String After Operations',
  'Maximize Target Nodes in Each Tree I',
  'Maximize Target Nodes in Each Tree II',
  'Minimum Cost to Convert String II',
  'Detect Cycles in 2D Grid',
  'Maximize the Minimum Powered City',
  'Kth Smallest Product of Two Sorted Arrays',
  'Find the Safest Path in a Grid',
  'Last Day Where You Can Still Cross',
  'Apply Operations to Maximize Frequency Score',
  'Separate Squares I',
  'Find the City With the Smallest Number of Neighbors at a Threshold Distance',
  'Maximum Building Height',
  'Set Intersection Size At Least Two',
  'Find Maximum Sum of Node Values',
  'Maximum Manhattan Distance After K Changes',
  'Reschedule Meetings for Maximum Free Time II',
  'Maximize Happiness of Children',
  'Earliest Second to Mark Indices I',
  'Maximum Number of K-Divisible Components',
  'Minimum Score After Removals on a Tree',
  'Minimize Hamming Distance After Swap Operations',
  'Minimum Score Path Between Two Cities',
  'Maximum Candies You Can Get from Boxes',
  'Find All People With Secret',
  'Minimum Initial Energy to Finish Tasks',
  'Maximum Number of Operations to Move Ones to the End',
  'Minimum Equal Sum of Two Arrays After Replacing Zeros',
  'Minimum Number of People to Teach',
  'Minimum Number of Operations to Make Array Empty',
  'Maximum Element After Decreasing and Rearranging',
  'Find Polygon With the Largest Perimeter',
  'Optimal Partition of String',
  'Special Array With X Elements Greater Than or Equal X',
  'Find in Mountain Array',
  'Maximize Score After N Operations',
  'Maximum Points After Collecting Coins From All Nodes',
  'Maximize the Number of Partitions After Operations',
  'Minimum Falling Path Sum II',
  'Maximum Strength of K Disjoint Subarrays',
  'Minimum Total Distance Traveled',
  'Minimum Sum of Values by Dividing Array',
  'Count Number of Balanced Permutations',
  'Find the Original Typed String II',
  'Find the String with LCP',
  'Maximum Score From Grid Operations',
  'Best Time to Buy and Sell Stock V',
  'Minimum Cost Path with Teleportations',
  'Count Partitions With Max-Min Difference at Most K',
  'Maximum Number of Moves to Kill All Pawns',
  'Minimum Array Sum',
  'Minimum Window Substring',
  'Sliding Window Maximum',
  'Trapping Rain Water',
  'Container With Most Water',
  'Longest Substring with At Most K Distinct Characters',
  'Substring with Concatenation of All Words',
  'Shortest Subarray with Sum at Least K',
  'Minimum Window Subsequence',
  // Graph / shortest-path hard set (append-only so existing #s stay stable)
  'Word Ladder II',
  'Alien Dictionary',
  'Trapping Rain Water II',
  'The Maze III',
  'Redundant Connection II',
  'Cracking the Safe',
  'Sliding Puzzle',
  'Shortest Path Visiting All Nodes',
  'Shortest Path to Get All Keys',
  'Critical Connections in a Network',
  'Shortest Path in a Grid with Obstacles Elimination',
  'Number of Restricted Paths From First to Last Node',
  'Minimum Weighted Subgraph With the Required Paths',
  // Hard DP set (append-only so existing #s stay stable)
  'Edit Distance',
  'Wildcard Matching',
  'Regular Expression Matching',
  'Distinct Subsequences',
  'Palindrome Partitioning II',
  'Burst Balloons',
  'Minimum Cost to Merge Stones',
  'Remove Boxes',
  'Dungeon Game',
  'Cherry Pickup',
  'Longest Increasing Path in a Matrix',
  'Frog Jump',
  'Split Array Largest Sum',
  'Best Time to Buy and Sell Stock IV',
  'Maximum Students Taking Exam',
  // Hard sliding-window set (append-only so existing #s stay stable)
  'Sliding Window Median',
  'Subarrays with K Different Integers',
  'Count Subarrays With Fixed Bounds',
  'Count Subarrays With Score Less Than K',
  'Minimum Number of K Consecutive Bit Flips',
  'Minimum Number of Operations to Make Array Continuous',
  'Smallest Range Covering Elements from K Lists',
  'Maximum Number of Visible Points',
  'Maximum Number of Robots Within Budget',
  'Max Value of Equation',
  'Shortest Subarray With OR at Least K II',
  'Count Non-Decreasing Subarrays After K Operations',
  'Maximum Difference Between Even and Odd Frequency II',
  // Hard graph set (append-only so existing #s stay stable)
  'Bricks Falling When Hit',
  'Minimum Number of Days to Disconnect Island',
  'Contain Virus',
  'Reachable Nodes In Subdivided Graph',
  'Minimum Cost to Reach Destination in Time',
  'Graph Connectivity With Threshold',
  'Checking Existence of Edge Length Limited Paths II',
  'Cat and Mouse',
  // Hard DP set (append-only so existing #s stay stable)
  'Best Time to Buy and Sell Stock III',
  'Russian Doll Envelopes',
  'Form Largest Integer With Digits That Add up to Target',
  'Find the Shortest Superstring',
  'Number of Digit One',
  'Count of Integers',
  'Binary Tree Cameras',
  'Delivering Boxes from Storage to Ports',
  // Hard sliding-window / subarray set (append-only)
  'Count Subarrays Where Max Appears At Least K Times',
  'Count Substrings Containing Every Vowel and K Consonants II',
  'Count Substrings That Satisfy K-Constraint II',
  'Find Subarray With Bitwise AND Closest to K',
  'Find X-Sum of All K-Long Subarrays II',
  // Hard math / combinatorics set (append-only)
  'Number of Ways to Reorder Array to Get Same BST',
  'Count the Number of Ideal Arrays',
  'Apply Operations to Maximize Score',
  'Sorted GCD Pair Queries',
  'Total Characters After Transformations II',
  'Fancy Sequence',
  'Find the Count of Good Integers',
  'Poor Pigs',
  'Sum of k-Mirror Numbers',
];

export function initializeQuestions(): Question[] {
  let id = 1;
  const questions: Question[] = [];

  const getLeetcodeUrl = (title: string) => {
    const slug = getTitleSlug(title);
    return `https://leetcode.com/problems/${slug}/`;
  };

  easyQuestions.forEach((title) => {
    questions.push({
      id: `q-${id}`,
      number: id,
      title,
      phase: 'Easy',
      status: 'todo',
      notes: '',
      leetcodeUrl: getLeetcodeUrl(title),
      pattern: getQuestionTopic(title),
    });
    id++;
  });

  mediumQuestions.forEach((title) => {
    questions.push({
      id: `q-${id}`,
      number: id,
      title,
      phase: 'Medium',
      status: 'todo',
      notes: '',
      leetcodeUrl: getLeetcodeUrl(title),
      pattern: getQuestionTopic(title),
    });
    id++;
  });

  hardQuestions.forEach((title) => {
    questions.push({
      id: `q-${id}`,
      number: id,
      title,
      phase: 'Hard',
      status: 'todo',
      notes: '',
      leetcodeUrl: getLeetcodeUrl(title),
      pattern: getQuestionTopic(title),
    });
    id++;
  });

  return questions;
}

/** Seeded PRNG so order is stable for a given seed, but well mixed. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher–Yates shuffle within a difficulty group.
 * Mixes older questions with recently appended ones (keeps question numbers stable).
 */
function shuffleWithinGroup<T extends Question>(items: T[]): T[] {
  if (items.length <= 1) return items;

  const arr = [...items];
  // Seed from the set itself so adding new questions reshuffles the whole group.
  // Day factor rotates the mix daily without changing stored progress IDs.
  const now = new Date();
  const dayKey = now.getFullYear() * 1000 + (now.getMonth() + 1) * 40 + now.getDate();
  let seed = dayKey ^ (arr.length * 2654435761);
  for (const q of arr) {
    seed = Math.imul(seed ^ q.number, 1597334677);
    for (let i = 0; i < q.title.length; i++) {
      seed = Math.imul(seed ^ q.title.charCodeAt(i), 2246822519);
    }
  }

  const rand = mulberry32(seed >>> 0);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

export function mixQuestionsByDifficulty<T extends Question>(questions: T[]): T[] {
  const easy = shuffleWithinGroup(questions.filter((q) => q.phase === 'Easy'));
  const medium = shuffleWithinGroup(questions.filter((q) => q.phase === 'Medium'));
  const hard = shuffleWithinGroup(questions.filter((q) => q.phase === 'Hard'));
  return [...easy, ...medium, ...hard];
}

export function getQuestionsFromStorage(): Question[] {
  if (typeof window === 'undefined') {
    return initializeQuestions();
  }

  const stored = localStorage.getItem('sde-questions');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored questions:', error);
      return initializeQuestions();
    }
  }

  const initial = initializeQuestions();
  localStorage.setItem('sde-questions', JSON.stringify(initial));
  return initial;
}

export function saveQuestionsToStorage(questions: Question[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sde-questions', JSON.stringify(questions));
  }
}