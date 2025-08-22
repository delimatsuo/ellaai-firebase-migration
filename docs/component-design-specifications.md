# Component Design Specifications

## Visual Mockup Structure

### Redesigned Create Company Wizard Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header (Fixed - 72px height)                                │
│ ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐   │
│ │ [Logo]      │  │ Create Company   │  │ Help  [?]     │   │
│ └─────────────┘  └──────────────────┘  └───────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Progress Indicator (Centered - 120px height)                │
│                                                             │
│  ●─────●─────○─────○─────○                                 │
│  │     │     │     │     │                                 │
│Company Team  Plan  Billing Review                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Main Content Area (Scrollable)                              │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                Content Card                             │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Step Title: Company Information                     │ │ │
│ │ │ Step Description: Tell us about your company...    │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ │                                                         │ │
│ │ ┌─────────────────────────────────────────────────────┐ │ │
│ │ │ Form Section: Basic Information                     │ │ │
│ │ │ ┌─────────────────┐ ┌─────────────────┐             │ │ │
│ │ │ │ Company Name    │ │ Company Domain  │             │ │ │
│ │ │ │ [Text Input]    │ │ [Text Input] ✓  │             │ │ │
│ │ │ └─────────────────┘ └─────────────────┘             │ │ │
│ │ │                                                     │ │ │
│ │ │ ┌─────────────────┐ ┌─────────────────┐             │ │ │
│ │ │ │ Industry        │ │ Company Size    │             │ │ │
│ │ │ │ [Dropdown]      │ │ [Dropdown]      │             │ │ │
│ │ │ └─────────────────┘ └─────────────────┘             │ │ │
│ │ └─────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Footer Actions (Sticky - 80px height)                       │
│                                                             │
│ [← Back]              [Save Draft]       [Continue →]      │
│ (Secondary)           (Tertiary)         (Primary)         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Detailed Component Specifications

### 1. Progress Stepper Component

#### Visual States
```
Active Step:    ●  (Filled circle, primary color)
Completed:      ✓  (Check icon, success color)
Pending:        ○  (Empty circle, neutral color)
```

#### Component Structure
```typescript
interface ProgressStepperProps {
  steps: Array<{
    id: string;
    label: string;
    status: 'pending' | 'active' | 'completed';
    icon?: React.ReactNode;
  }>;
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}
```

#### CSS Implementation
```scss
.progress-stepper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem 0;
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    position: relative;
    
    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 20px;
      left: 60%;
      right: -40%;
      height: 2px;
      background: var(--neutral-300);
      z-index: 0;
    }
    
    &.completed:not(:last-child)::after {
      background: var(--success-500);
    }
    
    .step-indicator {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
      
      &.pending {
        background: var(--neutral-100);
        border: 2px solid var(--neutral-300);
        color: var(--neutral-500);
      }
      
      &.active {
        background: var(--primary-500);
        border: 2px solid var(--primary-500);
        color: white;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
      }
      
      &.completed {
        background: var(--success-500);
        border: 2px solid var(--success-500);
        color: white;
      }
    }
    
    .step-label {
      margin-top: 0.75rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--neutral-600);
      text-align: center;
      max-width: 100px;
      line-height: 1.3;
      
      .active & {
        color: var(--primary-600);
        font-weight: 600;
      }
      
      .completed & {
        color: var(--success-600);
      }
    }
  }
}
```

### 2. Form Field Component

