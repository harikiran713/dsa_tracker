export interface Question {
  id: string;
  number: number;
  title: string;
  phase: 'Easy' | 'Medium' | 'Hard';
  status: 'todo' | 'done' | 'revise';
  notes: string;
  leetcodeUrl?: string;
}

// Slugs that differ from auto-generated title slugs (hyphenated words, etc.)
const SLUG_OVERRIDES: Record<number, string> = {
  23: 'partitioning-into-minimum-number-of-deci-binary-numbers',
  199: 'maximum-sum-of-3-non-overlapping-subarrays',
};

// Helper function to convert title to LeetCode URL slug
function getTitleSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove consecutive hyphens
}

// Phase 1: Easy (50 questions)
const easyQuestions = [
  'Reverse Vowels of a String',
  'Remove Duplicates from Sorted Array',
  'Reverse Words in a String',
  'Path Sum',
  'Leaf Similar Trees',
  'Same Tree',
  'Symmetric Tree',
  'Binary Tree Inorder Traversal',
  'Binary Tree Preorder Traversal',
  'Minimum Depth of Binary Tree',
  'Find Largest Value in Each Tree Row',
  'Find Bottom Left Tree Value',
  'Find Elements in a Contaminated Binary Tree',
  'Check Completeness of Binary Tree',
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
  'Maximum Number of Integers to Choose',
  'Maximum Distance in Arrays',
  'Count Nodes Equal to Average of Subtree',
  'Count Complete Tree Nodes',
  'Add One Row to Tree',
  'Delete Leaves With Given Value',
  'Create Binary Tree From Descriptions',
  'Longest Balanced Substring I',
  'Longest Balanced Subarray I',
  'Maximum Distance Between Pair of Values',
  'Minimize Maximum Pair Sum',
  'Minimum Length After Deleting Similar Ends',
  'Find Rotation Count',
  'Guess Number Higher or Lower',
  'Kth Missing Positive Number',
  'Peak Index in Mountain Array',
  'Most Beautiful Item for Each Query',
  'House Robber IV',
  'Maximum Candies Allocated to K Children',
  'Count the Number of Good Partitions',
  'Number of Houses at Certain Distance I',
  'Shortest Distance After Road Addition Queries I',
  'Maximum Number of Fish in Grid',
  'Find Recipes From Supplies',
  'Check Valid Path in Grid',
];

