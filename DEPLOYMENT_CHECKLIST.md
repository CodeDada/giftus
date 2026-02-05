# 🚀 TrophyBazaar Deployment Checklist

## Pre-Deployment Verification

### Development Environment ✅

- [x] Backend builds successfully (`dotnet build`)
- [x] Frontend builds successfully (`npm run build`)
- [x] All unit tests pass
- [x] No compiler errors or warnings
- [x] Code review completed
- [x] Documentation reviewed

### Code Quality ✅

- [x] Error handling implemented
- [x] Logging configured
- [x] Input validation added
- [x] Security measures in place
- [x] Performance optimized
- [x] Code comments added

### Testing Completed ✅

- [x] Functional testing done
- [x] Integration testing done
- [x] Security testing done
- [x] Database operations verified
- [x] API endpoints tested
- [x] Payment flow verified

---

## Configuration Checklist

### Backend Configuration

- [ ] Update `appsettings.json` with production Razorpay keys
  ```json
  {
    "Razorpay": {
      "KeyId": "rzp_live_ACTUAL_KEY",
      "KeySecret": "ACTUAL_SECRET"
    }
  }
  ```
- [ ] Update database connection string for production
- [ ] Set environment to "Production"
- [ ] Configure logging paths
- [ ] Set up error reporting/monitoring

### Frontend Configuration

- [ ] Update `.env.production`
  ```
  NEXT_PUBLIC_API_URL=https://api.trophybazaar.in
  NEXT_PUBLIC_RAZORPAY_KEY=rzp_live_ACTUAL_KEY
  ```
- [ ] Update domain in CORS settings if needed
- [ ] Configure analytics (if needed)
- [ ] Update external service URLs
- [ ] Test all environment variables

### Database Configuration

- [ ] Verify SQL Server is running
- [ ] Check database exists
- [ ] Verify user permissions
- [ ] Backup existing database
- [ ] Run EF Core migrations
  ```bash
  dotnet ef database update --project giftusApi
  ```
- [ ] Verify all tables created
  ```sql
  SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'dbo'
  ```
- [ ] Check foreign keys
- [ ] Verify indexes

### Server Configuration

- [ ] Install .NET 8 runtime
- [ ] Install Node.js (v18+)
- [ ] Configure firewall rules
  - [ ] Port 80 (HTTP)
  - [ ] Port 443 (HTTPS)
  - [ ] Port 5056 (API internal)
  - [ ] Port 3000 (Frontend, if applicable)
- [ ] Install SSL certificates
- [ ] Configure reverse proxy (IIS/Nginx)
- [ ] Set up automatic backups
- [ ] Configure logging and monitoring

---

## Database Verification

### Schema Verification

```sql
-- Verify all tables exist
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

-- Expected: Orders, OrderItems, PaymentTransactions,
--           OrderStatusHistories, OrderRefunds, Products, Categories, etc.
```

### Relationships Verification

```sql
-- Check foreign keys
SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
WHERE CONSTRAINT_TYPE = 'FOREIGN KEY';
```

### Data Verification

- [ ] No test data in production
- [ ] Orders table empty (new deployment)
- [ ] Customers table has required admin users
- [ ] Products table populated with catalog

---

## Deployment Steps

### Step 1: Prepare Deployment Package

**Backend:**

```bash
cd giftusApi
dotnet publish -c Release -o ./publish
```

**Frontend:**

```bash
cd giftusUI
npm run build
# Next.js creates .next folder
```

### Step 2: Backup Current System

```bash
# Backup database
BACKUP DATABASE giftus TO DISK = '/backups/giftus_backup_2024.bak'

# Backup current files
cp -r /app/giftusapi /backups/giftusapi_backup_2024
cp -r /app/giftusui /backups/giftusui_backup_2024
```

### Step 3: Deploy Backend