#### Base Form Field
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'select' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  error?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  options?: Array<{ label: string; value: string }>; // For select
}
```

#### CSS Implementation
```scss
.form-field {
  margin-bottom: 1.5rem;
  
  .field-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--neutral-700);
    
    .required-indicator {
      color: var(--error-500);
      font-size: 1rem;
    }
  }
  
  .field-wrapper {
    position: relative;
    
    .field-icon {
      position: absolute;
      left: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--neutral-400);
      pointer-events: none;
      z-index: 1;
    }
    
    .field-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid var(--neutral-300);
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      transition: all 0.2s ease;
      
      &:hover:not(:disabled) {
        border-color: var(--neutral-400);
        transform: translateY(-1px);
      }
      
      &:focus {
        outline: none;
        border-color: var(--primary-500);
        box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        transform: translateY(-1px);
      }
      
      &:disabled {
        background: var(--neutral-50);
        color: var(--neutral-500);
        cursor: not-allowed;
      }
      
      &.has-icon {
        padding-left: 2.75rem;
      }
      
      &.error {
        border-color: var(--error-500);
        
        &:focus {
          border-color: var(--error-500);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
      }
    }
    
    .field-status {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      
      &.success {
        color: var(--success-500);
      }
      
      &.error {
        color: var(--error-500);
      }
    }
  }
  
  .field-help,
  .field-error {
    margin-top: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.4;
  }
  
  .field-help {
    color: var(--neutral-500);
  }
  
  .field-error {
    color: var(--error-600);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    
    .error-icon {
      width: 1rem;
      height: 1rem;
    }
  }
}
```

### 3. Button Component System

#### Button Variants
```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}
```

#### CSS Implementation
```scss
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  font-family: inherit;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &.loading {
    cursor: wait;
  }
  
  // Sizes
  &.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
  
  &.btn-md {
    padding: 0.75rem 1.5rem;
    font-size: 0.875rem;
  }
  
  &.btn-lg {
    padding: 1rem 2rem;
    font-size: 1rem;
  }
  
  &.full-width {
    width: 100%;
  }
  
  // Variants
  &.btn-primary {
    background: linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%);
    color: white;
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  
  &.btn-secondary {
    background: white;
    color: var(--neutral-700);
    border: 1px solid var(--neutral-300);
    
    &:hover:not(:disabled) {
      background: var(--neutral-50);
      border-color: var(--neutral-400);
      transform: translateY(-1px);
    }
  }
  
  &.btn-tertiary {
    background: transparent;
    color: var(--primary-600);
    
    &:hover:not(:disabled) {
      background: var(--primary-50);
      color: var(--primary-700);
    }
  }
  
  &.btn-ghost {
    background: transparent;
    color: var(--neutral-600);
    
    &:hover:not(:disabled) {
      background: var(--neutral-100);
      color: var(--neutral-800);
    }
  }
  
  &.btn-danger {
    background: var(--error-500);
    color: white;
    
    &:hover:not(:disabled) {
      background: var(--error-600);
      transform: translateY(-1px);
    }
  }
  
  .btn-icon {
    width: 1rem;
    height: 1rem;
    
    &.icon-right {
      order: 1;
    }
  }
  
  .btn-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
```

### 4. Card Component System

#### Card Variants
```typescript
interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'glass';
  padding?: 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  clickable?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

#### CSS Implementation
```scss
.card {
  border-radius: 12px;
  transition: all 0.3s ease;
  
  &.hoverable:hover {
    transform: translateY(-4px);
  }
  
  &.clickable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-2px);
    }
  }
  
  // Variants
  &.card-default {
    background: white;
    border: 1px solid var(--neutral-200);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    
    &.hoverable:hover {
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }
  }
  
  &.card-outlined {
    background: white;
    border: 2px solid var(--neutral-200);
    
    &.hoverable:hover {
      border-color: var(--primary-200);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }
  }
  
  &.card-elevated {
    background: white;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    
    &.hoverable:hover {
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.12);
    }
  }
  
  &.card-glass {
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  }
  
  // Padding variants
  &.padding-sm {
    padding: 1rem;
  }
  
  &.padding-md {
    padding: 1.5rem;
  }
  
  &.padding-lg {
    padding: 2rem;
  }
  
  .card-header {
    margin-bottom: 1rem;
    
    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--neutral-900);
      margin: 0 0 0.25rem;
    }
    
    .card-subtitle {
      font-size: 0.875rem;
      color: var(--neutral-600);
      margin: 0;
    }
  }
  
  .card-content {
    margin-bottom: 1rem;
  }
  
  .card-footer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: auto;
    padding-top: 1rem;
    border-top: 1px solid var(--neutral-200);
  }
}
```

