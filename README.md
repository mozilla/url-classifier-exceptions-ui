
# URL Classifier Exceptions UI

UI displaying URL Classifier Exceptions stored in RemoteSettings.

## Development

### Getting Started

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Linting

You can auto format code via:

```bash
npm run lint[-fix]
```

### Updating Exception List Entry Type

The format for exception list entries is determined by Remote Settings. To
generate the latest TypeScript type definitions based on the schema from Remote
Settings you can use:

```bash
npm run update-types
```

### Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.
