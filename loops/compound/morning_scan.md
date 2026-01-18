# COMPOUND LOOP: MORNING SCAN
## Daily Horizon Intelligence Report

**Trigger:** 6:00 AM local time (or user wake time from patterns)  
**Output:** Voice-ready morning briefing + proactive fixes

---

## SCAN SEQUENCE

### 1. Calendar Audit
```javascript
async function morningCalendarScan() {
  const today = getTodayEvents()
  const tomorrow = getTomorrowEvents()
  
  return {
    total_events: today.length,
    total_hours_booked: calculateBookedTime(today),
    capacity_percentage: bookedTime / WORKDAY_HOURS * 100,
    conflicts: findOverlaps(today),
    missing_buffers: findBackToBack(today),
    tomorrow_preview: summarize(tomorrow)
  }
}
```

### 2. Goal Progress Check
```javascript
function checkGoalProgress() {
  return user_state.goals.map(goal => ({
    goal: goal.text,
    deadline: goal.deadline,
    days_remaining: daysUntil(goal.deadline),
    last_activity: getLastActivityDate(goal),
    days_since_activity: daysSince(last_activity),
    status: days_since_activity > 7 ? 'drifting' : 'on_track'
  }))
}
```

### 3. Pattern Application
```javascript
function applyMorningPatterns() {
  const patterns = memory.patterns.confirmed_patterns
  const actions = []
  
  if (patterns.includes('morning_routine_protection')) {
    actions.push({
      type: 'protect_block',
      time: '06:00-08:00',
      label: 'Morning Routine'
    })
  }
  
  if (patterns.includes('peak_morning_focus')) {
    actions.push({
      type: 'suggest_deep_work',
      time: user_state.peak_hours[0]
    })
  }
  
  return actions
}
```

---

## BRIEFING TEMPLATES

### Shop Foreman (Hustle Mode)
```
"Morning. Here's your horizon:

Today: {event_count} events, {capacity}% booked.
{conflict_alert}
{buffer_warning}

Priority: {top_goal_status}

{proactive_suggestion}

Ready to roll?"
```

**Example:**
```
"Morning. Here's your horizon:

Today: 6 events, 75% booked.
⚠️ Conflict at 2pm—sales call overlaps with team standup.
⚠️ Back-to-back from 10am-1pm. No buffers.

Priority: You're 12 days from your client deadline. Last activity: 3 days ago.

I can move standup to 2:30 and add 15-min buffers between morning meetings.
Say 'fix it' or tell me your play."
```

### Supportive Peer (Harmony Mode)
```
"Good morning. 

Your day looks {load_assessment}. 
{positive_note}

{gentle_flag}

{self_care_reminder}

Take it steady."
```

**Example:**
```
"Good morning.

Your day looks balanced—4 meetings with healthy breathing room.
Your deep work block at 10am is protected.

Heads up: That coffee meeting at 3pm isn't tied to any goals. Worth keeping?

Remember: You've been going hard. Your pattern shows you need recovery on Fridays.

Take it steady."
```

---

## PROACTIVE FIX SUGGESTIONS

### Conflict Resolution
```javascript
function suggestConflictFix(conflict) {
  const options = [
    { action: 'move', event: conflict.lower_priority, to: findNextSlot() },
    { action: 'shorten', event: conflict.flexible_one, by: '15min' },
    { action: 'delegate', event: conflict.delegatable, to: suggestDelegate() },
    { action: 'cancel', event: conflict.optional, reason: 'low_goal_alignment' }
  ]
  
  return options.filter(o => o.feasible).slice(0, 2)
}
```

### Buffer Insertion
```javascript
function suggestBuffers(backToBackMeetings) {
  return backToBackMeetings.map(pair => ({
    between: [pair.first.title, pair.second.title],
    suggestion: `Add ${user_state.preferred_buffer || '15min'} buffer`,
    method: pair.second.is_mine ? 'move_second' : 'leave_first_early'
  }))
}
```

---

## DELIVERY METHODS

### Voice (Primary)
```javascript
async function deliverMorningBriefing() {
  const briefing = await generateBriefing()
  const audioScript = formatForVoice(briefing)
  
  // Speak summary
  await speak(audioScript.summary)
  
  // Wait for user response
  const response = await listenForCommand()
  
  if (response.includes('fix it')) {
    await executeProactiveFixes()
  } else if (response.includes('tell me more')) {
    await speak(audioScript.details)
  }
}
```

### Push Notification (If Voice Unavailable)
```
"☀️ Morning Horizon: 6 events, 1 conflict to resolve. Tap to review."
```

### Dashboard Widget
```
┌─────────────────────────────────────┐
│  TODAY: 75% BOOKED                  │
│  ⚠️ 1 Conflict | ⚠️ 2 Back-to-Back  │
│  Goal: Client Deadline in 12 days   │
│                                     │
│  [Fix Issues]  [View Full Day]      │
└─────────────────────────────────────┘
```

---

## LEARNING INTEGRATION

### Log User Response to Briefing
```json
{
  "briefing_id": "br_001",
  "timestamp": "2025-01-16T06:00:00Z",
  "suggestions_offered": ["fix_conflict", "add_buffers"],
  "user_response": "fix_conflict_accepted",
  "time_to_response": "12s",
  "modifications_made": ["moved_standup_to_230"]
}
```

### Pattern Extraction
```
If user consistently:
- Ignores morning briefing → Reduce verbosity or change delivery time
- Always accepts "fix it" → Auto-apply fixes with notification
- Always rejects buffer suggestions → Lower buffer priority
```
