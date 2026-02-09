# User Tracking Guide for Trophy Bazaar (Droplet Hosted)

## Overview
Track daily users, sessions, and user behavior on your DigitalOcean droplet.

---

## **Option 1: Google Analytics (Recommended - FREE)**

### ✅ Pros
- Free tier supports unlimited data
- Beautiful dashboards and reports
- Automatic daily/weekly/monthly user tracking
- Device, location, browser data included
- No server-side changes needed
- Easy setup (10 minutes)

### ❌ Cons
- Depends on Google's service (minor downtime risk)
- Data goes to Google (privacy consideration)
- 24-48 hour delay in some reports

### Setup Steps

#### Step 1: Create Google Analytics Account
1. Go to https://analytics.google.com
2. Sign in with your Google account (or create one)
3. Click "Start measuring" → Create new property
4. Fill in details:
   - Property name: "Trophy Bazaar"
   - URL: https://trophybazaar.in
   - Industry: Retail
5. Copy your **Measurement ID** (starts with `G-`)

#### Step 2: Update Your Code
1. Replace `YOUR_GA_ID` in `/lib/analytics.ts` with your Measurement ID

2. Update `app/layout.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeAnalytics, trackPageView } from '@/lib/analytics';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    initializeAnalytics();
  }, []);

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
```

#### Step 3: View Your Data
- Dashboard: https://analytics.google.com → Select your property
- **Daily Users**: Reports → User → Active users (by date)
- **Location**: Reports → User → Geographic
- **Device**: Reports → Device → Overview
- **Pages**: Reports → Pages and Screens

---

## **Option 2: Self-Hosted Analytics (More Control)**

Track users in your own SQL Server database.

### ✅ Pros
- Full data control (on your droplet)
- No privacy concerns
- Real-time data
- Custom reports possible

### ❌ Cons
- Requires backend changes
- Need to manage database storage
- More complex setup

### Implementation

#### Step 1: Create Analytics Table
Run this SQL on your database:

```sql
CREATE TABLE UserVisits (
    Id INT PRIMARY KEY IDENTITY(1,1),
    VisitDate DATETIME DEFAULT GETDATE(),
    UserId NVARCHAR(MAX),
    PageUrl NVARCHAR(500),
    UserAgent NVARCHAR(MAX),
    IpAddress NVARCHAR(45),
    ReferrerUrl NVARCHAR(500),
    SessionId NVARCHAR(100),
    Country NVARCHAR(100),
    Browser NVARCHAR(100),
    DeviceType NVARCHAR(50)
);

CREATE INDEX IDX_VisitDate ON UserVisits(VisitDate);
CREATE INDEX IDX_PageUrl ON UserVisits(PageUrl);
```

#### Step 2: Create API Endpoint
Add to `giftusApi/Controllers/AnalyticsController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using giftusApi.Data;
using System;
using System.Linq;

namespace giftusApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly GiftusDbContext _context;

        public AnalyticsController(GiftusDbContext context)
        {
            _context = context;
        }

        [HttpPost("track")]
        public IActionResult TrackVisit([FromBody] VisitData visitData)
        {
            try
            {
                var userAgent = Request.Headers["User-Agent"].ToString();
                var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();

                // Parse browser and device from user agent
                var browser = ParseBrowser(userAgent);
                var deviceType = ParseDeviceType(userAgent);

                // Insert into database
                var query = $@"
                    INSERT INTO UserVisits (UserId, PageUrl, UserAgent, IpAddress, ReferrerUrl, SessionId, Browser, DeviceType)
                    VALUES ('{visitData.UserId}', '{visitData.PageUrl}', '{userAgent}', '{ipAddress}', '{visitData.ReferrerUrl}', '{visitData.SessionId}', '{browser}', '{deviceType}')
                ";

                _context.Database.ExecuteSqlRaw(query);

                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("daily-users")]
        public IActionResult GetDailyUsers(int days = 30)
        {
            var query = $@"
                SELECT CAST(VisitDate AS DATE) as Date, COUNT(DISTINCT UserId) as UserCount
                FROM UserVisits
                WHERE VisitDate >= DATEADD(DAY, -{days}, GETDATE())
                GROUP BY CAST(VisitDate AS DATE)
                ORDER BY Date DESC
            ";

            var results = _context.Database.ExecuteSqlRaw(query);
            return Ok(results);
        }

        private string ParseBrowser(string userAgent)
        {
            if (userAgent.Contains("Chrome")) return "Chrome";
            if (userAgent.Contains("Safari")) return "Safari";
            if (userAgent.Contains("Firefox")) return "Firefox";
            if (userAgent.Contains("Edge")) return "Edge";
            return "Other";
        }

        private string ParseDeviceType(string userAgent)
        {
            if (userAgent.Contains("Mobile")) return "Mobile";
            if (userAgent.Contains("Tablet")) return "Tablet";
            return "Desktop";
        }
    }

    public class VisitData
    {
        public string UserId { get; set; }
        public string PageUrl { get; set; }
        public string ReferrerUrl { get; set; }
        public string SessionId { get; set; }
    }
}
```

