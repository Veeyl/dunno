/**
 * Mock catalogue used to seed the product store on first launch.
 * After that, products live in localStorage and can be edited in Inventory.
 */
export const CATEGORIES = ['Drinks', 'Food', 'Snacks', 'Desserts']

export const mockProducts = [
  // Drinks
  { id: 'p1', name: 'Espresso', category: 'Drinks', price: 2.5, stock: 40, emoji: '☕' },
  { id: 'p2', name: 'Cappuccino', category: 'Drinks', price: 3.75, stock: 35, emoji: '☕' },
  { id: 'p3', name: 'Iced Latte', category: 'Drinks', price: 4.25, stock: 30, emoji: '🥤' },
  { id: 'p4', name: 'Matcha Green Tea', category: 'Drinks', price: 3.95, stock: 25, emoji: '🍵' },
  { id: 'p5', name: 'Fresh Orange Juice', category: 'Drinks', price: 3.5, stock: 20, emoji: '🍊' },
  { id: 'p6', name: 'Bubble Tea', category: 'Drinks', price: 4.95, stock: 4, emoji: '🧋' },
  { id: 'p7', name: 'Lemonade', category: 'Drinks', price: 3.0, stock: 18, emoji: '🍋' },
  { id: 'p8', name: 'Bottled Water', category: 'Drinks', price: 1.25, stock: 60, emoji: '💧' },

  // Food
  { id: 'p9', name: 'Classic Burger', category: 'Food', price: 8.95, stock: 15, emoji: '🍔' },
  { id: 'p10', name: 'Margherita Pizza', category: 'Food', price: 11.5, stock: 10, emoji: '🍕' },
  { id: 'p11', name: 'Chicken Wrap', category: 'Food', price: 7.25, stock: 12, emoji: '🌯' },
  { id: 'p12', name: 'Caesar Salad', category: 'Food', price: 6.95, stock: 3, emoji: '🥗' },
  { id: 'p13', name: 'Hot Dog', category: 'Food', price: 4.5, stock: 20, emoji: '🌭' },
  { id: 'p14', name: 'Ramen Bowl', category: 'Food', price: 9.75, stock: 0, emoji: '🍜' },
  { id: 'p15', name: 'Club Sandwich', category: 'Food', price: 7.5, stock: 14, emoji: '🥪' },
  { id: 'p16', name: 'Street Tacos', category: 'Food', price: 6.25, stock: 16, emoji: '🌮' },

  // Snacks
  { id: 'p17', name: 'French Fries', category: 'Snacks', price: 3.25, stock: 30, emoji: '🍟' },
  { id: 'p18', name: 'Butter Popcorn', category: 'Snacks', price: 2.95, stock: 25, emoji: '🍿' },
  { id: 'p19', name: 'Soft Pretzel', category: 'Snacks', price: 2.5, stock: 2, emoji: '🥨' },
  { id: 'p20', name: 'Corn Nachos', category: 'Snacks', price: 4.25, stock: 18, emoji: '🌽' },
  { id: 'p21', name: 'Potato Chips', category: 'Snacks', price: 1.95, stock: 40, emoji: '🥔' },
  { id: 'p22', name: 'Mixed Nuts', category: 'Snacks', price: 3.5, stock: 22, emoji: '🥜' },

  // Desserts
  { id: 'p23', name: 'Glazed Donut', category: 'Desserts', price: 2.25, stock: 24, emoji: '🍩' },
  { id: 'p24', name: 'Cheesecake Slice', category: 'Desserts', price: 4.95, stock: 8, emoji: '🍰' },
  { id: 'p25', name: 'Soft Serve Cone', category: 'Desserts', price: 3.25, stock: 20, emoji: '🍦' },
  { id: 'p26', name: 'Choc Chip Cookie', category: 'Desserts', price: 1.75, stock: 36, emoji: '🍪' },
  { id: 'p27', name: 'Vanilla Cupcake', category: 'Desserts', price: 2.95, stock: 5, emoji: '🧁' },
  { id: 'p28', name: 'Apple Pie', category: 'Desserts', price: 4.25, stock: 9, emoji: '🥧' },
]

/** Quick-pick emojis offered in the product form. */
export const EMOJI_CHOICES = [
  '☕', '🍵', '🧋', '🥤', '🧃', '🍺', '🍷', '💧',
  '🍔', '🍕', '🌭', '🌮', '🌯', '🥪', '🥗', '🍜',
  '🍣', '🍗', '🍟', '🍿', '🥨', '🥜', '🍩', '🍰',
  '🧁', '🍪', '🍦', '🥧', '🍫', '🍎', '🍌', '📦',
]

