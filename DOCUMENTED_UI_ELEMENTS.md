# SeaVault Documented UI Elements

This document summarizes the originally documented UI elements for each screen in the SeaVault application, as referenced in the UI_Comparison_Report.md.

## 1. Login Screen
**File:** `screens/auth/login/index.tsx`

### Documented Elements:
- Email input
- Password input
- Sign In/Sign Up button
- Switch authentication mode button

## 2. Home/Dashboard Screen
**File:** `screens/tabs/home/index.tsx`

### Documented Elements:
- Title and subtitle
- Log Dive button
- Stat cards (Discovered, Wishlist, Points)
- Leaderboard section with entries
- See All button

## 3. Categories Screen
**File:** `screens/tabs/categories/index.tsx`

### Documented Elements:
- Title
- Category cards with images
- Completion badges
- Offline banner

## 4. Log Dive Screen
**File:** `screens/tabs/log-dive/index.tsx`

### Documented Elements:
- Title and subtitle
- Dive site selector
- Map view
- Date input
- Time input
- Dive type selector
- Depth input
- Dive notes
- Creature selection toggle (now inline)
- Selected creatures list (now inline)
- Creature notes inputs (now per-creature)
- Photo attachment buttons (now per-creature)
- Save button

## 5. Profile Screen
**File:** `screens/tabs/profile/index.tsx`

### Documented Elements:
- Title
- User avatar
- User name
- User email
- Edit Profile button
- Stat cards (Total Points, Species Found, Completion)
- Category progress bars
- Settings section with buttons

## 6. Discovered Creatures Screen
**File:** `screens/stats/discovered/index.tsx`

### Documented Elements:
- Back button
- Title with count
- Creature cards with images
- Creature names
- Scientific names
- First sighting dates
- Total sightings count
- Points badges

## 7. Points Screen
**File:** `screens/stats/points/index.tsx`

### Documented Elements:
- Back button
- Title
- Total points display
- Points entries with creature details
- Points badges

## 8. Wishlist Screen
**File:** `screens/stats/wishlist/index.tsx`

### Documented Elements:
- Back button
- Title with count
- Creature cards with images
- Creature names
- Scientific names
- Date added information
- Remove buttons
- Heart icons

## 9. Creature Detail Screen
**File:** `screens/creatures/[id]/index.tsx`

### Documented Elements:
- Back button
- Hero image
- Creature name and scientific name
- Classification badges
- Tab navigation (About/Sightings)
- Description text
- Stats cards
- Habitat information
- Depth range information
- Sighting cards with details
- Empty state message
- Wishlist toggle button
- Add Sighting button