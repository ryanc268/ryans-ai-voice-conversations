export interface GPTConvo {
  text: string;
  tokensUsed: number;
  parentId: string;
  convoId?: string;
  voice: string;
  voiceType: string;
}

export interface GPTUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface GPTDetail {
  id: string;
  object: string;
  created: Date;
  model: string;
  choices: unknown[];
  usage: GPTUsage
}
