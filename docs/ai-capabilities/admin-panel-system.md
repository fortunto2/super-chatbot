# Admin Panel System

## Overview

The Super Chatbot admin panel provides comprehensive tools for managing users, balances, and system analytics. Built with Next.js, Drizzle ORM, and modern UI components.

## Architecture

### Components Structure

```
app/admin/
├── layout.tsx              # Admin layout with navigation
├── page.tsx                # Dashboard overview
├── users/
│   └── page.tsx           # User management
├── balances/
│   └── page.tsx           # Balance management
└── ...

components/admin/
├── admin-navigation.tsx    # Sidebar navigation
├── users-table.tsx        # User management table
├── edit-user-dialog.tsx   # User editing modal
├── delete-user-dialog.tsx # User deletion modal
├── balances-management.tsx # Balance operations
├── bulk-balance-dialog.tsx # Bulk operations
└── users-table-skeleton.tsx # Loading skeleton

lib/db/
└── admin-queries.ts       # Admin database queries

app/api/admin/
├── users/
│   ├── route.ts           # GET users list
│   └── [id]/
│       └── route.ts       # GET/PATCH/DELETE user
└── balance/
    └── route.ts           # Balance API endpoints
```

### Authentication & Authorization

**Admin Access Control:**

- Environment variable `ADMIN_EMAILS` defines admin users
- Session-based authentication using NextAuth
- Route-level protection in layouts and API endpoints
- Automatic redirects for unauthorized access

**Security Features:**

- Server-side validation for all operations
- Input sanitization and type checking
- Error handling with proper HTTP status codes
- Session verification on every request

## Features

### 1. Dashboard Overview (`/admin`)

**Statistics Cards:**

- Total users (guests vs registered)
- Total credits in system
- Document creation stats
- Recent activity metrics

**Quick Actions:**

- Direct links to user management
- Balance management shortcuts
- Document browser access

**Recent Users Widget:**

- Latest user registrations
- Current balance display
- User type indicators

### 2. Users Management (`/admin/users`)

**User Table Features:**

- Paginated user list (20 per page)
- Search by email address
- Real-time balance display
- User type badges (Guest/Registered)
- Color-coded balance indicators:
  - Red: ≤ 10 credits (low)
  - Yellow: ≤ 50 credits (medium)
  - Green: > 50 credits (healthy)

**Individual User Actions:**

- Edit balance with preset buttons
- Delete user with confirmation
- View user details

**Search & Pagination:**

- Instant search by email
- Navigation controls
- Results counter
- URL-based state management

### 3. Balance Management (`/admin/balances`)

**Balance Analytics:**

- Total credits across all users
- Average balance per user
- Low balance user count
- Visual statistics cards

**Quick Balance Adjustments:**

- Individual user quick actions (+/-10, +50, +100)
- Real-time balance updates
- Optimistic UI updates

**Bulk Operations:**

- Select multiple users with checkboxes
- Bulk balance operations:
  - Add credits to selected users
  - Subtract credits from selected users
  - Set specific balance for selected users
- Operation preview with estimates
- Batch API requests for performance

### 4. Balance Operations Dialog

**Operation Types:**

1. **Add Credits**: Increase each user's balance by specified amount
2. **Subtract Credits**: Decrease balance (minimum 0)
3. **Set Balance**: Set all selected users to exact amount

**Features:**

- Selected users preview (first 5 shown)
- Current balance totals
- Estimated new totals
- Validation and error handling
- Progress indicators during bulk operations

## API Endpoints

### User Management

**GET /api/admin/users**

```typescript
Query Parameters:
- page: number (default: 1)
- search: string (optional)

Response:
{
  users: User[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number,
    hasNext: boolean,
    hasPrev: boolean
  }
}
```

**GET /api/admin/users/[id]**

```typescript
Response: User | { error: string };
```

**PATCH /api/admin/users/[id]**

```typescript
Body: {
  balance: number;
}
Response: User | { error: string };
```

