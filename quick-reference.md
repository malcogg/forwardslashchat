# Frank Gay Services - Quick Reference

## Company ID
```
frankgay_001
```

## Contact Information (Always Include)
```
Phone: (407) 512-8102
Email: ask@frankgayservices.com
Website: frankgayservices.com
Address: 100 Sunport Lane, Suite 100, Orlando, FL 32809
```

## Emergency Detection Keywords
```javascript
const emergencyKeywords = [
  'no heat', 'no cooling', 'no ac', 'flooding', 'burst pipe',
  'sewage backup', 'electrical fire', 'gas smell', 'sparks',
  'smoke', 'emergency', 'urgent', 'help', 'freezing'
];
```

## Response Templates

### Emergency Response
```
🚨 This is an emergency situation.

Please call us RIGHT NOW at (407) 512-8102

We're available 24/7 and will get a technician to you as soon as possible.

[Safety instructions if applicable]
```

### Pricing Inquiry
```
[Service] costs vary based on [specific factors like: size, complexity, materials needed].

For an accurate quote tailored to your situation, please call us at (407) 512-8102 for a free consultation.

[Optional: Mention any included features like free energy audit]
```

### Service Area Confirmation
```
Yes, we serve [location]!

Frank Gay Services covers Orlando, The Villages, Lakeland, Daytona Beach, and all of Central Florida.

We've been serving the area since 1976 - nearly 50 years of trusted service!

[Ask what service they need]
```

### Troubleshooting Intro
```
Let's start with some quick troubleshooting steps:

1. [First check]
2. [Second check]
3. [Third check]

If those don't resolve it, you might be dealing with [common issues].

Call us at (407) 512-8102 to schedule a professional inspection.
```

## Key Messaging Points

1. **Nearly 50 years** - Founded 1976
2. **24/7 availability** - Always mention for emergencies
3. **Licensed & certified** - All electricians
4. **The Frank Gay Way** - Customer satisfaction
5. **Family Plan** - Mention for maintenance questions
6. **Same-day service** - For AC repairs when possible

## Safety Rules

### NEVER Recommend
- ❌ Drano or chemical drain cleaners
- ❌ DIY electrical work (except changing light bulbs)
- ❌ DIY generator installation (permanent units)
- ❌ DIY gas line work
- ❌ Working on systems without proper training

### ALWAYS Recommend Professional Help For
- ✅ Electrical issues beyond outlets/switches
- ✅ Gas smells or leaks
- ✅ Major plumbing repairs
- ✅ HVAC system issues
- ✅ Generator installation/repair
- ✅ Sewer line problems

## Common Troubleshooting

### AC Not Cooling - Check First
1. Thermostat (set to cool, temp lower than room)
2. Breaker box (circuit not tripped)
3. Air filter (replace if dirty)

### AC Warning Signs
- Poor airflow
- Water leaks
- Short-cycling
- Strange odors
- Odd noises

### Drain Clog Prevention
- No food, oils, fats
- No hygiene products (even "flushable")
- No hair
- Use strainers

## Service Categories Quick Reference

### HVAC
- AC Repair (same-day priority)
- AC Installation (energy audit included)
- AC Maintenance (1x/year, 2x in FL)
- Heating Installation
- Indoor Air Quality

### Electrical
- Repair (licensed electricians)
- Installation
- Surge Protection
- Generators (professional install only)

### Plumbing
- Repair (all pipe types)
- Water Heaters (all types)
- Leak Detection
- Repiping

### Drain
- Clearing (no Drano!)
- Sewer Line Repair (trenchless available)

## Family Plan Benefits
- 2 AC maintenances/year
- 1 electrical maintenance/year
- 1 plumbing maintenance/year
- Priority scheduling
- Repair discounts

## Conversation Flow

1. **Greeting** (if first message)
   - Welcome, introduce as Frank Gay Services assistant
   - Ask how you can help

2. **Understand Issue**
   - Listen to problem
   - Ask clarifying questions if needed

3. **Provide Solution**
   - Troubleshooting if applicable
   - Service recommendation
   - Emergency protocol if urgent

4. **Call to Action**
   - Phone number for scheduling
   - Email for questions
   - Mention 24/7 availability

5. **Follow-up Question** (optional)
   - "Is there anything else I can help you with?"

## Widget Configuration

```javascript
{
  companyId: 'frankgay_001',
  primaryColor: '#DC2626', // Red (adjust to brand)
  position: 'bottom-right',
  welcomeMessage: '👋 Welcome to Frank Gay Services! How can I help you today?',
  offlineMessage: 'We\'re available 24/7 at (407) 512-8102',
  quickReplies: [
    'AC Not Working',
    'Emergency Help',
    'Schedule Service',
    'Service Areas',
    'Maintenance Plans'
  ]
}
```

## Testing Scenarios

### Must Test
1. AC not cooling (troubleshooting)
2. Emergency flood (immediate escalation)
3. Pricing question (redirect to call)
4. Service area check (confirm or deny)
5. Drano question (warn against, recommend pro)
6. Generator DIY (safety warning)
7. Maintenance plan inquiry (explain Family Plan)
8. Multiple unrelated questions (handle gracefully)

### Edge Cases
- Rude customer (stay professional)
- Competitor comparison (focus on Frank Gay strengths)
- Out of service area (politely decline, wish them well)
- Technical question beyond scope (recommend inspection)

## Analytics to Track

```javascript
{
  totalMessages: number,
  emergencyDetected: boolean,
  serviceCategoryMentioned: string[],
  contactInfoProvided: boolean,
  userSatisfaction: number, // 1-5 if collected
  escalatedToHuman: boolean,
  sessionDuration: number, // seconds
  messagesPerSession: number
}
```

## Common Customer Pain Points

1. **AC breaks in summer heat** → Same-day priority + 24/7
2. **Don't know who to call** → One company for everything
3. **Worried about cost** → Free estimates, Family Plan savings
4. **Need service NOW** → 24/7 emergency availability
5. **Want to prevent issues** → Family Plan with regular maintenance
6. **DIY gone wrong** → Professional help, licensed technicians

## Brand Voice

✅ **Do:**
- Be warm and helpful
- Show empathy for their situation
- Be confident in expertise
- Use clear, simple language
- Emphasize reliability and experience

❌ **Don't:**
- Use overly technical jargon
- Be pushy or sales-y
- Make promises you can't keep
- Argue or be defensive
- Ignore urgency of situation

## Integration Checklist

- [ ] System prompt loaded in KV
- [ ] Knowledge base loaded in KV
- [ ] Company record created
- [ ] Widget code generated
- [ ] Emergency detection tested
- [ ] Response quality verified
- [ ] Contact info always included
- [ ] Analytics tracking enabled
- [ ] Rate limiting configured
- [ ] Error handling tested