```bash
# Stop current service
systemctl stop giftusapi

# Copy published files
cp -r ./giftusApi/publish/* /app/giftusapi/

# Set permissions
chown -R www-data:www-data /app/giftusapi

# Start service
systemctl start giftusapi

# Verify status
systemctl status giftusapi
```

### Step 4: Deploy Frontend

```bash
# Copy build files
cp -r ./giftusUI/.next /app/giftusui/
cp -r ./giftusUI/public /app/giftusui/

# Set permissions
chown -R www-data:www-data /app/giftusui

# Restart web server
systemctl restart nginx
```

### Step 5: Run Database Migrations

```bash
cd /app/giftusapi
dotnet ef database update
```

### Step 6: Verify Deployment

```bash
# Check backend health
curl https://api.trophybazaar.in/api/helloworld/health

# Check frontend loads
curl https://trophybazaar.in

# Check logs
tail -f /var/log/giftusapi/application.log
```

---

## Post-Deployment Testing

### Automated Tests

- [ ] Run API endpoint tests
- [ ] Run database integrity checks
- [ ] Run security scans
- [ ] Run performance tests

### Manual Testing

- [ ] Test checkout flow end-to-end
- [ ] Test payment with test card
- [ ] Verify order creation
- [ ] Check order confirmation email (if enabled)
- [ ] Verify database records created
- [ ] Test order history retrieval
- [ ] Test error scenarios

### Payment Testing

- [ ] Create test order
- [ ] Process test payment (use test card: 4111 1111 1111 1111)
- [ ] Verify payment recorded in database
- [ ] Check payment transaction table
- [ ] Verify order status updated
- [ ] Test payment failure scenarios

### Database Testing

```sql
-- Check recent orders
SELECT TOP 10 * FROM Orders ORDER BY CreatedAt DESC;

-- Check payments
SELECT TOP 10 * FROM PaymentTransactions ORDER BY CreatedAt DESC;

-- Check status history
SELECT * FROM OrderStatusHistories ORDER BY CreatedAt DESC;
```

---

## Monitoring Setup

### Application Monitoring

- [ ] Set up application insights
- [ ] Configure error logging
- [ ] Set up performance monitoring
- [ ] Configure alerts for:
  - [ ] API errors
  - [ ] Database connection failures
  - [ ] Payment processing failures
  - [ ] High response times

### Server Monitoring

- [ ] CPU usage alerts
- [ ] Memory usage alerts
- [ ] Disk space alerts
- [ ] Network traffic alerts
- [ ] Service availability alerts

### Database Monitoring

- [ ] Set up backup alerts
- [ ] Configure maintenance jobs
- [ ] Monitor query performance
- [ ] Set up replication/failover
- [ ] Configure slow query logging

---

## Security Verification

### SSL/TLS

- [ ] SSL certificate installed
- [ ] Certificate valid for all domains
- [ ] Certificate auto-renewal configured
- [ ] HTTPS enforced
- [ ] Redirects HTTP to HTTPS

### Application Security

- [ ] Razorpay signatures verified
- [ ] Input validation active
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers set:
  - [ ] X-Content-Type-Options
  - [ ] X-Frame-Options
  - [ ] Content-Security-Policy

### Database Security

- [ ] Database user has minimal permissions
- [ ] Connection encrypted
- [ ] Backups encrypted
- [ ] Access logs enabled
- [ ] Sensitive data masked in logs

### Secrets Management

- [ ] Razorpay keys not in code
- [ ] Database passwords not in code
- [ ] Using environment variables
- [ ] Using secrets management system
- [ ] Regular key rotation schedule

---

## Performance Verification

### API Performance

- [ ] Response time < 500ms
- [ ] Payment endpoint < 2s
- [ ] Database queries optimized
- [ ] Caching configured (if needed)
- [ ] Load testing completed

### Database Performance

- [ ] Indexes properly configured
- [ ] Query execution plans optimal
- [ ] Connection pooling enabled
- [ ] Slow logs reviewed
- [ ] Statistics updated

### Frontend Performance

