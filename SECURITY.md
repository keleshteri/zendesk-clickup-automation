# Security Implementation

## Webhook Authentication

The Zendesk webhook endpoint is now secured with Bearer token authentication to prevent unauthorized access.

### How It Works

1. **Webhook Secret**: A secure random token is generated and stored as `WEBHOOK_SECRET` environment variable
2. **Authorization Header**: All requests to `/zendesk-webhook` must include the correct Bearer token
3. **Request Validation**: Requests without proper authorization receive a 401 Unauthorized response

### Current Webhook Secret

```
Bearer test
```

⚠️ **Important**: Keep this secret secure and only share it with authorized Zendesk webhook configurations.

### Usage Examples

#### ✅ Authorized Request (Success)
```bash
curl -X POST https://zendesk-clickup-automation.mehdi-shaban-keleshteri.workers.dev/zendesk-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test" \
  -d '{
    "type": "ticket.created",
    "detail": {
      "id": "12345",
      "subject": "Test Ticket",
      "description": "Test Description",
      "priority": "high",
      "status": "new"
    }
  }'
```

#### ❌ Unauthorized Request (Rejected)
```bash
curl -X POST https://zendesk-clickup-automation.mehdi-shaban-keleshteri.workers.dev/zendesk-webhook \
  -H "Content-Type: application/json" \
  -d '{ "type": "ticket.created", "detail": {...} }'
```

Response: `{"status":"error","message":"Unauthorized - Invalid webhook secret"}`

### Configuring Zendesk Webhooks

When setting up the webhook in Zendesk:

1. **URL**: `https://zendesk-clickup-automation.mehdi-shaban-keleshteri.workers.dev/zendesk-webhook`
2. **Method**: `POST`
3. **Headers**: Add `Authorization: Bearer test`
4. **Events**: Select `ticket.created` or similar events

### Security Benefits

- ✅ **Prevents unauthorized access** - Only requests with valid tokens are processed
- ✅ **Protects against abuse** - Random users cannot create ClickUp tasks
- ✅ **Audit trail** - All unauthorized attempts are logged
- ✅ **Easy to rotate** - Webhook secret can be regenerated if compromised

### Regenerating the Webhook Secret

If the secret is compromised, generate a new one:

```bash
# Generate new secret and update Cloudflare Workers
$newSecret = [System.Web.Security.Membership]::GeneratePassword(32, 8)
echo $newSecret | npx wrangler secret put WEBHOOK_SECRET

# Update Zendesk webhook configuration with new Bearer token
```

### Environment Variables

All required environment variables:

- `CLICKUP_TOKEN` - ClickUp API token
- `CLICKUP_LIST_ID` - Target ClickUp list ID
- `WEBHOOK_SECRET` - Security token for webhook authentication
- `ZENDESK_TOKEN` (optional) - For future Zendesk API integration
- `ZENDESK_EMAIL` (optional) - For future Zendesk API integration
- `ZENDESK_DOMAIN` (optional) - For future Zendesk API integration