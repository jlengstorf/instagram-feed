# Instagram Feed Reader

This app is a practical application of functional programming using [Ramda](http://ramdajs.com/). It's part of a [video tutorial](https://code.lengstorf.com/learn-functional-programming-ramda/).

## Installation

### 1. Clone the repo.

``` sh
# Clone the repo
git clone https://github.com/jlengstorf/instagram-feed.git

# Move into the cloned repo
cd instagram-feed/

# Install dependencies
npm install
```

### 2. Create an Instagram client.

Create an [Instagram client](https://www.instagram.com/developer/clients/manage/) and copy the Client ID.

Make sure to set the "Valid redirect URIs" in the "Security" tab. (For development, this is `http://127.0.0.1:8080/`.)

### 3. Set environment variables.

``` sh
# Create a `.env` file
cp .env.EXAMPLE .env
```

Edit `.env` and set the `IG_CLIENT_ID` and `IG_REDIRECT_URI` variables with your own Client ID and redirect URI.

### 4. Start the app.

``` sh
# Start the app in development mode
npm run dev
```

Once the app is running, you can open it at [127.0.0.1:8080](http://127.0.0.1:8080/) and authorize your Instagram account.

## Production Build

``` sh
# Run the production build script
npm run build
```
