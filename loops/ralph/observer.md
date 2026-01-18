# RALPH LOOP: OBSERVER
## Pattern Detection & Learning Engine

**Purpose:** Watch user behavior, detect patterns, enable self-correction

---

## THE RALPH CYCLE

```
R - Recognition  : Detect when user behavior differs from AI expectation
A - Adaptation   : Generate hypothesis about user preference  
L - Learning     : Test hypothesis, confirm or reject
P - Pattern      : Aggregate confirmed learnings into behavioral model
H - Habit        : Use patterns for predictive assistance
```

---

## RECOGNITION PHASE

### What We Log

Every AI suggestion + user response:

```json
{
  "event_id": "evt_001",
  "timestamp": "2025-01-16T09:30:00Z",
  "suggestion_type": "gap_fill",
  "ai_suggested": "Use 15min gap for email triage",
  "user_response": "rejected",
  "user_action": "marked_as_break",
  "context": {
    "time_of_day": "morning",
    "day_type": "weekday",
    "current_load": "moderate",
    "previous_task": "deep_work_90min",
    "energy_indicator": "post_focus_dip"
  }
}
```

### Override Categories

| Category | Example | Tracking Key |
|----------|---------|--------------|
| Gap Fill | AI suggests task, user protects gap | `gap_fill_rejection` |
| Meeting Buffer | AI books back-to-back, user adds buffer | `buffer_preference` |
| Time Estimate | AI suggests 30min, user changes to 60min | `duration_mismatch` |
| Priority Order | AI ranks Task A first, user does B first | `priority_disagreement` |
| Notification | AI holds alert, user checks anyway | `bouncer_override` |
| Morning Routine | AI suggests tasks, user exercises first | `morning_preference` |

### Trigger Threshold

```javascript
const HYPOTHESIS_THRESHOLD = 3  // Same override type triggers hypothesis

function checkForPattern(newOverride) {
  const similar = overrides.filter(o => 
    o.type === newOverride.type &&
    o.context.time_of_day === newOverride.context.time_of_day &&
    o.timestamp > Date.now() - 14_DAYS
  )
  
  if (similar.length >= HYPOTHESIS_THRESHOLD) {
    generateHypothesis(similar)
  }
}
```

---

## ADAPTATION PHASE

### Hypothesis Generation

When threshold reached, create testable hypothesis:

```json
{
  "hypothesis_id": "hyp_001",
  "created": "2025-01-16T10:00:00Z",
  "observation": "User rejected gap_fill suggestions 3x when context was post_deep_work",
  "hypothesis": "User prefers recovery time after deep work blocks",
  "test_approach": "Suggest break/recovery instead of tasks after deep work",
  "confidence_required": 2,
  "current_confirmations": 0,
  "status": "testing"
}
```

### Hypothesis Templates

| Pattern Observed | Hypothesis Generated |
|------------------|---------------------|
| Rejects morning tasks | "User prefers exercise/routine before work tasks" |
| Adds buffers after meetings | "User needs transition time between meetings" |
| Extends time estimates | "User prefers generous time blocks over tight scheduling" |
| Checks phone during focus | "User has anxiety about missing messages from [source]" |
| Moves evening events | "User protects family time after [hour]" |

### Test Execution

```javascript
function testHypothesis(hypothesis) {
  // Modify next suggestion based on hypothesis
  const adjustedSuggestion = applyhypothesis(hypothesis, nextContext)
  
  // Log the test
  log({
    hypothesis_id: hypothesis.id,
    test_number: hypothesis.current_confirmations + 1,
    suggestion_made: adjustedSuggestion,
    awaiting_response: true
  })
}
```

---

## LEARNING PHASE

### Confirmation Logic

```javascript
function evaluateHypothesisTest(hypothesis, userResponse) {
  if (userResponse === 'accepted') {
    hypothesis.current_confirmations++
    
    if (hypothesis.current_confirmations >= hypothesis.confidence_required) {
      promoteToPattern(hypothesis)
    }
  } else {
    // Hypothesis failed - try alternative
    hypothesis.status = 'rejected'
    generateAlternativeHypothesis(hypothesis.observation)
  }
}
```

### User Notification (Optional)

When pattern confirmed:

```
"I learned something: You prefer [PATTERN].
I'll remember that going forward.
(You can always override me if it changes.)"
```

---

## PATTERN PHASE

### Pattern Storage

```json
// memory/patterns.json
{
  "confirmed_patterns": [
    {
      "id": "pat_001",
      "description": "Needs recovery after deep work",
      "trigger": "deep_work_block_ended",
      "action": "suggest_break_not_tasks",
      "confidence": 0.85,
      "confirmed_date": "2025-01-16",
      "override_count_since": 0
    }
  ],
  "behavioral_model": {
    "morning_type": "slow_start",
    "peak_hours": ["10:00-12:00", "14:00-16:00"],
    "meeting_preference": "clustered_not_scattered",
    "buffer_need": "high",
    "notification_tolerance": "low"
  }
}
```

### Pattern Categories

1. **Temporal Patterns** - When user works best
2. **Task Patterns** - How user sequences work
3. **Social Patterns** - Meeting and communication preferences
4. **Recovery Patterns** - When user needs breaks
5. **Override Patterns** - Consistent disagreements with AI

---

## HABIT PHASE

### Predictive Actions

Once patterns are confirmed, apply proactively:

```javascript
function applyHabits(upcomingSchedule) {
  patterns.confirmed_patterns.forEach(pattern => {
    if (pattern.trigger === 'deep_work_block_ended') {
      // Pre-insert recovery time
      insertRecoveryBlock(afterDeepWork)
    }
    
    if (pattern.trigger === 'morning_schedule') {
      // Block exercise time automatically
      protectMorningRoutine()
    }
  })
}
```

### Proactive Scripts

```
"Based on your patterns, I blocked 30 minutes after your 
deep work session. You usually need recovery time there."

"I noticed your morning routine matters. Tomorrow's 
first meeting isn't until 9am—your 6-8am is protected."
```

---

## PATTERN DECAY

Patterns aren't permanent. Watch for drift:

```javascript
const DECAY_THRESHOLD = 5  // Overrides before questioning pattern

function checkPatternValidity(pattern, newOverride) {
  if (newOverride.contradicts(pattern)) {
    pattern.override_count_since++
    
    if (pattern.override_count_since >= DECAY_THRESHOLD) {
      promptRecalibration(pattern)
    }
  }
}

function promptRecalibration(pattern) {
  speak(`I used to think you ${pattern.description}, 
         but you've been doing the opposite lately.
         Has something changed?`)
}
```

---

## SELF-CORRECTION SCRIPT

When AI realizes it's been wrong:

```
"I owe you an adjustment. I've been suggesting [X] because 
I thought you preferred it. But you've overridden me [N] times.

Help me understand: What would work better for you 
in these [CONTEXT] moments?"
```

---

## DEBUG / TRANSPARENCY

User can ask:
- "What have you learned about me?"
- "Why did you suggest that?"
- "What patterns do you see?"

Response template:
```
"Here's what I've learned about your rhythms:
- [Pattern 1]
- [Pattern 2]
- [Pattern 3]

These are based on [N] interactions over [timeframe].
Want to correct anything?"
```