// Phase 2: Medium (165 questions)
const mediumQuestions = [
  'Binary Tree Right Side View',
  'Construct Binary Tree from Preorder and Inorder Traversal',
  'Construct Tree from Inorder + Postorder',
  'Binary Tree Pruning',
  'Delete Nodes and Return Forest',
  'Path Sum II',
  'Sum Root to Leaf Numbers',
  'Longest ZigZag Path',
  'Maximum Width of Binary Tree',
  'Maximum Level Sum',
  'All Nodes Distance K',
  'Validate Binary Tree Nodes',
  'Distribute Coins in Binary Tree',
  'Even Odd Tree',
  'Smallest String Starting From Leaf',
  'Linked List in Binary Tree',
  'Flip Equivalent Binary Trees',
  'Reverse Odd Levels',
  'Recover Tree From Preorder',
  'Construct Tree from Preorder + Postorder',
  'Lowest Common Ancestor of Deepest Leaves',
  'Diameter of Binary Tree',
  'Find Duplicate Subtrees',
  'Maximum Difference Between Node and Ancestor',
  'Number of Good Leaf Nodes Pairs',
  'Count Nodes at Distance K from Leaf',
  'Step by Step Directions',
  'Clone Graph',
  'Cheapest Flights Within K Stops',
  'Reorder Routes to Make All Paths Lead to the City Zero',
  'Evaluate Division',
  'Open the Lock',
  'Bus Routes',
  'Most Stones Removed (DFS)',
  'Most Stones Removed (DSU)',
  'Similar String Groups',
  'Path with Maximum Probability',
  'Count Unreachable Pairs',
  'Longest Cycle',
  'Find Eventual Safe States',
  'Minimum Height Trees',
  'Reconstruct Itinerary',
  'Maximum Total Importance of Roads',
  'All Ancestors in DAG',
  'Find Closest Node',
  'Maximum Employees Invited',
  'Swim in Rising Water',
  'Making A Large Island',
  'Number of Ways to Arrive',
  'Count Complete Components',
  'Most Profitable Path',
  'Redundant Connection',
  'Divide Nodes Into Maximum Groups',
  'Parallel Courses III',
  'Course Schedule IV',
  'Minimum Cost Walk',
  'Build Matrix With Conditions',
  'Minimum Cost Convert String I',
  'Find Edges in Shortest Paths',
  'Freedom Trail',
  'Maximum Number of Tasks You Can Assign',
  'Maximum Running Time of Computers',
  'Successful Pairs',
  'Count the Number of Fair Pairs',
  'Maximum Fruits Harvested',
  'Minimize Maximum Difference of Pairs',
  'Number of Flowers in Full Bloom',
  'Minimum Speed to Arrive',
  'Minimum Time to Repair Cars',
  'Minimum Time to Complete Trips',
  'Kth Smallest Pair Distance',
  'Magnetic Force Between Balls',
  'Minimum Number of Days to Make Bouquets',
  'Minimum Limit of Balls',
  'Minimized Maximum Products',
  'Minimum Cost Make Array Equal',
  'Maximum Value at Index',
  'Most Profit Assigning Work',
  'Avoid Flood in City',
  'Maximum Width Ramp',
  'Partition Labels',
  'Push Dominoes',
  'Number of Subsequences Satisfying Sum',
  'Furthest Building',
  'Minimum Increment to Make Array Unique',
  'Maximum Score of Good Subarray',
  'Eliminate Maximum Monsters',
  'Longest Binary Subsequence le K',
  'Maximum Average Pass Ratio',
  'Rearranging Fruits',
  'Greatest Sum Divisible by Three',
  'Minimum Domino Rotations',
  'Patching Array',
  'Remove Colored Pieces',
  'Minimum Rope Colorful',
  'Longest Palindrome by Concatenating Two Letter Words',
  'Minimum Replacements to Sort Array',
  'Dota2 Senate',
  'Earliest Full Bloom',
  'Minimum Rounds',
  'Minimum Falling Path Sum',
  'Cherry Pickup II',
  'Number of Increasing Paths in a Grid',
  'Maximum Number of Points with Cost',
  'Number of Ways to Paint N times 3 Grid',
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
  'Number of Ways to Form a Target String Given a Dictionary Bottom Up',
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
  'String Compression II 2-D Memoization',
  'Arithmetic Slices II - Subsequence',
  'Maximum Number of Events That Can Be Attended II',
  'Minimum Cost to Cut a Stick',
  'Minimum Score Triangulation of Polygon',
  'Check if There is a Valid Partition For The Array',
  'Make Array Strictly Increasing',
  'Constrained Subsequence Sum',
  'Minimum Difficulty of a Job Schedule',
  'Minimum Difficulty of a Job Schedule (Bottom Up)',
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
  'Count digit groupings of a number',
  'Ways to Express an Integer as Sum of Powers',
  'Longest Unequal Adjacent Groups Subsequence II',
  'Find the Maximum Length of Valid Subsequence',
  'Maximum Amount of Money Robot Can Earn',
  'Minimum Distance to Type a Word Using Two Fingers',
  'Maximum Total Damage With Spell Casting',
  'Maximum Array Sum',
  'Trionic Array II',
  'Maximum Path Score in a Grid',
  'Length of Longest V-Shaped Diagonal Segment',
];

