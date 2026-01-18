# Directive: Intake Protocol
## Plain-English SOP for Onboarding

### Objective
Convert new user to calibrated user in under 60 seconds via 3 gut-check questions.

### Input
- New user session (no user_state exists)

### Process

**Step 1: Welcome**
- Warm, confident greeting
- Set expectation: "3 quick questions"
- Voice-first delivery

**Step 2: Velocity Test**
- Present scenario: "30 minutes opened up unexpectedly"
- Options: Fill it (A) vs Protect it (B)
- Store result immediately

**Step 3: Geometry Test**  
- Ask: "How do you see time?"
- Options: Path forward (A) vs Rhythm/cycle (B)
- Store result immediately

**Step 4: Constellation Test**
- Ask: "Who shares your schedule?"
- Options: Just me (A), Partner (B), Family/team (C)
- Store result immediately

**Step 5: Confirmation**
- Summarize calibration back to user
- State which persona will be used
- Prompt calendar connection

### Quality Criteria
- [ ] Under 60 seconds total
- [ ] All 3 tests completed
- [ ] user_state.json updated
- [ ] No dead ends (always have fallback)

### Error Handling
- If user says "I don't know": "Pick 51% true. We can recalibrate."
- If user abandons: Save partial state, resume on return
- If voice fails: Fallback to tappable buttons

### Output
- user_state.json populated with velocity, geometry, constellation
- AI persona selected and loaded
- Ready for calendar connection flow
