# Directive: Voice Processing
## Plain-English SOP for Voice Interaction

### Objective
Handle voice input as primary interaction method. Transcribe, interpret, execute.

### Input
- User voice via microphone
- Context: current view, time, recent interactions

### Process

**Step 1: Capture**
- Web Speech API (MVP) or Deepgram (upgrade)
- Visual indicator: "Listening..."
- Stop on silence or tap

**Step 2: Transcribe**
- Convert audio to text
- Display transcript briefly for confirmation
- Handle misheard words gracefully

**Step 3: Intent Classification**
```
Categories:
- COMMAND: "Block tomorrow morning" → execute action
- QUERY: "What's my day look like?" → retrieve and speak
- MEMO: "Note for Thursday meeting: discuss pricing" → attach to event
- CONVERSATION: "I'm feeling overwhelmed" → empathetic response
```

**Step 4: Execute Based on Intent**

COMMAND execution:
```
1. Parse action + target + parameters
2. Confirm if destructive: "Cancel your 3pm?"
3. Execute on confirmation
4. Respond: "Done. Your 3pm is cancelled."
```

QUERY execution:
```
1. Retrieve relevant data
2. Format for voice (short, clear)
3. Speak response
4. Offer follow-up: "Want details?"
```

MEMO attachment:
```
1. Identify target event (by time, title, or context)
2. If ambiguous: "Which meeting? You have 2 on Thursday."
3. Store audio file + transcript
4. Confirm: "Added to your Thursday 2pm with Johnson."
```

**Step 5: Voice Response**
- Use text-to-speech for responses
- Match persona (Foreman = brief, Peer = warm)
- Offer visual fallback

### Quality Criteria
- [ ] Transcription accuracy >90%
- [ ] Intent classified correctly
- [ ] Response within 2 seconds
- [ ] Voice memo attached to correct event

### Error Handling
- Can't hear: "Sorry, didn't catch that. Try again?"
- Ambiguous command: "Did you mean X or Y?"
- No matching event: "I don't see that on your calendar. Create it?"
- Microphone blocked: "I need mic access. Check your browser settings."

### Output
- Action executed OR response spoken
- Interaction logged for Ralph Loop
- UI updated to reflect changes
