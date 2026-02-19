
export interface User {
  name: string;
  phone: string;
  age: string;
  aadhar: string;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Todo {
  id: string;
  task: string;
  completed: boolean;
  dueDate: string;
}

export interface SensorData {
  time: string;
  temperature: number;
  humidity: number;
  sunlight: number;
  waterLevel: number;
}

export interface CropSuggestion {
  crop: string;
  timing: string;
  method: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum Section {
  AUTH = 'auth',
  COMMUNITY = 'community',
  CHATBOT = 'chatbot',
  MONITORING = 'monitoring',
  CROP_ROTATION = 'crop_rotation',
  SCHEMES = 'schemes',
  FINANCE = 'finance'
}
