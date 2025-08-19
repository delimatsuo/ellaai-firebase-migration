/**
 * Standard Question Bank for Technical Assessments
 * Contains validated coding problems with test cases
 */

export interface QuestionTemplate {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  timeLimit: number; // in minutes
  points: number;
  testCases: {
    id: string;
    name: string;
    input: any;
    expectedOutput: any;
    isVisible: boolean;
    weight: number;
    timeLimit?: number;
  }[];
  starterCode: {
    [languageId: string]: string;
  };
  hints: string[];
  solution?: {
    [languageId: string]: {
      code: string;
      explanation: string;
      timeComplexity: string;
      spaceComplexity: string;
    };
  };
}

export const STANDARD_QUESTION_BANK: QuestionTemplate[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

Constraints:
• 2 ≤ nums.length ≤ 10^4
• -10^9 ≤ nums[i] ≤ 10^9
• -10^9 ≤ target ≤ 10^9
• Only one valid answer exists.`,
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    tags: ['array', 'hash-table'],
    timeLimit: 15,
    points: 100,
    testCases: [
      {
        id: 'test1',
        name: 'Basic case',
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: [0, 1],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'Different order',
        input: { nums: [3, 2, 4], target: 6 },
        expectedOutput: [1, 2],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Duplicate values',
        input: { nums: [3, 3], target: 6 },
        expectedOutput: [0, 1],
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Large array',
        input: { nums: [1, 2, 3, 4, 5, 6, 7, 8, 9], target: 17 },
        expectedOutput: [7, 8],
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function twoSum(nums, target) {
    // Your solution here
    
}`,
      python: `def two_sum(nums, target):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        return new int[0];
    }
}`,
      go: `func twoSum(nums []int, target int) []int {
    // Your solution here
    return []int{}
}`,
    },
    hints: [
      'Think about what information you need to store as you iterate through the array.',
      'A hash table/map can help you find complements quickly.',
      'For each number, check if its complement (target - current) exists in your hash table.',
    ],
    solution: {
      javascript: {
        code: `function twoSum(nums, target) {
    const numMap = new Map();
    
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        
        if (numMap.has(complement)) {
            return [numMap.get(complement), i];
        }
        
        numMap.set(nums[i], i);
    }
    
    return [];
}`,
        explanation: 'Use a hash map to store numbers and their indices. For each number, check if its complement exists in the map.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
      python: {
        code: `def two_sum(nums, target):
    num_map = {}
    
    for i, num in enumerate(nums):
        complement = target - num
        
        if complement in num_map:
            return [num_map[complement], i]
        
        num_map[num] = i
    
    return []`,
        explanation: 'Use a dictionary to store numbers and their indices. For each number, check if its complement exists.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
    },
  },

  {
    id: 'reverse-string',
    title: 'Reverse String',
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.

Example:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]

Constraints:
• 1 ≤ s.length ≤ 10^5
• s[i] is a printable ascii character.`,
    difficulty: 'easy',
    category: 'Two Pointers',
    tags: ['string', 'two-pointers'],
    timeLimit: 10,
    points: 75,
    testCases: [
      {
        id: 'test1',
        name: 'Basic string',
        input: ['h', 'e', 'l', 'l', 'o'],
        expectedOutput: ['o', 'l', 'l', 'e', 'h'],
        isVisible: true,
        weight: 30,
      },
      {
        id: 'test2',
        name: 'Single character',
        input: ['a'],
        expectedOutput: ['a'],
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test3',
        name: 'Even length',
        input: ['A', 'B', 'C', 'D'],
        expectedOutput: ['D', 'C', 'B', 'A'],
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Mixed case',
        input: ['r', 'A', 'c', 'E', 'a', 'C', 'a', 'R'],
        expectedOutput: ['R', 'a', 'C', 'a', 'E', 'c', 'A', 'r'],
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function reverseString(s) {
    // Modify s in-place
    
}`,
      python: `def reverse_string(s):
    # Modify s in-place
    pass`,
      java: `public class Solution {
    public void reverseString(char[] s) {
        // Modify s in-place
        
    }
}`,
      go: `func reverseString(s []byte) {
    // Modify s in-place
    
}`,
    },
    hints: [
      'Use two pointers approach - one at the start, one at the end.',
      'Swap characters and move pointers toward each other.',
      'Continue until the pointers meet in the middle.',
    ],
  },

  {
    id: 'fibonacci-sequence',
    title: 'Fibonacci Number',
    description: `The Fibonacci numbers, commonly denoted F(n), form a sequence such that each number is the sum of the two preceding ones, starting from 0 and 1.

F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1.

Given n, calculate F(n).

Example:
Input: n = 4
Output: 3
Explanation: F(4) = F(3) + F(2) = 2 + 1 = 3.

Constraints:
• 0 ≤ n ≤ 30`,
    difficulty: 'easy',
    category: 'Dynamic Programming',
    tags: ['math', 'dynamic-programming', 'recursion'],
    timeLimit: 15,
    points: 85,
    testCases: [
      {
        id: 'test1',
        name: 'Base cases',
        input: 0,
        expectedOutput: 0,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test2',
        name: 'F(1)',
        input: 1,
        expectedOutput: 1,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test3',
        name: 'Small number',
        input: 4,
        expectedOutput: 3,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Medium number',
        input: 10,
        expectedOutput: 55,
        isVisible: false,
        weight: 20,
      },
      {
        id: 'test5',
        name: 'Large number',
        input: 20,
        expectedOutput: 6765,
        isVisible: false,
        weight: 20,
      },
    ],
    starterCode: {
      javascript: `function fibonacci(n) {
    // Your solution here
    
}`,
      python: `def fibonacci(n):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int fibonacci(int n) {
        // Your solution here
        return 0;
    }
}`,
      go: `func fibonacci(n int) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Consider both recursive and iterative approaches.',
      'For better performance, use dynamic programming to avoid recalculating values.',
      'You can solve this with O(1) space complexity using just two variables.',
    ],
  },

  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    description: `Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

Example:
Input: s = "()"
Output: true

Input: s = "()[]{}"
Output: true

Input: s = "(]"
Output: false

Constraints:
• 1 ≤ s.length ≤ 10^4
• s consists of parentheses only '()[]{}'.`,
    difficulty: 'medium',
    category: 'Stack',
    tags: ['string', 'stack'],
    timeLimit: 20,
    points: 120,
    testCases: [
      {
        id: 'test1',
        name: 'Simple valid',
        input: '()',
        expectedOutput: true,
        isVisible: true,
        weight: 15,
      },
      {
        id: 'test2',
        name: 'Multiple types',
        input: '()[]{}<',
        expectedOutput: true,
        isVisible: true,
        weight: 15,
      },
      {
        id: 'test3',
        name: 'Invalid order',
        input: '(]',
        expectedOutput: false,
        isVisible: true,
        weight: 15,
      },
      {
        id: 'test4',
        name: 'Nested brackets',
        input: '([{}])',
        expectedOutput: true,
        isVisible: false,
        weight: 20,
      },
      {
        id: 'test5',
        name: 'Unmatched opening',
        input: '(((',
        expectedOutput: false,
        isVisible: false,
        weight: 15,
      },
      {
        id: 'test6',
        name: 'Unmatched closing',
        input: ')))',
        expectedOutput: false,
        isVisible: false,
        weight: 20,
      },
    ],
    starterCode: {
      javascript: `function isValid(s) {
    // Your solution here
    
}`,
      python: `def is_valid(s):
    # Your solution here
    pass`,
      java: `public class Solution {
    public boolean isValid(String s) {
        // Your solution here
        return false;
    }
}`,
      go: `func isValid(s string) bool {
    // Your solution here
    return false
}`,
    },
    hints: [
      'Think about using a stack data structure.',
      'When you see an opening bracket, what should you do?',
      'When you see a closing bracket, what should you check?',
      'What should happen if the stack is empty at the end?',
    ],
  },

  {
    id: 'binary-search',
    title: 'Binary Search',
    description: `Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.

You must write an algorithm with O(log n) runtime complexity.

Example:
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4

Constraints:
• 1 ≤ nums.length ≤ 10^4
• -10^4 < nums[i], target < 10^4
• All the integers in nums are unique.
• nums is sorted in ascending order.`,
    difficulty: 'medium',
    category: 'Binary Search',
    tags: ['array', 'binary-search'],
    timeLimit: 20,
    points: 110,
    testCases: [
      {
        id: 'test1',
        name: 'Target found',
        input: { nums: [-1, 0, 3, 5, 9, 12], target: 9 },
        expectedOutput: 4,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'Target not found',
        input: { nums: [-1, 0, 3, 5, 9, 12], target: 2 },
        expectedOutput: -1,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Single element found',
        input: { nums: [5], target: 5 },
        expectedOutput: 0,
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'First element',
        input: { nums: [1, 2, 3, 4, 5], target: 1 },
        expectedOutput: 0,
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function search(nums, target) {
    // Your solution here
    
}`,
      python: `def search(nums, target):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int search(int[] nums, int target) {
        // Your solution here
        return -1;
    }
}`,
      go: `func search(nums []int, target int) int {
    // Your solution here
    return -1
}`,
    },
    hints: [
      'Use two pointers: left and right to define the search space.',
      'Calculate the middle index and compare the middle element with target.',
      'Based on the comparison, eliminate half of the search space.',
      'Continue until you find the target or the search space is empty.',
    ],
  },

  {
    id: 'merge-sorted-arrays',
    title: 'Merge Two Sorted Arrays',
    description: `You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively.

Merge nums1 and nums2 into a single array sorted in non-decreasing order.

Example:
Input: nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3
Output: [1,2,2,3,5,6]

Constraints:
• nums1.length == m + n
• nums2.length == n
• 0 ≤ m, n ≤ 200
• 1 ≤ m + n ≤ 200`,
    difficulty: 'medium',
    category: 'Two Pointers',
    tags: ['array', 'two-pointers', 'sorting'],
    timeLimit: 25,
    points: 130,
    testCases: [
      {
        id: 'test1',
        name: 'Basic merge',
        input: { nums1: [1, 2, 3, 0, 0, 0], m: 3, nums2: [2, 5, 6], n: 3 },
        expectedOutput: [1, 2, 2, 3, 5, 6],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'Empty first array',
        input: { nums1: [0], m: 0, nums2: [1], n: 1 },
        expectedOutput: [1],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Empty second array',
        input: { nums1: [1], m: 1, nums2: [], n: 0 },
        expectedOutput: [1],
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Large arrays',
        input: { nums1: [1, 2, 4, 5, 6, 0, 0, 0], m: 5, nums2: [3, 7, 8], n: 3 },
        expectedOutput: [1, 2, 3, 4, 5, 6, 7, 8],
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function merge(nums1, m, nums2, n) {
    // Modify nums1 in-place
    
}`,
      python: `def merge(nums1, m, nums2, n):
    # Modify nums1 in-place
    pass`,
      java: `public class Solution {
    public void merge(int[] nums1, int m, int[] nums2, int n) {
        // Modify nums1 in-place
        
    }
}`,
      go: `func merge(nums1 []int, m int, nums2 []int, n int) {
    // Modify nums1 in-place
    
}`,
    },
    hints: [
      'Start from the end of both arrays and work backwards.',
      'Compare elements from the end and place the larger one at the end of nums1.',
      'Continue until all elements from nums2 are processed.',
    ],
  },

  {
    id: 'longest-substring-without-repeating',
    title: 'Longest Substring Without Repeating Characters',
    description: `Given a string s, find the length of the longest substring without repeating characters.

Example:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

Constraints:
• 0 ≤ s.length ≤ 5 * 10^4
• s consists of English letters, digits, symbols and spaces.`,
    difficulty: 'hard',
    category: 'Sliding Window',
    tags: ['string', 'hash-table', 'sliding-window'],
    timeLimit: 30,
    points: 150,
    testCases: [
      {
        id: 'test1',
        name: 'Mixed characters',
        input: 'abcabcbb',
        expectedOutput: 3,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test2',
        name: 'All same characters',
        input: 'bbbbb',
        expectedOutput: 1,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test3',
        name: 'Empty string',
        input: '',
        expectedOutput: 0,
        isVisible: true,
        weight: 15,
      },
      {
        id: 'test4',
        name: 'Complex pattern',
        input: 'pwwkew',
        expectedOutput: 3,
        isVisible: false,
        weight: 20,
      },
      {
        id: 'test5',
        name: 'Long string',
        input: 'abcdefghijklmnopqrstuvwxyz',
        expectedOutput: 26,
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
    // Your solution here
    
}`,
      python: `def length_of_longest_substring(s):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
        return 0;
    }
}`,
      go: `func lengthOfLongestSubstring(s string) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Use the sliding window technique with two pointers.',
      'Keep track of characters in the current window using a hash set.',
      'When you encounter a duplicate, move the left pointer.',
      'Update the maximum length as you go.',
    ],
  },

  {
    id: 'product-of-array-except-self',
    title: 'Product of Array Except Self',
    description: `Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].

The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.

You must write an algorithm that runs in O(n) time and without using the division operation.

Example:
Input: nums = [1,2,3,4]
Output: [24,12,8,6]

Constraints:
• 2 ≤ nums.length ≤ 10^5
• -30 ≤ nums[i] ≤ 30`,
    difficulty: 'medium',
    category: 'Arrays & Hashing',
    tags: ['array', 'prefix-sum'],
    timeLimit: 25,
    points: 125,
    testCases: [
      {
        id: 'test1',
        name: 'Basic case',
        input: [1, 2, 3, 4],
        expectedOutput: [24, 12, 8, 6],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'With zeros',
        input: [0, 1, 2, 3],
        expectedOutput: [6, 0, 0, 0],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Multiple zeros',
        input: [0, 0, 2, 3],
        expectedOutput: [0, 0, 0, 0],
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Negative numbers',
        input: [-1, 2, -3, 4],
        expectedOutput: [-24, 12, -8, 6],
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function productExceptSelf(nums) {
    // Your solution here
    
}`,
      python: `def product_except_self(nums):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int[] productExceptSelf(int[] nums) {
        // Your solution here
        return new int[0];
    }
}`,
      go: `func productExceptSelf(nums []int) []int {
    // Your solution here
    return []int{}
}`,
    },
    hints: [
      'Think about prefix and suffix products.',
      'You can calculate left products and right products separately.',
      'Try to do it in two passes through the array.',
      'Can you optimize space by using the output array for intermediate results?',
    ],
  },

  // Arrays & Hashing Problems
  {
    id: 'contains-duplicate',
    title: 'Contains Duplicate',
    description: `Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.

Example 1:
Input: nums = [1,2,3,1]
Output: true

Example 2:
Input: nums = [1,2,3,4]
Output: false

Example 3:
Input: nums = [1,1,1,3,3,4,3,2,4,2]
Output: true

Constraints:
• 1 ≤ nums.length ≤ 10^5
• -10^9 ≤ nums[i] ≤ 10^9`,
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    tags: ['array', 'hash-table'],
    timeLimit: 10,
    points: 75,
    testCases: [
      {
        id: 'test1',
        name: 'Contains duplicate',
        input: [1, 2, 3, 1],
        expectedOutput: true,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'No duplicates',
        input: [1, 2, 3, 4],
        expectedOutput: false,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Multiple duplicates',
        input: [1, 1, 1, 3, 3, 4, 3, 2, 4, 2],
        expectedOutput: true,
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Single element',
        input: [1],
        expectedOutput: false,
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function containsDuplicate(nums) {
    // Your solution here
    
}`,
      python: `def contains_duplicate(nums):
    # Your solution here
    pass`,
      java: `public class Solution {
    public boolean containsDuplicate(int[] nums) {
        // Your solution here
        return false;
    }
}`,
      go: `func containsDuplicate(nums []int) bool {
    // Your solution here
    return false
}`,
    },
    hints: [
      'Think about what data structure can help you track seen elements.',
      'A hash set is perfect for checking if an element has been seen before.',
      'Iterate through the array and check if each element is already in your set.',
    ],
    solution: {
      javascript: {
        code: `function containsDuplicate(nums) {
    const seen = new Set();
    
    for (const num of nums) {
        if (seen.has(num)) {
            return true;
        }
        seen.add(num);
    }
    
    return false;
}`,
        explanation: 'Use a hash set to track seen numbers. Return true if we encounter a number already in the set.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
      python: {
        code: `def contains_duplicate(nums):
    seen = set()
    
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    
    return False`,
        explanation: 'Use a set to track seen numbers. Return True if we encounter a number already in the set.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
    },
  },

  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    description: `Given two strings s and t, return true if t is an anagram of s, and false otherwise.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

Example 1:
Input: s = "anagram", t = "nagaram"
Output: true

Example 2:
Input: s = "rat", t = "car"
Output: false

Constraints:
• 1 ≤ s.length, t.length ≤ 5 * 10^4
• s and t consist of lowercase English letters.`,
    difficulty: 'easy',
    category: 'Arrays & Hashing',
    tags: ['string', 'hash-table', 'sorting'],
    timeLimit: 12,
    points: 80,
    testCases: [
      {
        id: 'test1',
        name: 'Valid anagram',
        input: { s: 'anagram', t: 'nagaram' },
        expectedOutput: true,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'Not anagram',
        input: { s: 'rat', t: 'car' },
        expectedOutput: false,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Different lengths',
        input: { s: 'hello', t: 'bello' },
        expectedOutput: false,
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Single character',
        input: { s: 'a', t: 'a' },
        expectedOutput: true,
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function isAnagram(s, t) {
    // Your solution here
    
}`,
      python: `def is_anagram(s, t):
    # Your solution here
    pass`,
      java: `public class Solution {
    public boolean isAnagram(String s, String t) {
        // Your solution here
        return false;
    }
}`,
      go: `func isAnagram(s string, t string) bool {
    // Your solution here
    return false
}`,
    },
    hints: [
      'If the lengths are different, they cannot be anagrams.',
      'Count the frequency of each character in both strings.',
      'Compare the character frequencies - they should be identical.',
      'Alternatively, you could sort both strings and compare them.',
    ],
    solution: {
      javascript: {
        code: `function isAnagram(s, t) {
    if (s.length !== t.length) return false;
    
    const count = {};
    
    // Count characters in s
    for (const char of s) {
        count[char] = (count[char] || 0) + 1;
    }
    
    // Subtract characters in t
    for (const char of t) {
        if (!count[char]) return false;
        count[char]--;
    }
    
    return true;
}`,
        explanation: 'Count character frequencies and ensure both strings have identical character counts.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1) - at most 26 lowercase letters',
      },
      python: {
        code: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    
    from collections import Counter
    return Counter(s) == Counter(t)`,
        explanation: 'Use Counter to compare character frequencies between the two strings.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1) - at most 26 lowercase letters',
      },
    },
  },

  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    description: `Given an array of strings strs, group the anagrams together. You can return the answer in any order.

An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

Example:
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

Constraints:
• 1 ≤ strs.length ≤ 10^4
• 0 ≤ strs[i].length ≤ 100
• strs[i] consists of lowercase English letters.`,
    difficulty: 'medium',
    category: 'Arrays & Hashing',
    tags: ['array', 'hash-table', 'string', 'sorting'],
    timeLimit: 20,
    points: 120,
    testCases: [
      {
        id: 'test1',
        name: 'Basic grouping',
        input: ['eat', 'tea', 'tan', 'ate', 'nat', 'bat'],
        expectedOutput: [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']],
        isVisible: true,
        weight: 30,
      },
      {
        id: 'test2',
        name: 'Empty string',
        input: [''],
        expectedOutput: [['']],
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test3',
        name: 'Single character',
        input: ['a'],
        expectedOutput: [['a']],
        isVisible: false,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'All different',
        input: ['abc', 'def', 'ghi'],
        expectedOutput: [['abc'], ['def'], ['ghi']],
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `function groupAnagrams(strs) {
    // Your solution here
    
}`,
      python: `def group_anagrams(strs):
    # Your solution here
    pass`,
      java: `public class Solution {
    public List<List<String>> groupAnagrams(String[] strs) {
        // Your solution here
        return new ArrayList<>();
    }
}`,
      go: `func groupAnagrams(strs []string) [][]string {
    // Your solution here
    return [][]string{}
}`,
    },
    hints: [
      'Think about what makes two strings anagrams - they have the same characters.',
      'You can use sorted strings as keys to group anagrams.',
      'Use a hash map where the key is the sorted string and value is the list of anagrams.',
      'Alternatively, you could use character frequency as the key.',
    ],
    solution: {
      javascript: {
        code: `function groupAnagrams(strs) {
    const groups = new Map();
    
    for (const str of strs) {
        const key = str.split('').sort().join('');
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(str);
    }
    
    return Array.from(groups.values());
}`,
        explanation: 'Sort each string to create a key, then group strings with the same sorted key.',
        timeComplexity: 'O(n * m * log m) where n is array length, m is average string length',
        spaceComplexity: 'O(n * m)',
      },
      python: {
        code: `def group_anagrams(strs):
    from collections import defaultdict
    
    groups = defaultdict(list)
    
    for s in strs:
        key = ''.join(sorted(s))
        groups[key].append(s)
    
    return list(groups.values())`,
        explanation: 'Use sorted string as key to group anagrams in a dictionary.',
        timeComplexity: 'O(n * m * log m) where n is array length, m is average string length',
        spaceComplexity: 'O(n * m)',
      },
    },
  },

  // Two Pointers Problems
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string s, return true if it is a palindrome, or false otherwise.

Example 1:
Input: s = "A man, a plan, a canal: Panama"
Output: true
Explanation: "amanaplanacanalpanama" is a palindrome.

Example 2:
Input: s = "race a car"
Output: false
Explanation: "raceacar" is not a palindrome.

Example 3:
Input: s = " "
Output: true
Explanation: s is an empty string "" after removing non-alphanumeric characters.

Constraints:
• 1 ≤ s.length ≤ 2 * 10^5
• s consists only of printable ASCII characters.`,
    difficulty: 'easy',
    category: 'Two Pointers',
    tags: ['two-pointers', 'string'],
    timeLimit: 15,
    points: 90,
    testCases: [
      {
        id: 'test1',
        name: 'Valid palindrome with punctuation',
        input: 'A man, a plan, a canal: Panama',
        expectedOutput: true,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'Not a palindrome',
        input: 'race a car',
        expectedOutput: false,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Empty after cleanup',
        input: ' ',
        expectedOutput: true,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Mixed alphanumeric',
        input: 'A Santa at NASA',
        expectedOutput: true,
        isVisible: false,
        weight: 30,
      },
    ],
    starterCode: {
      javascript: `function isPalindrome(s) {
    // Your solution here
    
}`,
      python: `def is_palindrome(s):
    # Your solution here
    pass`,
      java: `public class Solution {
    public boolean isPalindrome(String s) {
        // Your solution here
        return false;
    }
}`,
      go: `func isPalindrome(s string) bool {
    // Your solution here
    return false
}`,
    },
    hints: [
      'First, normalize the string by removing non-alphanumeric characters and converting to lowercase.',
      'Use two pointers - one at the start and one at the end.',
      'Compare characters and move pointers toward each other.',
      'You can also do the normalization on-the-fly as you compare.',
    ],
    solution: {
      javascript: {
        code: `function isPalindrome(s) {
    let left = 0, right = s.length - 1;
    
    while (left < right) {
        // Skip non-alphanumeric characters from left
        while (left < right && !isAlphanumeric(s[left])) {
            left++;
        }
        
        // Skip non-alphanumeric characters from right
        while (left < right && !isAlphanumeric(s[right])) {
            right--;
        }
        
        // Compare characters (case insensitive)
        if (s[left].toLowerCase() !== s[right].toLowerCase()) {
            return false;
        }
        
        left++;
        right--;
    }
    
    return true;
}

function isAlphanumeric(char) {
    return /[a-zA-Z0-9]/.test(char);
}`,
        explanation: 'Use two pointers to compare characters while skipping non-alphanumeric ones.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
      python: {
        code: `def is_palindrome(s):
    left, right = 0, len(s) - 1
    
    while left < right:
        # Skip non-alphanumeric from left
        while left < right and not s[left].isalnum():
            left += 1
        
        # Skip non-alphanumeric from right
        while left < right and not s[right].isalnum():
            right -= 1
        
        # Compare characters (case insensitive)
        if s[left].lower() != s[right].lower():
            return False
        
        left += 1
        right -= 1
    
    return True`,
        explanation: 'Use two pointers to compare valid characters while skipping invalid ones.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
    },
  },

  {
    id: 'three-sum',
    title: '3Sum',
    description: `Given an integer array nums, return all the triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.

Notice that the solution set must not contain duplicate triplets.

Example 1:
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]
Explanation: 
nums[0] + nums[1] + nums[1] = (-1) + 0 + 1 = 0.
nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0.
The distinct triplets are [-1,0,1] and [-1,-1,2].

Example 2:
Input: nums = [0,1,1]
Output: []
Explanation: The only possible triplet does not sum up to 0.

Example 3:
Input: nums = [0,0,0]
Output: [[0,0,0]]
Explanation: The only possible triplet sums up to 0.

Constraints:
• 3 ≤ nums.length ≤ 3000
• -10^5 ≤ nums[i] ≤ 10^5`,
    difficulty: 'medium',
    category: 'Two Pointers',
    tags: ['array', 'two-pointers', 'sorting'],
    timeLimit: 25,
    points: 140,
    testCases: [
      {
        id: 'test1',
        name: 'Basic case',
        input: [-1, 0, 1, 2, -1, -4],
        expectedOutput: [[-1, -1, 2], [-1, 0, 1]],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'No valid triplets',
        input: [0, 1, 1],
        expectedOutput: [],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'All zeros',
        input: [0, 0, 0],
        expectedOutput: [[0, 0, 0]],
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Multiple solutions',
        input: [-2, 0, 1, 1, 2],
        expectedOutput: [[-2, 0, 2], [-2, 1, 1]],
        isVisible: false,
        weight: 30,
      },
    ],
    starterCode: {
      javascript: `function threeSum(nums) {
    // Your solution here
    
}`,
      python: `def three_sum(nums):
    # Your solution here
    pass`,
      java: `public class Solution {
    public List<List<Integer>> threeSum(int[] nums) {
        // Your solution here
        return new ArrayList<>();
    }
}`,
      go: `func threeSum(nums []int) [][]int {
    // Your solution here
    return [][]int{}
}`,
    },
    hints: [
      'Sort the array first to make it easier to avoid duplicates and use two pointers.',
      'For each element, use two pointers to find pairs that sum to the negative of that element.',
      'Skip duplicate values to avoid duplicate triplets.',
      'The two pointers should move from opposite ends toward each other.',
    ],
    solution: {
      javascript: {
        code: `function threeSum(nums) {
    nums.sort((a, b) => a - b);
    const result = [];
    
    for (let i = 0; i < nums.length - 2; i++) {
        // Skip duplicates for first element
        if (i > 0 && nums[i] === nums[i - 1]) continue;
        
        let left = i + 1, right = nums.length - 1;
        
        while (left < right) {
            const sum = nums[i] + nums[left] + nums[right];
            
            if (sum === 0) {
                result.push([nums[i], nums[left], nums[right]]);
                
                // Skip duplicates for second and third elements
                while (left < right && nums[left] === nums[left + 1]) left++;
                while (left < right && nums[right] === nums[right - 1]) right--;
                
                left++;
                right--;
            } else if (sum < 0) {
                left++;
            } else {
                right--;
            }
        }
    }
    
    return result;
}`,
        explanation: 'Sort array, then use three pointers with duplicate skipping to find all unique triplets.',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1) excluding output array',
      },
      python: {
        code: `def three_sum(nums):
    nums.sort()
    result = []
    
    for i in range(len(nums) - 2):
        # Skip duplicates for first element
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        
        left, right = i + 1, len(nums) - 1
        
        while left < right:
            total = nums[i] + nums[left] + nums[right]
            
            if total == 0:
                result.append([nums[i], nums[left], nums[right]])
                
                # Skip duplicates for second and third elements
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                
                left += 1
                right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1
    
    return result`,
        explanation: 'Sort array first, then use three pointers to find unique triplets that sum to zero.',
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(1) excluding output array',
      },
    },
  },

  // Sliding Window Problems
  {
    id: 'best-time-to-buy-and-sell-stock',
    title: 'Best Time to Buy and Sell Stock',
    description: `You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Example 1:
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.

Example 2:
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.

Constraints:
• 1 ≤ prices.length ≤ 10^5
• 0 ≤ prices[i] ≤ 10^4`,
    difficulty: 'easy',
    category: 'Sliding Window',
    tags: ['array', 'dynamic-programming'],
    timeLimit: 15,
    points: 85,
    testCases: [
      {
        id: 'test1',
        name: 'Profitable case',
        input: [7, 1, 5, 3, 6, 4],
        expectedOutput: 5,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'Decreasing prices',
        input: [7, 6, 4, 3, 1],
        expectedOutput: 0,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Single day',
        input: [1],
        expectedOutput: 0,
        isVisible: false,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Increasing prices',
        input: [1, 2, 3, 4, 5],
        expectedOutput: 4,
        isVisible: false,
        weight: 30,
      },
    ],
    starterCode: {
      javascript: `function maxProfit(prices) {
    // Your solution here
    
}`,
      python: `def max_profit(prices):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int maxProfit(int[] prices) {
        // Your solution here
        return 0;
    }
}`,
      go: `func maxProfit(prices []int) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Think about keeping track of the minimum price seen so far.',
      'For each day, calculate the profit if you sold on that day.',
      'Keep track of the maximum profit seen so far.',
      'You only need one pass through the array.',
    ],
    solution: {
      javascript: {
        code: `function maxProfit(prices) {
    let minPrice = prices[0];
    let maxProfit = 0;
    
    for (let i = 1; i < prices.length; i++) {
        if (prices[i] < minPrice) {
            minPrice = prices[i];
        } else if (prices[i] - minPrice > maxProfit) {
            maxProfit = prices[i] - minPrice;
        }
    }
    
    return maxProfit;
}`,
        explanation: 'Track the minimum price and maximum profit, updating both as we iterate.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
      python: {
        code: `def max_profit(prices):
    min_price = prices[0]
    max_profit = 0
    
    for price in prices[1:]:
        if price < min_price:
            min_price = price
        elif price - min_price > max_profit:
            max_profit = price - min_price
    
    return max_profit`,
        explanation: 'Keep track of minimum price and maximum profit in a single pass.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
    },
  },

  {
    id: 'longest-substring-without-repeating-chars',
    title: 'Longest Substring Without Repeating Characters',
    description: `Given a string s, find the length of the longest substring without repeating characters.

Example 1:
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.

Example 2:
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.

Example 3:
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.

Constraints:
• 0 ≤ s.length ≤ 5 * 10^4
• s consists of English letters, digits, symbols and spaces.`,
    difficulty: 'medium',
    category: 'Sliding Window',
    tags: ['hash-table', 'string', 'sliding-window'],
    timeLimit: 20,
    points: 125,
    testCases: [
      {
        id: 'test1',
        name: 'Mixed characters',
        input: 'abcabcbb',
        expectedOutput: 3,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'All same character',
        input: 'bbbbb',
        expectedOutput: 1,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test3',
        name: 'Complex pattern',
        input: 'pwwkew',
        expectedOutput: 3,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test4',
        name: 'Empty string',
        input: '',
        expectedOutput: 0,
        isVisible: false,
        weight: 15,
      },
      {
        id: 'test5',
        name: 'All unique',
        input: 'abcdef',
        expectedOutput: 6,
        isVisible: false,
        weight: 15,
      },
    ],
    starterCode: {
      javascript: `function lengthOfLongestSubstring(s) {
    // Your solution here
    
}`,
      python: `def length_of_longest_substring(s):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Your solution here
        return 0;
    }
}`,
      go: `func lengthOfLongestSubstring(s string) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Use the sliding window technique with two pointers.',
      'Keep track of characters in the current window using a hash set.',
      'When you encounter a duplicate, shrink the window from the left.',
      'Update the maximum length as you expand and shrink the window.',
    ],
    solution: {
      javascript: {
        code: `function lengthOfLongestSubstring(s) {
    const charSet = new Set();
    let left = 0;
    let maxLength = 0;
    
    for (let right = 0; right < s.length; right++) {
        // Shrink window until no duplicates
        while (charSet.has(s[right])) {
            charSet.delete(s[left]);
            left++;
        }
        
        charSet.add(s[right]);
        maxLength = Math.max(maxLength, right - left + 1);
    }
    
    return maxLength;
}`,
        explanation: 'Use sliding window with a set to track characters. Shrink window when duplicates found.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(min(m, n)) where m is character set size',
      },
      python: {
        code: `def length_of_longest_substring(s):
    char_set = set()
    left = 0
    max_length = 0
    
    for right in range(len(s)):
        # Shrink window until no duplicates
        while s[right] in char_set:
            char_set.remove(s[left])
            left += 1
        
        char_set.add(s[right])
        max_length = max(max_length, right - left + 1)
    
    return max_length`,
        explanation: 'Use sliding window technique with a set to maintain substring without duplicates.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(min(m, n)) where m is character set size',
      },
    },
  },

  // Stack Problems
  {
    id: 'min-stack',
    title: 'Min Stack',
    description: `Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Implement the MinStack class:
• MinStack() initializes the stack object.
• void push(int val) pushes the element val onto the stack.
• void pop() removes the element on the top of the stack.
• int top() gets the top element of the stack.
• int getMin() retrieves the minimum element in the stack.

You must implement a solution with O(1) time complexity for each function.

Example:
Input: ["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]

Output: [null,null,null,null,-3,null,0,-2]

Explanation:
MinStack minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
minStack.getMin(); // return -3
minStack.pop();
minStack.top();    // return 0
minStack.getMin(); // return -2

Constraints:
• -2^31 ≤ val ≤ 2^31 - 1
• Methods pop, top and getMin operations will always be called on non-empty stacks.
• At most 3 * 10^4 calls will be made to push, pop, top, and getMin.`,
    difficulty: 'medium',
    category: 'Stack',
    tags: ['stack', 'design'],
    timeLimit: 25,
    points: 130,
    testCases: [
      {
        id: 'test1',
        name: 'Basic operations',
        input: {
          operations: ['MinStack', 'push', 'push', 'push', 'getMin', 'pop', 'top', 'getMin'],
          values: [[], [-2], [0], [-3], [], [], [], []]
        },
        expectedOutput: [null, null, null, null, -3, null, 0, -2],
        isVisible: true,
        weight: 40,
      },
      {
        id: 'test2',
        name: 'Single element',
        input: {
          operations: ['MinStack', 'push', 'getMin', 'top'],
          values: [[], [1], [], []]
        },
        expectedOutput: [null, null, 1, 1],
        isVisible: true,
        weight: 30,
      },
      {
        id: 'test3',
        name: 'Duplicates',
        input: {
          operations: ['MinStack', 'push', 'push', 'getMin', 'getMin'],
          values: [[], [2], [2], [], []]
        },
        expectedOutput: [null, null, null, 2, 2],
        isVisible: false,
        weight: 30,
      },
    ],
    starterCode: {
      javascript: `class MinStack {
    constructor() {
        // Your implementation here
    }
    
    push(val) {
        // Your implementation here
    }
    
    pop() {
        // Your implementation here
    }
    
    top() {
        // Your implementation here
    }
    
    getMin() {
        // Your implementation here
    }
}`,
      python: `class MinStack:
    def __init__(self):
        # Your implementation here
        pass
    
    def push(self, val):
        # Your implementation here
        pass
    
    def pop(self):
        # Your implementation here
        pass
    
    def top(self):
        # Your implementation here
        pass
    
    def get_min(self):
        # Your implementation here
        pass`,
      java: `public class MinStack {
    public MinStack() {
        // Your implementation here
    }
    
    public void push(int val) {
        // Your implementation here
    }
    
    public void pop() {
        // Your implementation here
    }
    
    public int top() {
        // Your implementation here
    }
    
    public int getMin() {
        // Your implementation here
    }
}`,
      go: `type MinStack struct {
    // Your implementation here
}

func Constructor() MinStack {
    // Your implementation here
    return MinStack{}
}

func (this *MinStack) Push(val int) {
    // Your implementation here
}

func (this *MinStack) Pop() {
    // Your implementation here
}

func (this *MinStack) Top() int {
    // Your implementation here
    return 0
}

func (this *MinStack) GetMin() int {
    // Your implementation here
    return 0
}`,
    },
    hints: [
      'Consider using two stacks - one for the actual values and one for minimums.',
      'The minimum stack should keep track of the minimum at each level.',
      'When pushing, compare with the current minimum and push accordingly.',
      'When popping, make sure to pop from both stacks when necessary.',
    ],
    solution: {
      javascript: {
        code: `class MinStack {
    constructor() {
        this.stack = [];
        this.minStack = [];
    }
    
    push(val) {
        this.stack.push(val);
        // Push to minStack if it's empty or val is <= current minimum
        if (this.minStack.length === 0 || val <= this.minStack[this.minStack.length - 1]) {
            this.minStack.push(val);
        }
    }
    
    pop() {
        const popped = this.stack.pop();
        // If we're popping the minimum, pop from minStack too
        if (popped === this.minStack[this.minStack.length - 1]) {
            this.minStack.pop();
        }
    }
    
    top() {
        return this.stack[this.stack.length - 1];
    }
    
    getMin() {
        return this.minStack[this.minStack.length - 1];
    }
}`,
        explanation: 'Use two stacks: one for values and one to track minimums at each level.',
        timeComplexity: 'O(1) for all operations',
        spaceComplexity: 'O(n)',
      },
      python: {
        code: `class MinStack:
    def __init__(self):
        self.stack = []
        self.min_stack = []
    
    def push(self, val):
        self.stack.append(val)
        # Push to min_stack if it's empty or val is <= current minimum
        if not self.min_stack or val <= self.min_stack[-1]:
            self.min_stack.append(val)
    
    def pop(self):
        popped = self.stack.pop()
        # If we're popping the minimum, pop from min_stack too
        if popped == self.min_stack[-1]:
            self.min_stack.pop()
    
    def top(self):
        return self.stack[-1]
    
    def get_min(self):
        return self.min_stack[-1]`,
        explanation: 'Maintain two stacks to track values and minimums efficiently.',
        timeComplexity: 'O(1) for all operations',
        spaceComplexity: 'O(n)',
      },
    },
  },

  {
    id: 'evaluate-reverse-polish-notation',
    title: 'Evaluate Reverse Polish Notation',
    description: `Evaluate the value of an arithmetic expression in Reverse Polish Notation.

Valid operators are +, -, *, and /. Each operand may be an integer or another expression.

Note that division between two integers should truncate toward zero.

It is guaranteed that the given RPN expression is always valid. That means the expression would always evaluate to a result, and there will not be any division by zero operation.

Example 1:
Input: tokens = ["2","1","+","3","*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9

Example 2:
Input: tokens = ["4","13","5","/","+"]
Output: 6
Explanation: (4 + (13 / 5)) = 6

Example 3:
Input: tokens = ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]
Output: 22

Constraints:
• 1 ≤ tokens.length ≤ 10^4
• Each tokens[i] is either an operator: "+", "-", "*", or "/", or an integer in the range [-200, 200].`,
    difficulty: 'medium',
    category: 'Stack',
    tags: ['array', 'math', 'stack'],
    timeLimit: 20,
    points: 120,
    testCases: [
      {
        id: 'test1',
        name: 'Simple expression',
        input: ['2', '1', '+', '3', '*'],
        expectedOutput: 9,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'With division',
        input: ['4', '13', '5', '/', '+'],
        expectedOutput: 6,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Complex expression',
        input: ['10', '6', '9', '3', '+', '-11', '*', '/', '*', '17', '+', '5', '+'],
        expectedOutput: 22,
        isVisible: false,
        weight: 30,
      },
      {
        id: 'test4',
        name: 'Single number',
        input: ['18'],
        expectedOutput: 18,
        isVisible: false,
        weight: 20,
      },
    ],
    starterCode: {
      javascript: `function evalRPN(tokens) {
    // Your solution here
    
}`,
      python: `def eval_rpn(tokens):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int evalRPN(String[] tokens) {
        // Your solution here
        return 0;
    }
}`,
      go: `func evalRPN(tokens []string) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Use a stack to store operands.',
      'When you encounter a number, push it onto the stack.',
      'When you encounter an operator, pop two operands and apply the operation.',
      'Push the result back onto the stack.',
      'The final result will be the only element left in the stack.',
    ],
    solution: {
      javascript: {
        code: `function evalRPN(tokens) {
    const stack = [];
    const operators = new Set(['+', '-', '*', '/']);
    
    for (const token of tokens) {
        if (operators.has(token)) {
            const b = stack.pop();
            const a = stack.pop();
            
            let result;
            switch (token) {
                case '+': result = a + b; break;
                case '-': result = a - b; break;
                case '*': result = a * b; break;
                case '/': result = Math.trunc(a / b); break;
            }
            stack.push(result);
        } else {
            stack.push(parseInt(token));
        }
    }
    
    return stack[0];
}`,
        explanation: 'Use a stack to evaluate RPN. Push numbers, pop and calculate for operators.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
      python: {
        code: `def eval_rpn(tokens):
    stack = []
    operators = {'+', '-', '*', '/'}
    
    for token in tokens:
        if token in operators:
            b = stack.pop()
            a = stack.pop()
            
            if token == '+':
                result = a + b
            elif token == '-':
                result = a - b
            elif token == '*':
                result = a * b
            else:  # token == '/'
                # Truncate toward zero
                result = int(a / b)
            
            stack.append(result)
        else:
            stack.append(int(token))
    
    return stack[0]`,
        explanation: 'Use stack for RPN evaluation. Handle division truncation toward zero.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(n)',
      },
    },
  },

  // Binary Search Problem
  {
    id: 'find-minimum-in-rotated-sorted-array',
    title: 'Find Minimum in Rotated Sorted Array',
    description: `Suppose an array of length n sorted in ascending order is rotated between 1 and n times. For example, the array nums = [0,1,2,4,5,6,7] might become:

• [4,5,6,7,0,1,2] if it was rotated 4 times.
• [0,1,2,4,5,6,7] if it was rotated 7 times.

Notice that rotating an array [a[0], a[1], a[2], ..., a[n-1]] 1 time results in the array [a[n-1], a[0], a[1], a[2], ..., a[n-2]].

Given the sorted rotated array nums of unique elements, return the minimum element of this array.

You must write an algorithm that runs in O(log n) time.

Example 1:
Input: nums = [3,4,5,1,2]
Output: 1

Example 2:
Input: nums = [4,5,6,7,0,1,2]
Output: 0

Example 3:
Input: nums = [11,13,15,17]
Output: 11

Constraints:
• n == nums.length
• 1 ≤ n ≤ 5000
• -5000 ≤ nums[i] ≤ 5000
• All the integers of nums are unique.
• nums is sorted and rotated between 1 and n times.`,
    difficulty: 'medium',
    category: 'Binary Search',
    tags: ['array', 'binary-search'],
    timeLimit: 20,
    points: 125,
    testCases: [
      {
        id: 'test1',
        name: 'Rotated array',
        input: [3, 4, 5, 1, 2],
        expectedOutput: 1,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test2',
        name: 'More rotation',
        input: [4, 5, 6, 7, 0, 1, 2],
        expectedOutput: 0,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'No rotation',
        input: [11, 13, 15, 17],
        expectedOutput: 11,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Single element',
        input: [1],
        expectedOutput: 1,
        isVisible: false,
        weight: 15,
      },
      {
        id: 'test5',
        name: 'Two elements',
        input: [2, 1],
        expectedOutput: 1,
        isVisible: false,
        weight: 15,
      },
    ],
    starterCode: {
      javascript: `function findMin(nums) {
    // Your solution here
    
}`,
      python: `def find_min(nums):
    # Your solution here
    pass`,
      java: `public class Solution {
    public int findMin(int[] nums) {
        // Your solution here
        return 0;
    }
}`,
      go: `func findMin(nums []int) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Use binary search, but the condition is different from regular binary search.',
      'Compare the middle element with the rightmost element.',
      'If nums[mid] > nums[right], the minimum is in the right half.',
      'If nums[mid] < nums[right], the minimum is in the left half (including mid).',
      'Continue until left == right.',
    ],
    solution: {
      javascript: {
        code: `function findMin(nums) {
    let left = 0, right = nums.length - 1;
    
    while (left < right) {
        const mid = Math.floor((left + right) / 2);
        
        if (nums[mid] > nums[right]) {
            // Minimum is in the right half
            left = mid + 1;
        } else {
            // Minimum is in the left half (including mid)
            right = mid;
        }
    }
    
    return nums[left];
}`,
        explanation: 'Use binary search, comparing middle with rightmost to determine which half contains minimum.',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
      },
      python: {
        code: `def find_min(nums):
    left, right = 0, len(nums) - 1
    
    while left < right:
        mid = (left + right) // 2
        
        if nums[mid] > nums[right]:
            # Minimum is in the right half
            left = mid + 1
        else:
            # Minimum is in the left half (including mid)
            right = mid
    
    return nums[left]`,
        explanation: 'Binary search with comparison to rightmost element to find rotation point.',
        timeComplexity: 'O(log n)',
        spaceComplexity: 'O(1)',
      },
    },
  },

  // Linked Lists Problem
  {
    id: 'reverse-linked-list',
    title: 'Reverse Linked List',
    description: `Given the head of a singly linked list, reverse the list, and return the reversed list.

Example 1:
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]

Example 2:
Input: head = [1,2]
Output: [2,1]

Example 3:
Input: head = []
Output: []

Constraints:
• The number of nodes in the list is the range [0, 5000].
• -5000 ≤ Node.val ≤ 5000

Follow up: A linked list can be reversed either iteratively or recursively. Could you implement both?`,
    difficulty: 'easy',
    category: 'Linked Lists',
    tags: ['linked-list', 'recursion'],
    timeLimit: 15,
    points: 90,
    testCases: [
      {
        id: 'test1',
        name: 'Multiple nodes',
        input: [1, 2, 3, 4, 5],
        expectedOutput: [5, 4, 3, 2, 1],
        isVisible: true,
        weight: 30,
      },
      {
        id: 'test2',
        name: 'Two nodes',
        input: [1, 2],
        expectedOutput: [2, 1],
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Empty list',
        input: [],
        expectedOutput: [],
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Single node',
        input: [1],
        expectedOutput: [1],
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `// Definition for singly-linked list.
function ListNode(val, next) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
}

function reverseList(head) {
    // Your solution here
    
}`,
      python: `# Definition for singly-linked list.
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def reverse_list(head):
    # Your solution here
    pass`,
      java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
public class Solution {
    public ListNode reverseList(ListNode head) {
        // Your solution here
        return null;
    }
}`,
      go: `/**
 * Definition for singly-linked list.
 * type ListNode struct {
 *     Val int
 *     Next *ListNode
 * }
 */
func reverseList(head *ListNode) *ListNode {
    // Your solution here
    return nil
}`,
    },
    hints: [
      'Think about what information you need to keep track of as you traverse the list.',
      'You need to change the direction of the links.',
      'Consider using three pointers: previous, current, and next.',
      'What should be the new head of the reversed list?',
    ],
    solution: {
      javascript: {
        code: `function reverseList(head) {
    let prev = null;
    let current = head;
    
    while (current !== null) {
        const next = current.next;
        current.next = prev;
        prev = current;
        current = next;
    }
    
    return prev;
}`,
        explanation: 'Use three pointers to iteratively reverse the links between nodes.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
      python: {
        code: `def reverse_list(head):
    prev = None
    current = head
    
    while current:
        next_node = current.next
        current.next = prev
        prev = current
        current = next_node
    
    return prev`,
        explanation: 'Iteratively reverse pointers using three variables to track nodes.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
      },
    },
  },

  // Trees Problem
  {
    id: 'maximum-depth-of-binary-tree',
    title: 'Maximum Depth of Binary Tree',
    description: `Given the root of a binary tree, return its maximum depth.

A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

Example 1:
Input: root = [3,9,20,null,null,15,7]
Output: 3

Example 2:
Input: root = [1,null,2]
Output: 2

Constraints:
• The number of nodes in the tree is in the range [0, 10^4].
• -100 ≤ Node.val ≤ 100`,
    difficulty: 'easy',
    category: 'Trees',
    tags: ['tree', 'depth-first-search', 'recursion', 'binary-tree'],
    timeLimit: 15,
    points: 85,
    testCases: [
      {
        id: 'test1',
        name: 'Balanced tree',
        input: [3, 9, 20, null, null, 15, 7],
        expectedOutput: 3,
        isVisible: true,
        weight: 30,
      },
      {
        id: 'test2',
        name: 'Right skewed',
        input: [1, null, 2],
        expectedOutput: 2,
        isVisible: true,
        weight: 25,
      },
      {
        id: 'test3',
        name: 'Empty tree',
        input: [],
        expectedOutput: 0,
        isVisible: true,
        weight: 20,
      },
      {
        id: 'test4',
        name: 'Single node',
        input: [0],
        expectedOutput: 1,
        isVisible: false,
        weight: 25,
      },
    ],
    starterCode: {
      javascript: `// Definition for a binary tree node.
function TreeNode(val, left, right) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
}

function maxDepth(root) {
    // Your solution here
    
}`,
      python: `# Definition for a binary tree node.
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

def max_depth(root):
    # Your solution here
    pass`,
      java: `/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */
public class Solution {
    public int maxDepth(TreeNode root) {
        // Your solution here
        return 0;
    }
}`,
      go: `/**
 * Definition for a binary tree node.
 * type TreeNode struct {
 *     Val int
 *     Left *TreeNode
 *     Right *TreeNode
 * }
 */
func maxDepth(root *TreeNode) int {
    // Your solution here
    return 0
}`,
    },
    hints: [
      'Think about this problem recursively.',
      'The depth of a tree is 1 + the maximum depth of its subtrees.',
      'What is the base case? What happens when the root is null?',
      'You can also solve this iteratively using a queue (BFS) or stack (DFS).',
    ],
    solution: {
      javascript: {
        code: `function maxDepth(root) {
    if (root === null) {
        return 0;
    }
    
    const leftDepth = maxDepth(root.left);
    const rightDepth = maxDepth(root.right);
    
    return 1 + Math.max(leftDepth, rightDepth);
}`,
        explanation: 'Recursively calculate the maximum depth of left and right subtrees, then add 1.',
        timeComplexity: 'O(n) where n is number of nodes',
        spaceComplexity: 'O(h) where h is height of tree (recursion stack)',
      },
      python: {
        code: `def max_depth(root):
    if not root:
        return 0
    
    left_depth = max_depth(root.left)
    right_depth = max_depth(root.right)
    
    return 1 + max(left_depth, right_depth)`,
        explanation: 'Use recursion to find maximum depth by comparing left and right subtree depths.',
        timeComplexity: 'O(n) where n is number of nodes',
        spaceComplexity: 'O(h) where h is height of tree',
      },
    },
  },
];

export const getQuestionById = (id: string): QuestionTemplate | undefined => {
  return STANDARD_QUESTION_BANK.find(q => q.id === id);
};

export const getQuestionsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): QuestionTemplate[] => {
  return STANDARD_QUESTION_BANK.filter(q => q.difficulty === difficulty);
};

export const getQuestionsByCategory = (category: string): QuestionTemplate[] => {
  return STANDARD_QUESTION_BANK.filter(q => q.category === category);
};

export const getQuestionsByTag = (tag: string): QuestionTemplate[] => {
  return STANDARD_QUESTION_BANK.filter(q => q.tags.includes(tag));
};

export const getAllCategories = (): string[] => {
  const categories = new Set(STANDARD_QUESTION_BANK.map(q => q.category));
  return Array.from(categories).sort();
};

export const getAllTags = (): string[] => {
  const tags = new Set(STANDARD_QUESTION_BANK.flatMap(q => q.tags));
  return Array.from(tags).sort();
};