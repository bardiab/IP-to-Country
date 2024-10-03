# IP to Country API

This API provides country information for a given IP address, using multiple vendor APIs with configurable rate limits.

## Setup

1. Clone the repository:
```
git clone <repository-url>
cd <repository-name>
```
2. Install dependencies:
```
npm install
```
3. Create a `.env` file in the root directory with your API keys and port:
```
PORT=3000
IPSTACK_API_KEY=<your key here>
```
4. Build the TypeScript code:
```
npm run build
```

## Running the Server
Start the Server with: 
```npm start```

The server will run on `http://localhost:3000` by default.

## API Endpoints

1. Get country for an IP:
```
GET /ip-to-country/:ip
```

2. Configure rate limits:
```
POST /config/rate-limit
Body: { "vendor": "primaryVendor", "limit": 50 }
```

## E2E Testing
To test the API end-to-end, first make sure the server is running.

1. Test getting country for an IP:
```
curl http://localhost:3000/ip-to-country/8.8.8.8
```
Expected output: JSON with IP and country.

2. Test configuring rate limits: 
```
curl -X POST -H "Content-Type: application/json" -d '{"vendor":"primaryVendor","limit":50}' http://localhost:3000/config/rate-limit
```
Expected output: configuration message.

3. Test rate limiting: 
- Repeatedly call the `/ip-to-country/:ip` endpoint until you hit the rate limit.
- Verify that the API switches to the secondary vendor by checking console logs.
- If both rate limits are exceeded, verify that an appropriate error is returned.

## Running Tests
Run the unit tests with: 
```
npm test
```
This will execute the Jest Unit tests for the application.