// Phase 3: Hard (108 questions)
const hardQuestions = [
  'Binary Tree Maximum Path Sum',
  'Maximum Product of Splitted Binary Tree',
  'Height After Subtree Removal Queries',
  'Cousins in Binary Tree II',
  'Minimum Operations to Sort Binary Tree by Level',
  'Pseudo Palindromic Paths',
  'Number of Good Paths',
  'Sum of Distances in Tree',
  'Largest Color Value',
  'Critical and Pseudo Critical Edges',
  'Sort Items by Groups',
  'Checking Edge Length Limited Paths',
  'Remove Max Edges to Keep Traversable',
  'Detonate Maximum Bombs',
  'Second Minimum Time',
  'Modify Graph Edge Weights',
  'Minimum Obstacle Removal',
  'Minimum Time Visit Grid',
  'Minimum Cost Valid Path',
  'Design Graph With Shortest Path Calculator',
  'Lexicographically Smallest Equivalent String',
  'Lexicographically Smallest String After Operations',
  'Maximize Target Nodes I',
  'Maximize Target Nodes II',
  'Power Grid Maintenance',
  'Maximize Spanning Tree Stability',
  'Minimum Cost Convert String II',
  'Minimum Cost Path with Edge Reversals',
  'Detect Cycles in Grid',
  'Minimum Jumps via Prime Teleportation',
  'Network Recovery Pathways',
  'Maximize Minimum Powered City',
  'Kth Smallest Product of Two Sorted Arrays',
  'Maximize Minimum Game Score',
  'Minimize Maximum Adjacent Difference',
  'Find Safest Path in Grid',
  'Last Day Where You Can Still Cross',
  'Apply Operations to Maximize Frequency Score',
  'Separate Squares I',
  'Maximize Distance Between Points on Square',
  'Find City With Smallest Neighbors',
  'Number of Possible Closing Branches',
  'Maximum Building Height',
  'Set Intersection Size At Least Two',
  'Find Maximum Sum of Node Values',
  'Maximum Manhattan Distance After K Changes',
  'Reschedule Meetings II',
  'Maximize Subarrays After Removing One Pair',
  'Maximum Distinct Elements After Operations',
  'Lexicographically Smallest Generated String',
  'Maximum Total Subarray Value I',
  'Minimum Moves to Balance Circular Array',
  'Maximize Happiness of Children',
  'Earliest Second to Mark Indices',
  'Water the Plants',
  'Maximum K-Divisible Components',
  'Minimum Score After Removals on Tree',
  'Minimum Operations to Equalize Binary String',
  'Minimize Hamming Distance After Swaps',
  'Find the City with Threshold Distance',
  'Minimum Score Path Between Cities',
  'Maximum Candies from Boxes',
  'Find All People With Secret',
  'Minimum Initial Energy to Finish Tasks',
  'Maximum Number of Operations to Move Ones',
  'Minimum Equal Sum After Replacing Zeros',
  'Minimum Number of People to Teach',
  'Minimum Operations Make Array Empty',
  'Maximum Element After Rearranging',
  'Find Polygon with Largest Perimeter',
  'Optimal Partition of String',
  'Count Complete Components Advanced Variations',
  'Number of Good Leaf Node Pairs Optimized',
  'Paths from Root with Given Sum Optimized',
  'Special Array With X Elements ge X',
  'Find in Mountain Array',
  'Maximum Fruits Harvested Optimized',
  'Maximum Running Time Optimized',
  'Find Edges in Shortest Paths Optimized',
  'Modify Graph Edge Weights Optimized',
  'Maximize Score After N Operations',
  'Maximum Points After Collecting Coins From All Nodes',
  'Maximize the Number of Partitions After Operations',
  'Minimum Falling Path Sum II',
  'Maximum Strength of K Disjoint Subarrays',
  'Minimum Total Distance Traveled',
  'Minimum Sum of Values by Dividing Array',
  'Merge Operations for Minimum Travel Time',
  'Count Number of Balanced Permutations',
  'Find the Original Typed String II',
  'Find the String with LCP',
  'Maximum Walls Destroyed by Robots',
  'Maximum Score From Grid Operations',
  'Maximum Profit from Trading Stocks with Discounts',
  'Best Time to Buy and Sell Stock V',
  'Minimum Cost Path with Teleportations',
  'Find Sum of Array Product of Magical Sequences',
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
];

export function initializeQuestions(): Question[] {
  let id = 1;
  const questions: Question[] = [];

  const getLeetcodeUrl = (number: number, title: string) => {
    const slug = SLUG_OVERRIDES[number] ?? getTitleSlug(title);
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
      leetcodeUrl: getLeetcodeUrl(id, title),
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
      leetcodeUrl: getLeetcodeUrl(id, title),
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
      leetcodeUrl: getLeetcodeUrl(id, title),
    });
    id++;
  });

  return questions;
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