### 5. Alert/Notification Component

#### Alert Types
```typescript
interface AlertProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dismissible?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  onDismiss?: () => void;
}
```

#### CSS Implementation
```scss
.alert {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  
  .alert-icon {
    flex-shrink: 0;
    width: 1.25rem;
    height: 1.25rem;
    margin-top: 0.125rem;
  }
  
  .alert-content {
    flex: 1;
    
    .alert-title {
      font-weight: 600;
      margin: 0 0 0.25rem;
      font-size: 0.875rem;
    }
    
    .alert-message {
      margin: 0;
      font-size: 0.875rem;
      line-height: 1.4;
    }
  }
  
  .alert-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    
    .alert-action {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-weight: 500;
    }
  }
  
  .alert-dismiss {
    flex-shrink: 0;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: currentColor;
    opacity: 0.7;
    
    &:hover {
      opacity: 1;
    }
    
    .dismiss-icon {
      width: 1rem;
      height: 1rem;
    }
  }
  
  // Types
  &.alert-info {
    background: var(--info-50);
    border: 1px solid var(--info-200);
    color: var(--info-800);
    
    .alert-icon {
      color: var(--info-500);
    }
    
    .alert-action.primary {
      background: var(--info-500);
      color: white;
    }
    
    .alert-action.secondary {
      background: transparent;
      color: var(--info-600);
      border: 1px solid var(--info-300);
    }
  }
  
  &.alert-success {
    background: var(--success-50);
    border: 1px solid var(--success-200);
    color: var(--success-800);
    
    .alert-icon {
      color: var(--success-500);
    }
  }
  
  &.alert-warning {
    background: var(--warning-50);
    border: 1px solid var(--warning-200);
    color: var(--warning-800);
    
    .alert-icon {
      color: var(--warning-500);
    }
  }
  
  &.alert-error {
    background: var(--error-50);
    border: 1px solid var(--error-200);
    color: var(--error-800);
    
    .alert-icon {
      color: var(--error-500);
    }
  }
}
```

## Responsive Breakpoints

### Mobile-First Approach
```scss
// Breakpoints
$mobile: 0;
$tablet: 640px;
$desktop: 1024px;
$wide: 1280px;

// Media queries
@mixin mobile-only {
  @media (max-width: #{$tablet - 1px}) {
    @content;
  }
}

@mixin tablet-up {
  @media (min-width: $tablet) {
    @content;
  }
}

@mixin desktop-up {
  @media (min-width: $desktop) {
    @content;
  }
}

// Responsive adjustments
.wizard-layout {
  @include mobile-only {
    .progress-stepper {
      .step-label {
        display: none; // Hide labels on mobile
      }
    }
    
    .card {
      margin: 0 -1rem; // Full width on mobile
      border-radius: 0;
    }
    
    .form-field {
      .field-input {
        font-size: 16px; // Prevent zoom on iOS
      }
    }
  }
  
  @include tablet-up {
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
  }
  
  @include desktop-up {
    .wizard-content {
      max-width: 800px;
      margin: 0 auto;
    }
  }
}
```

## Dark Theme Specifications

### Color Adjustments
```scss
:root {
  --primary-50: #f8faff;
  --primary-500: #6366f1;
  --neutral-50: #f9fafb;
  --neutral-900: #111827;
  // ... other light theme colors
}

[data-theme="dark"] {
  --primary-50: #1e293b;
  --primary-500: #818cf8;
  --neutral-50: #0f172a;
  --neutral-900: #f9fafb;
  // ... other dark theme colors
  
  .card {
    background: var(--neutral-800);
    border-color: var(--neutral-700);
  }
  
  .field-input {
    background: var(--neutral-800);
    color: var(--neutral-100);
    
    &::placeholder {
      color: var(--neutral-500);
    }
  }
  
  .btn-secondary {
    background: var(--neutral-800);
    color: var(--neutral-200);
    border-color: var(--neutral-600);
  }
}
```

This comprehensive component specification ensures consistent implementation across the entire Create Company wizard interface while maintaining enterprise-grade quality and accessibility standards.