# UI Components Implementation Plan

## Overview
I'll implement three UI components according to the requirements, leveraging the existing component library and design patterns:

## 1. Share Modal
**File Location**: `src/components/ui/share-modal.tsx`

**Features**:
- Modal dialog with email input field
- Copy link functionality with success feedback
- Responsive design matching existing UI patterns

**Implementation Details**:
- Use existing `PaperModal` component as base
- Add email input using `PaperInput`
- Implement copy-to-clipboard functionality
- Add success/error toast notifications

## 2. Batch Action Bar
**File Location**: `src/components/ui/batch-action-bar.tsx`

**Features**:
- Floating action bar that appears when items are selected
- Displays selected item count
- Contains batch action buttons
- Responsive design

**Implementation Details**:
- Positioned at the bottom of the screen with fixed positioning
- Shows/hides based on selected item count
- Uses `PaperButton` components for actions
- Includes customizable action buttons via props

## 3. Re-assign Modal
**File Location**: `src/components/ui/reassign-modal.tsx`

**Features**:
- Modal dialog for re-assigning items to users
- User selection with search/filter capabilities
- Supports single user assignment
- Customizable for different item types

**Implementation Details**:
- Use existing `PaperModal` component as base
- Implement user selection interface (similar to existing `AssignmentDialog`)
- Add search functionality for users
- Make component generic to support different item types

## Design Considerations
- Follow existing design system and component patterns
- Ensure accessibility compliance
- Use TypeScript for type safety
- Add appropriate props for customization
- Ensure responsive design

## Implementation Order
1. Share Modal
2. Batch Action Bar
3. Re-assign Modal

All components will be built using the existing UI component library, maintaining consistency with the project's design system.