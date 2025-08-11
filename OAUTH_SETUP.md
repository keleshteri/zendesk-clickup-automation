# ClickUp OAuth Setup Guide 🔐

This guide will help you set up ClickUp OAuth authentication to avoid "Team not authorized" errors with company workspaces.

## Why OAuth? 

**API Token Issues:**
- ❌ Personal API tokens can't access company/team workspaces
- ❌ Gets "Team not authorized" (OAUTH_027) errors
- ❌ Limited permissions

**OAuth Benefits:**
- ✅ Full workspace access with user permission
- ✅ Works with company/enterprise ClickUp accounts  
- ✅ Secure enterprise-grade authentication
- ✅ Token refresh capabilities

## Step 1: Create ClickUp OAuth App

1. **Go to ClickUp Apps Settings**
   - Visit: https://app.clickup.com/settings/apps
   - Click **"Create an App"**

2. **Fill App Details**
   ```
   App Name: TaskGenie
   Description: Zendesk-ClickUp Integration
   Website: https://your-domain.com (optional)
   ```

3. **Set Redirect URI**
   ```
   Redirect URI: https://your-worker-domain.workers.dev/auth/clickup/callback
   ```
   
   Replace `your-worker-domain` with your actual Cloudflare Worker domain.

4. **Get OAuth Credentials**
   - Copy the **Client ID**
   - Copy the **Client Secret** 
   - Save these for environment variables

## Step 2: Configure Environment Variables

Add these to your Cloudflare Worker environment:

```bash
# ClickUp OAuth Configuration (required for company workspaces)
CLICKUP_CLIENT_ID="your_oauth_client_id"
CLICKUP_CLIENT_SECRET="your_oauth_client_secret" 
CLICKUP_REDIRECT_URI="https://your-worker-domain.workers.dev/auth/clickup/callback"

# Still required: Target list ID
CLICKUP_LIST_ID="your_list_id"

# Optional: Keep API token as fallback (for personal use)
CLICKUP_TOKEN="your_api_token"
```

## Step 3: Authorize TaskGenie

1. **Start OAuth Flow**
   ```
   GET https://your-worker-domain.workers.dev/auth/clickup
   ```

2. **Follow Authorization**
   - Visit the `auth_url` returned from the above request
   - Log into your ClickUp account
   - Grant permissions to TaskGenie
   - You'll be redirected back automatically

3. **Verify Authorization**
   ```
   GET https://your-worker-domain.workers.dev/auth/status
   ```

## Step 4: Test Integration

1. **Test ClickUp Connection**
   ```bash
   curl -X POST https://your-worker-domain.workers.dev/test-clickup \
     -H "Content-Type: application/json" \
     -d '{"action": "test_auth"}'
   ```

2. **Create Test Task**
   ```bash
   curl -X POST https://your-worker-domain.workers.dev/test-clickup \
     -H "Content-Type: application/json" \
     -d '{"action": "create_test_task"}'
   ```

3. **Test Webhook**
   - Create a Zendesk ticket
   - Should now create ClickUp task successfully! 🎉

## OAuth Flow Details

### Available Endpoints:
- **`GET /auth/clickup`** - Start OAuth authorization
- **`GET /auth/clickup/callback`** - OAuth callback handler  
- **`GET /auth/status`** - Check authorization status

### How It Works:
1. **Authorization**: User grants TaskGenie access to their ClickUp workspace
2. **Token Exchange**: OAuth code is exchanged for access token
3. **Storage**: Token is stored securely in KV storage
4. **Usage**: Webhooks automatically use OAuth token for API calls
5. **Fallback**: Falls back to API token if OAuth not available

## Troubleshooting

### "OAuth Service Not Available"
- Check `CLICKUP_CLIENT_ID` is set
- Check `CLICKUP_CLIENT_SECRET` is set  
- Check `CLICKUP_REDIRECT_URI` matches your worker domain

### "Team not authorized" Still Happening  
- Complete OAuth flow: visit `/auth/clickup`
- Check authorization status: visit `/auth/status`
- Verify you granted permissions to the correct workspace

### Token Expired
- Tokens expire after some time
- Re-run OAuth flow: visit `/auth/clickup` again
- System will automatically refresh when possible

### Callback Issues
- Verify redirect URI in ClickUp app settings exactly matches your worker URL
- Check the worker domain is correct and accessible

## Security Notes

- OAuth state parameter prevents CSRF attacks
- Tokens are stored securely in Cloudflare KV
- Only authorized users can access company workspaces
- Follows OAuth 2.0 security best practices

## Production Setup

For production environments:
1. Use your actual production worker domain in redirect URI
2. Set up proper KV namespace binding  
3. Configure environment variables in Cloudflare dashboard
4. Test the complete flow before going live

---

**Need Help?** Check the logs in your Cloudflare Worker dashboard for detailed error messages.