- [ ] Page load time < 3s
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] JavaScript minified
- [ ] CSS minified

---

## Rollback Plan

### If Deployment Fails

1. Stop services

   ```bash
   systemctl stop giftusapi
   systemctl stop nginx
   ```

2. Restore from backup

   ```bash
   # Restore backend
   cp -r /backups/giftusapi_backup_2024/* /app/giftusapi/

   # Restore frontend
   cp -r /backups/giftusui_backup_2024/* /app/giftusui/

   # Restore database
   RESTORE DATABASE giftus FROM DISK = '/backups/giftus_backup_2024.bak'
   ```

3. Restart services

   ```bash
   systemctl start giftusapi
   systemctl start nginx
   ```

4. Verify restoration
   ```bash
   curl https://api.trophybazaar.in/api/helloworld/health
   ```

---

## Post-Deployment Documentation

### Update Documentation

- [ ] Update API documentation
- [ ] Update deployment guide
- [ ] Update configuration guide
- [ ] Document any custom changes
- [ ] Update runbook
- [ ] Document known issues

### Knowledge Transfer

- [ ] Brief development team
- [ ] Brief support team
- [ ] Brief operations team
- [ ] Document troubleshooting steps
- [ ] Create training materials

### Communication

- [ ] Notify stakeholders of deployment
- [ ] Update status page
- [ ] Send deployment notification
- [ ] Document deployment date/time
- [ ] Log deployment details

---

## Sign-Off

| Role            | Name                 | Date             | Signature        |
| --------------- | -------------------- | ---------------- | ---------------- |
| Backend Lead    | ******\_\_\_\_****** | **_/_**/\_\_\_\_ | ****\_\_\_\_**** |
| Frontend Lead   | ******\_\_\_\_****** | **_/_**/\_\_\_\_ | ****\_\_\_\_**** |
| DevOps/SysAdmin | ******\_\_\_\_****** | **_/_**/\_\_\_\_ | ****\_\_\_\_**** |
| QA Lead         | ******\_\_\_\_****** | **_/_**/\_\_\_\_ | ****\_\_\_\_**** |
| Product Manager | ******\_\_\_\_****** | **_/_**/\_\_\_\_ | ****\_\_\_\_**** |

---

## Deployment History

| Date         | Version  | Environment    | Status       | Notes                |
| ------------ | -------- | -------------- | ------------ | -------------------- |
| 2024-01-15   | 1.0.0    | Staging        | Pending      | Initial deployment   |
| ****\_\_**** | **\_\_** | ****\_\_\_**** | **\_\_\_\_** | ******\_\_\_\_****** |
| ****\_\_**** | **\_\_** | ****\_\_\_**** | **\_\_\_\_** | ******\_\_\_\_****** |

---

## Support Contacts

| Role           | Name                 | Email                    | Phone        |
| -------------- | -------------------- | ------------------------ | ------------ |
| Backend Lead   | ******\_\_\_\_****** | ____________@company.com | ****\_\_**** |
| DevOps Lead    | ******\_\_\_\_****** | ____________@company.com | ****\_\_**** |
| Database Admin | ******\_\_\_\_****** | ____________@company.com | ****\_\_**** |
| Support        | ******\_\_\_\_****** | support@company.com      | ****\_\_**** |

---

## Important Links

- **API Documentation:** `/openapi/v1.json`
- **Status Dashboard:** `https://status.trophybazaar.in`
- **Monitoring:** `https://monitoring.company.com`
- **Backup Location:** `/backups/`
- **Log Location:** `/var/log/giftusapi/`
- **Documentation:** See DOCUMENTATION_INDEX.md

---

**Deployment Date:** ******\_\_\_\_******

**Deployed By:** ******\_\_\_\_******

**Approved By:** ******\_\_\_\_******

**Notes:**

---

---

---

---

_For questions or issues, refer to DOCUMENTATION_INDEX.md or contact support@trophybazaar.in_
