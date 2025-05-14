---
description: How to add or edit Roo Code rules in our project
globs: 
alwaysApply: false
---
# Roo Code Rules Location

How to add new roo rules to the project

1. Always place rule files in PROJECT_ROOT/.roo/rules/:
    ```
    .roo/rules/
    ├── your-rule-name.md
    ├── another-rule.md
    └── ...
    ```

2. Follow the naming convention:
    - Use kebab-case for filenames
    - Always use .md extension
    - Make names descriptive of the rule's purpose

3. Directory structure:
    ```
    PROJECT_ROOT/
    ├── .roo/
    │   └── rules/
    │       ├── your-rule-name.md
    │       └── ...
    └── ...
    ```

4. Never place rule files:
    - In the project root
    - In subdirectories outside .roo/rules
    - In any other location

5. Roo Code rules have the following structure:

````
---
description: Short description of the rule's purpose
globs: optional/path/pattern/**/* 
alwaysApply: false
---
# Rule Title

Main content explaining the rule with markdown formatting.

1. Step-by-step instructions
2. Code examples
3. Guidelines

Example:
```typescript
// Good example
function goodExample() {
  // Implementation following guidelines
}

// Bad example
function badExample() {
  // Implementation not following guidelines
}
```
````
