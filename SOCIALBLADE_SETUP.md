# SocialBlade API Integration Setup

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```env
# SocialBlade API Credentials
SOCIALBLADE_CLIENT_ID=your_client_id_here
SOCIALBLADE_CLIENT_SECRET=your_client_secret_here
```

## How to Get SocialBlade API Credentials

1. **Visit SocialBlade API**: Go to [https://socialblade.com/api](https://socialblade.com/api)
2. **Sign Up/Login**: Create an account or login to your existing account
3. **Get API Access**: Subscribe to an API plan that fits your needs
4. **Get Credentials**: Once subscribed, you'll receive:
   - `CLIENT_ID` - Your unique client identifier
   - `CLIENT_SECRET` - Your secret token for authentication

## API Usage & Credits

### History Options & Credit Costs
- **Default (1 credit)**: Up to 30 days of historical data
- **Extended (2 credits)**: Up to 1 year of historical data
- **Archive (3 credits)**: Up to 3 years of historical data

### Query Formats Supported
- **Channel ID**: `UCxxxxxxxxxxxxxxxxxxxxxxx` (preferred method)
- **Username**: `username`
- **Custom Username**: `cusername` 
- **Handle**: `@handle` (include the @ symbol)

## Data Mapping

The integration automatically maps SocialBlade data to your database:

### Channel Information
- Basic info (ID, name, handle, description)
- Branding (avatar, banner, website)
- Metadata (country, type, creation date, grade)
- Verification status and content ratings

### Statistics
- Current totals (subscribers, views, uploads)
- Growth metrics (1, 3, 7, 14, 30, 60, 90, 180, 365 days)
- Rankings (global, country, category)

### Historical Data
- Daily subscriber and view counts
- Up to 3 years of data depending on plan
- Automatically stored in time-series format

## Usage Instructions

1. **Navigate to Channel Management** → **Fetch from SocialBlade** tab
2. **Enter Query**: Channel ID, username, or @handle
3. **Select History Range**: Choose based on your credit budget
4. **Click Fetch**: Data will be automatically imported and saved
5. **View Results**: See detailed information and confirmation

## Features

### Smart Data Import
- ✅ **Automatic mapping** to existing database schema
- ✅ **Upsert functionality** - updates existing channels or creates new ones
- ✅ **Historical data import** - populates time-series tables
- ✅ **Error handling** - graceful failure with detailed messages

### User Experience
- ✅ **Real-time feedback** - progress indicators and status updates
- ✅ **Credit tracking** - shows remaining credits and costs
- ✅ **Data preview** - detailed view of imported information
- ✅ **Validation** - input validation and error prevention

### Integration Benefits
- ✅ **Comprehensive data** - much more than basic YouTube API
- ✅ **Rankings included** - SocialBlade exclusive ranking data
- ✅ **Growth metrics** - detailed growth statistics
- ✅ **Historical trends** - long-term performance data

## Troubleshooting

### Common Issues

**"SocialBlade API credentials not configured"**
- Make sure you've added the environment variables to `.env.local`
- Restart your development server after adding variables

**"No data returned from SocialBlade"**
- Check if the channel ID/username/handle is correct
- Some channels may not be tracked by SocialBlade

**"HTTP 401/403 errors"**
- Verify your API credentials are correct
- Check if you have sufficient credits remaining
- Ensure your API subscription is active

**"Channel not found"**
- Try different query formats (ID vs username vs handle)
- Some channels may use different identifiers

### API Limits
- Monitor your credit usage in the interface
- Consider using "Allow stale data" for development
- Use "Default" history option to conserve credits during testing

## Next Steps

After setting up the integration:

1. **Test with a known channel** to verify the setup works
2. **Import your tracked channels** to get comprehensive data
3. **Set up regular imports** for keeping data current
4. **Use the chart builder** to visualize the imported data

The integration provides much richer data than basic APIs, including exclusive SocialBlade rankings and comprehensive growth metrics that will enhance your YouTube analytics dashboard significantly.










