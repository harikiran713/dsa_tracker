export interface Question {
  id: string;
  number: number;
  title: string;
  phase: 'Easy' | 'Medium' | 'Hard';
  status: 'todo' | 'done' | 'revise';
  notes: string;
  leetcodeUrl?: string;
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

// Phase 1: Easy (50 questions)
const easyQuestions = [
  'Reverse Vowels of a String',
  'Remove Duplicates from Sorted Array',
  'Reverse Words in a String',
  'Path Sum',
  'Leaf-Similar Trees',
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
  'Maximum Number of Integers to Choose From a Range',
  'Maximum Distance in Arrays',
  'Count Nodes Equal to Average of Subtree',
  'Count Complete Tree Nodes',
  'Add One Row to Tree',
  'Delete Leaves With Given Value',
  'Create Binary Tree From Descriptions',
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
];

// Phase 3: Hard (108 questions)
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
    });
    id++;
  });

  return questions;
}

/** Shuffle within each difficulty only — Easy with Easy, Medium with Medium, Hard with Hard. */
function shuffleWithinGroup<T extends Question>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => ((a.number * 7919) % 10007) - ((b.number * 7919) % 10007)
  );
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