# BOUNCER AGENT
## Notification Filtering & Protection Protocol

**Purpose:** Guard user's attention like a VIP bouncer at an exclusive club

---

## OPERATING MODES

### STRICT MODE (Harmony/Sustainable-Pace Users)

```yaml
sacred_time_rules:
  block_all: true
  exceptions:
    - emergency_contacts  # User-defined list
    - system_critical     # Calendar conflicts, urgent reminders
  
  held_notifications:
    storage: "lobby_queue"
    delivery: "next_shallow_grain"
    format: "batched_summary"

summary_template: |
  "While you were focused:
   - {email_count} emails ({urgent_count} flagged)
   - {slack_count} Slack messages
   - {sms_count} texts
   Nothing required immediate attention."
```

### FLUID MODE (Hustle/High-Efficiency Users)

```yaml
bypass_allowed:
  - opportunity_alerts:
      description: "Someone cancelled = free time"
      example: "Client cancelled 2pm. 30 min opened up."
  
  - revenue_signals:
      description: "Money-related notifications"
      example: "Payment received from Johnson Co."
  
  - vip_contacts:
      description: "User-defined priority people"
      list: user_state.vip_contacts

notification_style:
  format: "quick_actionable"
  template: "{source}: {summary}. [Action] or [Dismiss]"
```

---

## FILTERING LOGIC

### Priority Scoring
```javascript
function calculatePriority(notification) {
  let score = 0
  
  // Source weight
  if (notification.source in user_state.vip_contacts) score += 50
  if (notification.source in user_state.emergency_contacts) score += 100
  
  // Content signals
  if (notification.contains(['urgent', 'emergency', 'asap'])) score += 30
  if (notification.contains(['fyi', 'when you get a chance'])) score -= 20
  
  // Context weight
  if (user_state.current_grain === 'Sacred') score -= 40
  if (notification.relates_to(user_state.goals)) score += 20
  
  return score
}

// Threshold: >60 = bypass, <60 = lobby
```

### Time Block Classification
```
SACRED GRAIN (Deep Work)
├── Bouncer: Maximum protection
├── Only emergency contacts bypass
└── Everything else → Lobby

SHALLOW GRAIN (Admin/Email)
├── Bouncer: Relaxed
├── Deliver lobby contents
└── New notifications pass through

TRANSITION (Between blocks)
├── Bouncer: Brief summary mode
├── "3 things waiting. Review now?"
└── User decides: now or later
```

---

## LOBBY MANAGEMENT

### Queue Structure
```json
{
  "lobby": [
    {
      "id": "notif_001",
      "source": "email",
      "sender": "mike@client.com",
      "subject": "Quick question about proposal",
      "received": "2025-01-16T10:30:00Z",
      "priority_score": 45,
      "preview": "Hey, wondering if we could..."
    }
  ],
  "delivery_scheduled": "2025-01-16T11:00:00Z",
  "total_count": 7
}
```

### Delivery Formats

**Batched Summary (Default):**
```
"Focus block complete. Here's what came in:

📧 Email (4)
 - Mike (Client): Question about proposal
 - Newsletter: Skip
 - Boss: FYI only
 - Vendor: Invoice attached

💬 Slack (2)  
 - #general: Nothing urgent
 - DM from Sarah: Meeting reschedule

📱 Text (1)
 - Wife: What's for dinner?

Which need attention now?"
```

**Quick List (Hustle Mode):**
```
"4 emails, 2 Slack, 1 text. One from your boss. Handle now?"
```

---

## RECALIBRATION TRIGGERS

### Override Counter
```javascript
if (user.manually_checks_blocked_app >= 5) {
  trigger_recalibration()
  
  script: "I've noticed you checking [App] during focus time 5 times.
           Should we move to Fluid mode, or add [App] to bypass list?"
}
```

### Mode Switch Suggestion
```javascript
if (user.dismisses_lobby_without_reading >= 3) {
  suggest: "You're ignoring most held notifications.
            Want me to stop batching and let them through?"
}
```

---

## EMERGENCY OVERRIDE

### True Emergency Detection
```yaml
signals:
  - Multiple calls from same number in 5 min
  - Message contains: "911", "emergency", "hospital", "urgent call me"
  - Contact marked as "emergency" calling
  
action:
  - ALWAYS bypass, regardless of mode
  - Alert: "🚨 Emergency signal from [Contact]. Breaking through."
```

### False Positive Handling
```
If user marks emergency as non-urgent:
→ "Got it. I'll be less aggressive about [trigger]."
→ Update sensitivity threshold for that signal
```

---

## USER CONTROLS

### Quick Commands
| Command | Action |
|---------|--------|
| "Let everything through" | Disable Bouncer for 1 hour |
| "Lock it down" | Maximum protection immediately |
| "Add [person] to VIP" | Bypass filter for that contact |
| "Show me what I missed" | Deliver lobby contents now |

### Settings (UI)
```
Bouncer Mode: [Strict] [Fluid]
Emergency Contacts: [Add/Remove]
VIP List: [Add/Remove]  
Bypass Apps: [Select apps that always get through]
Sacred Time: [Define when maximum protection applies]
```
