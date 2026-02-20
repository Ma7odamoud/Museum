# Virtual Memory Museum - Implementation Plan

## Database Schema

### Room Table
```prisma
model Room {
  id          String   @id @default(cuid())
  title       String
  description String?
  coverImage  String?
  date        DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  media       Media[]
}
```

### Media Table
```prisma
model Media {
  id        String   @id @default(cuid())
  roomId    String
  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)
  url       String
  type      String   // 'image' or 'video'
  caption   String?
  order     Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Relationship**: One Room has many Media items. Media items are connected to Rooms via `roomId`.

---

## Authentication Strategy

### Cookie-Based Password Check
- Simple cookie-based authentication
- No user accounts or signup system
- Single password check: **"220810"**
- Cookie persists session after successful password entry
- Middleware checks for valid cookie on protected routes

---

## Audio Implementation

### Layout-Level Audio Player
- `<AudioPlayer />` component placed in root layout
- Uses **React Context** to manage audio state globally
- Audio state persists across all page navigations
- Playlist of 3 songs on continuous loop
- Controls accessible but non-intrusive

---

## Animation Strategy

### Framer Motion Transitions
- Use **`AnimatePresence`** for room entry/exit animations
- Smooth fade and scale transitions when entering rooms
- Exit animations when leaving rooms
- Coordinated with Next.js App Router page transitions
- Masonry gallery items animate in with stagger effect

---

## Folder Structure

```
/app
  /layout.tsx              # Root layout with AudioPlayer
  /page.tsx                # Gatekeeper (password entry)
  /hallway
    /page.tsx              # The Hallway (room cards grid)
  /room/[id]
    /page.tsx              # Individual Room view (masonry gallery)
  /admin
    /page.tsx              # Admin mode (add rooms, upload media)
  /api
    /auth
      /route.ts            # Password verification endpoint
    /rooms
      /route.ts            # CRUD operations for rooms
    /media
      /route.ts            # Upload and manage media

/components
  /AudioPlayer.tsx         # Global audio player
  /RoomCard.tsx            # Room preview card
  /MasonryGallery.tsx      # Masonry layout for media
  /MediaUploader.tsx       # Admin media upload component

/lib
  /prisma.ts               # Prisma client instance
  /auth.ts                 # Auth helper functions

/context
  /AudioContext.tsx        # React Context for audio state

/prisma
  /schema.prisma           # Database schema
```

---

**This plan provides the technical blueprint for building the Virtual Memory Museum.**
