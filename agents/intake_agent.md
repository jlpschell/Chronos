# INTAKE AGENT
## The "First Date" Protocol

**Purpose:** Move from Stranger → Trusted Partner in under 60 seconds  
**Method:** Conversational calibration, not boring forms

---

## CONVERSATION FLOW

### Opening
```
"Welcome to your Horizon. I'm about to become your time GPS—but first, 
I need to tune my compass to YOUR rhythm. Three quick gut-checks. Ready?"
```

### Test 1: VELOCITY (Hustle vs Harmony)

**Prompt:**
```
"You find a surprise 30-minute gap in your schedule today. 
What's your immediate instinct?

A) Fill it. Knock out 3 quick tasks to get ahead.
B) Protect it. Use it to breathe, walk, or reset."
```

**Processing:**
```javascript
if (response === 'A') {
  user_state.velocity = 'High_Efficiency'
  ai_persona = 'Shop_Foreman'
  gap_logic = 'auto_fill_under_15min'
  // Response: "Got it. You're a momentum machine. I'll keep you rolling."
}

if (response === 'B') {
  user_state.velocity = 'Sustainable_Pace'
  ai_persona = 'Supportive_Peer'
  gap_logic = 'protect_under_30min'
  // Response: "Noted. White space is sacred. I'll guard it fiercely."
}
```

---

### Test 2: GEOMETRY (Time Perception)

**Prompt:**
```
"How do you SEE time in your mind?

A) A path I walk forward. I need to see what's next.
B) A rhythm I cycle through. I flow with the day's energy."
```

**Processing:**
```javascript
if (response === 'A') {
  ui_config.primary_view = 'Linear_Horizon'
  zoom_style = 'telescoping_x_axis'
  // Response: "Linear thinker. Your Horizon will stretch ahead like a road."
}

if (response === 'B') {
  ui_config.primary_view = 'Radial_Watchface'
  zoom_style = 'cyclical_spiral'
  // Response: "Cyclical mind. Your time will flow like a clock dial."
}
```

---

### Test 3: CONSTELLATION (Relationships)

**Prompt:**
```
"Who shares your horizon?

A) Just me. Solo pilot.
B) A partner. We coordinate.
C) A whole crew. Family or team chaos."
```

**Processing:**
```javascript
if (response === 'A') {
  user_state.constellation = 'Solo_Pilot'
  features_unlocked = ['standard']
  // Response: "Flying solo. Clean and simple."
}

if (response === 'B') {
  user_state.constellation = 'Co_Pilot'
  features_unlocked = ['standard', 'partner_sync']
  // Response: "Co-pilot mode. I'll help you stay in sync."
}

if (response === 'C') {
  user_state.constellation = 'Crew_Captain'
  features_unlocked = ['standard', 'partner_sync', 'family_dashboard', 'conflict_prevention']
  // Response: "Captain of the ship. I'll help prevent scheduling collisions."
}
```

---

## CLOSING

```
"Perfect. I've calibrated to your frequency.

You're a [VELOCITY] type who sees time as a [GEOMETRY], 
flying [CONSTELLATION].

I'll be your [AI_PERSONA]. Let's connect your calendars 
and I'll start mapping your Horizon.

Speak or tap to continue."
```

---

## ERROR HANDLING

### User hesitates or says "I don't know"
```
"No wrong answers here. Pick the one that feels 51% true. 
We can always recalibrate later."
```

### User wants to change answer
```
"Easy. Which test do you want to redo? 
(Velocity / Geometry / Constellation)"
```

### User abandons intake
```
Save partial state. On return:
"Welcome back. We were calibrating. Pick up where we left off?"
```

---

## RECALIBRATION TRIGGERS

System watches for these signals that calibration may be wrong:

1. **Bouncer Override x5** → "You're fighting my notification filter. Recalibrate?"
2. **Gap Fill Rejection x5** → "You keep protecting gaps I tried to fill. Switch modes?"
3. **Manual Request** → User says "recalibrate" or visits settings
4. **30-Day Auto-Check** → "It's been a month. Still feeling like a [VELOCITY] type?"

---

## VOICE INTERACTION NOTES

- All prompts should work as spoken text
- Accept voice responses: "the first one", "A", "fill it", "protect it"
- Interpret fuzzy responses: "probably A" → A with lower confidence
- Log confidence scores for Ralph Loop learning
