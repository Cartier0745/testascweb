# Azure Communication Service Teams Video calling
![No slider (1)](https://github.com/Cartier0745/testascweb/assets/102744633/2e56d4e4-c175-44c0-8e64-ddc11067f718)

- document on client side: https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/voice-video-calling/get-started-with-voice-video-calling-custom-teams-client
- add server side added to get token.
- add camera options


run on localhost

1. modify index.js

```javascript
const clientId = "{client-id}"
const tenantId = "{tenant-id}"
const connectionString = "{acs_connectionstring}"

```
change protocal to 'http' or req.protocol
```
const getRedirectUri = (req) => {
  return url.format({
    protocol: 'https',
    host: req.get('host'),
    pathname: 'redirect'
  });
}
```

2. start server
```javascript
npm run dev
```