#### Step 3: Frontend Tracking
Create `/lib/selfHostedAnalytics.ts`:

```typescript
export const trackUserVisit = async (pageUrl: string) => {
  const sessionId = localStorage.getItem('sessionId') || generateSessionId();
  localStorage.setItem('sessionId', sessionId);

  await fetch('http://localhost:5056/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: sessionId,
      pageUrl: pageUrl,
      referrerUrl: document.referrer,
      sessionId: sessionId,
    }),
  });
};

const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};
```

---

## **Option 3: Simple File Logging (Minimal Setup)**

Log to a file on your droplet.

### Implementation

Create `/lib/fileAnalytics.ts`:

```typescript
export const logUserVisit = async (pageUrl: string) => {
  await fetch('/api/log-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pageUrl,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }),
  });
};
```

Create API route `pages/api/log-visit.ts`:

```typescript
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const logFile = path.join(process.cwd(), 'logs', 'visits.log');
    const logData = `${new Date().toISOString()} - ${req.body.pageUrl} - ${req.body.userAgent}\n`;

    await fs.appendFile(logFile, logData);
    res.status(200).json({ success: true });
  }
}
```

View logs via SSH:
```bash
ssh user@your_droplet_ip
tail -f /path/to/logs/visits.log
wc -l /path/to/logs/visits.log  # Count total visits
```

---

## **Option 4: Third-Party Services (Paid)**

| Service | Free Tier | Cost | Best For |
|---------|-----------|------|----------|
| Mixpanel | 1000 events/month | $999+/month | Advanced analytics |
| Amplitude | 10M events/month | $995+/month | Product analytics |
| Plausible | No free tier | $9/month | Privacy-focused |
| Fathom | No free tier | $14/month | Simple & fast |

---

## **Recommendations**

### For Your Business:
1. **Start with Google Analytics** (Option 1)
   - ✅ Free
   - ✅ Professional reports
   - ✅ Easy setup (copy-paste)
   - ✅ Shows daily users, location, devices

2. **Add Self-Hosted Later** (Option 2)
   - When you need custom reports
   - When you need real-time data
   - When privacy is critical

---

## **Quick Implementation Checklist**

**Google Analytics (Fastest)**:
- [ ] Create GA account (2 min)
- [ ] Copy Measurement ID
- [ ] Replace `YOUR_GA_ID` in `/lib/analytics.ts`
- [ ] Deploy changes
- [ ] Wait 24 hours for data
- [ ] View dashboard

**Self-Hosted (Complete Control)**:
- [ ] Create `UserVisits` table in database
- [ ] Create `AnalyticsController.cs`
- [ ] Create tracking frontend code
- [ ] Deploy backend
- [ ] Add tracking to pages
- [ ] Query data via API

---

## **Key Metrics You'll Get**

### Daily Users
- Unique visitors per day
- Trending over time
- Compare week-to-week

### User Sessions
- Session duration
- Pages per session
- Bounce rate

### Traffic Sources
- Direct traffic
- Referral traffic
- Search engines

### Device & Location
- Desktop vs mobile
- Countries visiting
- Browser usage

### Popular Pages
- Which pages get most traffic
- Time on page
- Conversion rates

---

## **Important Notes**

### For SSL/HTTPS (Recommended)
If you're using HTTPS (recommended for Razorpay payments), Google Analytics works automatically.

### For Email Tracking
Track email campaign links with UTM parameters:
```
https://trophybazaar.in/?utm_source=email&utm_medium=newsletter&utm_campaign=january
```

### GDPR Compliance
If tracking EU users:
1. Add cookie consent banner
2. Enable anonymize_ip in Google Analytics
3. Update privacy policy
4. Allow users to opt-out

### Privacy Best Practices
1. Avoid collecting PII (Personal Identifiable Information)
2. Use anonymous session IDs
3. Comply with local privacy laws
4. Be transparent about tracking