**DELETE /api/admin/users/[id]**

```typescript
Response: { success: boolean } | { error: string }
```

### Balance Management

**GET /api/admin/balance**

```typescript
Query Parameters:
- userId: string (optional)

Response: { balance: number, status: BalanceStatus }
```

**POST /api/admin/balance**

```typescript
Body: { userId: string, amount: number }
Response: { success: boolean, newBalance: number }
```

**PUT /api/admin/balance**

```typescript
Body: { userId: string, balance: number }
Response: { success: boolean, newBalance: number }
```

## Database Schema

The admin panel works with the existing user schema:

```sql
CREATE TABLE "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(64) NOT NULL,
  password VARCHAR(64),
  balance INTEGER NOT NULL DEFAULT 100
);
```

## Error Handling

**Client-Side:**

- Form validation with real-time feedback
- API error display in UI components
- Loading states for all operations
- Optimistic updates with rollback on error

**Server-Side:**

- Input validation and sanitization
- Database transaction safety
- Proper HTTP status codes
- Detailed error logging

**Error Scenarios:**

- Unauthorized access (401)
- Forbidden operations (403)
- User not found (404)
- Invalid input data (400)
- Server errors (500)

## Performance Optimizations

**Frontend:**

- Pagination to limit data transfer
- Suspense boundaries for loading states
- Optimistic UI updates
- Debounced search inputs

**Backend:**

- Efficient database queries with indexes
- Batch operations for bulk updates
- Connection pooling
- Query result caching

**User Experience:**

- Skeleton loading components
- Progress indicators
- Immediate feedback for actions
- Error recovery mechanisms

## Security Considerations

**Access Control:**

- Admin email whitelist in environment
- Session-based authentication
- Route protection at layout level
- API endpoint authorization

**Data Protection:**

- Input validation and sanitization
- SQL injection prevention via ORM
- XSS protection through proper escaping
- CSRF protection via Next.js

**Audit Trail:**

- Operation logging in console
- Error tracking and monitoring
- User action timestamps
- Balance change tracking

## Usage Guide

### Setting Up Admin Access

1. Add admin emails to environment:

```bash
ADMIN_EMAILS=admin@example.com,manager@example.com
```

2. Ensure user is authenticated with admin email
3. Navigate to `/admin` to access dashboard

### Managing User Balances

**Individual Operations:**

1. Go to `/admin/users` or `/admin/balances`
2. Find user in table
3. Use quick action buttons for common adjustments
4. Or click "Edit Balance" for custom amounts

**Bulk Operations:**

1. Go to `/admin/balances`
2. Select users with checkboxes
3. Click "Bulk Actions" button
4. Choose operation type and amount
5. Review preview and confirm

### Common Workflows

**Low Balance Alert:**

1. Check dashboard for low balance count
2. Go to balance management
3. Filter or search for affected users
4. Use bulk operations to add credits

**New User Setup:**

1. User appears in recent users widget
2. Set appropriate initial balance
3. Monitor usage patterns
4. Adjust balance as needed

## Troubleshooting

**Common Issues:**

1. **"Unauthorized" Error**

   - Check admin email configuration
   - Verify user is logged in
   - Confirm email matches ADMIN_EMAILS

2. **Users Not Loading**

   - Check database connection
   - Verify schema migration status
   - Check API endpoint availability

3. **Balance Updates Failing**

   - Validate input amounts (must be ≥ 0)
   - Check user exists in database
   - Verify API permissions

4. **Bulk Operations Timeout**
   - Reduce selection size
   - Check network connectivity
   - Monitor server resources

## Future Enhancements

**Planned Features:**

- Transaction history and audit logs
- Advanced user filtering and sorting
- Email notifications for low balances
- Usage analytics and reporting
- Automated balance rules and policies
- Role-based admin permissions
- Backup and restore functionality

**Integration Opportunities:**

- Payment system integration
- External user management systems
- Monitoring and alerting tools
- Analytics dashboards
- Automated credit allocation
