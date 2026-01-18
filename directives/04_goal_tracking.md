# Directive: Goal Tracking
## Plain-English SOP for Goal Management

### Objective
Track user goals, monitor progress, nudge proactively, prevent drift.

### Input
- User states a goal (voice or text)
- Calendar activity and task completions

### Process

**Step 1: Goal Capture**
```
User: "I want to land 3 new clients by end of Q1"

Parse:
- target: 3 new clients
- deadline: 2025-03-31
- measurable: yes (count)
- current_progress: 0 (ask to confirm)
```

**Step 2: Goal Storage**
```json
{
  "id": "goal_001",
  "text": "Land 3 new clients",
  "target_value": 3,
  "current_value": 0,
  "deadline": "2025-03-31",
  "created": "2025-01-16",
  "last_activity": null,
  "related_events": [],
  "status": "active"
}
```

**Step 3: Activity Linking**
When user schedules/completes related activity:
- "Sales call with prospect" → link to client goal
- Prompt: "Does this relate to your client goal?" (if uncertain)
- Update last_activity timestamp

**Step 4: Progress Tracking**
On explicit update:
- User: "I signed a new client!"
- Increment current_value
- Celebrate: "Amazing! That's 1 of 3. You're on track!"

**Step 5: Drift Detection**
```
if (days_since_last_activity > 7) {
  status = "drifting"
  trigger_nudge()
}
```

Nudge script:
- Foreman: "It's been a week since you worked on [goal]. What's the blocker?"
- Peer: "Gentle check: Your [goal] hasn't seen action in a week. Still a priority?"

**Step 6: Deadline Awareness**
- 30 days out: "Your [goal] deadline is in a month. You're at X of Y."
- 7 days out: "One week until [goal] deadline. Need to adjust?"
- Deadline passed: "Your [goal] deadline was yesterday. Close it, extend it, or abandon?"

### Quality Criteria
- [ ] Goals have measurable targets
- [ ] Progress updates captured
- [ ] Drift detected within 7 days
- [ ] No guilt-tripping, just facts

### Error Handling
- Vague goal: "Can we make that measurable? How will you know you've succeeded?"
- Conflicting goals: "These two goals might compete for time. Priority?"
- Abandoned goal: Archive, don't delete. "Archived. We can revisit anytime."

### Output
- goals[] in user_state updated
- Activity linked to relevant goals
- Proactive nudges scheduled
- Dashboard shows progress
