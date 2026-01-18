# Directive: Calendar Sync
## Plain-English SOP for Calendar Integration

### Objective
Connect user calendars and merge into unified "Horizon" view.

### Input
- User completes intake
- User initiates calendar connection

### Process

**Step 1: Provider Selection**
- Show available providers: Google, Apple, Outlook
- Recommend starting with primary calendar
- Support multiple connections

**Step 2: OAuth Flow (Google Example)**
```
1. User clicks "Connect Google Calendar"
2. Redirect to Google OAuth consent screen
3. User grants calendar read/write permission
4. Receive access token + refresh token
5. Store securely (encrypted)
6. Confirm: "Google Calendar connected!"
```

**Step 3: Initial Sync**
- Fetch events from past 30 days + future 90 days
- Store in local cache
- Identify recurring events
- Map to unified event schema

**Step 4: Real-time Updates**
- Set up webhook/push notifications where available
- Fallback: Poll every 5 minutes
- Merge changes into local state

**Step 5: Conflict Detection**
- Compare events across all connected calendars
- Flag overlaps
- Identify missing buffers

### Quality Criteria
- [ ] OAuth completes without error
- [ ] Events visible within 10 seconds of connection
- [ ] Recurring events properly expanded
- [ ] Conflicts detected and flagged

### Error Handling
- OAuth cancelled: "No problem. Connect when ready."
- Token expired: Auto-refresh silently
- API rate limit: Queue and retry with backoff
- Sync failed: "Having trouble syncing. Retry?"

### Output
- calendars_connected[] updated in user_state
- Events cached locally
- Webhook/polling active
- Ready for time GPS visualization
