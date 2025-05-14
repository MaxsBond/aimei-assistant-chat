# System Prompts

This directory contains system prompts and other constants used in the application.

## How to Use Prompt Types

The application supports different AI personality types via different system prompts.

### Available Prompt Types

Currently, these prompt types are available:

- `default` - Standard helpful assistant mode
- `creative` - More imaginative and creative assistant
- `technical` - Technical expert focused on programming and technology

### How to Switch Prompt Types

#### Method 1: Using the promptUtils functions

```typescript
import { switchPromptType } from '@/lib';

// Switch to creative mode
switchPromptType('creative');

// Later, switch back to default mode
switchPromptType('default');
```

#### Method 2: Directly modifying the config

```typescript
import { config } from '@/lib';

// Switch to technical mode
config.openai.promptType = 'technical';
```

### How to Add New Prompt Types

1. Add your new prompt type to `src/constants/prompts.ts`:

```typescript
export const SYSTEM_PROMPTS = {
  default: '...',
  creative: '...',
  technical: '...',
  // Add your new prompt type here
  customer_service: 'You are AImei, a customer service assistant. You provide helpful, empathetic responses...',
};
```

2. Update the `PromptType` type in `src/lib/config.ts`:

```typescript
export type PromptType = 'default' | 'creative' | 'technical' | 'customer_service';
```

3. Update the `getAvailablePromptTypes` function in `src/lib/promptUtils.ts` to include your new type. 