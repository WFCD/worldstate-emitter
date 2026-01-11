# Test Suite Documentation

## Overview

The worldstate-emitter test suite includes both **unit tests with mocks** and **integration tests** to ensure comprehensive coverage of the codebase.

## Test Structure

```
test/
├── fixtures/              # Mock data for testing
│   ├── rss.ts            # RSS feed mock data
│   └── worldstate.ts     # Worldstate mock data
├── helpers/               # Test utilities
│   └── mocks.ts          # Mock helper functions
├── specs/                 # Unit tests (FAST - with mocks)
│   ├── cache.spec.ts     # Cache utility tests
│   ├── emitter.spec.ts   # Main emitter tests
│   ├── parse.spec.ts     # Event parsing tests
│   └── rss.spec.ts       # RSS handler tests
└── integration/           # Integration tests (SLOW - real APIs)
    └── access.spec.ts    # Real worldstate API tests
```

## Running Tests

```bash
# Run unit tests only (fast, < 10s)
npm test

# Run integration tests only (slow, real APIs, up to 250s)
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run tests with coverage
npm run coverage

# Run specific test file
npx mocha test/specs/cache.spec.ts

# Run tests in watch mode
npm run dev
```

## Test Categories

### Unit Tests (Fast, with Mocks)

Unit tests use mocks to isolate components and test them independently:

- **RSS Handler Tests** (`rss.spec.ts`)
  - RSS feed initialization
  - Event emission
  - Image extraction from descriptions
  - HTML stripping
  - Error handling

- **Cache Tests** (`cache.spec.ts`)
  - Data retrieval
  - Update events
  - Multiple listeners
  - Rapid updates

- **Event Parser Tests** (`parse.spec.ts`)
  - Cycle-like events (day/night cycles)
  - Array events (multiple simultaneous events)
  - Single object events
  - Event filtering
  - Platform/language handling

- **Emitter Tests** (`emitter.spec.ts`)
  - Initialization with various options
  - Event emission and reception
  - Data retrieval methods
  - Feature toggling
  - Debug information

### Integration Tests (Slow, Real Data)

Integration tests use real APIs and data. They are separated from unit tests to keep the development feedback loop fast.

**Configuration:**
- Located in: `test/integration/`
- Config file: `.mocharc.integration.yml`
- Timeout: 250 seconds (to allow for slow API responses)
- Network: Requires internet connection

**Tests:**
- **Access Tests** (`integration/access.spec.ts`)
  - Real worldstate data retrieval from Warframe API
  - Data structure validation
  - Parser integration
  - Waits up to 240 seconds for real data

**When to Run:**
- Before releasing new versions
- After making changes to API handlers
- Daily via CI (automated at 4am Chicago time)
- Manually when debugging production issues

**CI Integration:**
The integration tests run automatically:
- **Daily Schedule**: Every day at 4am Chicago time (9am UTC)
- **Manual Trigger**: Can be triggered from GitHub Actions UI
- **On Changes**: When handlers or integration tests are modified
- **Failure Notification**: Creates/updates a GitHub issue if tests fail

To view or trigger the workflow:
1. Go to the Actions tab in GitHub
2. Select "Integration Tests" workflow
3. Click "Run workflow" to trigger manually

## Mock Utilities

### createMockEmitter()

Creates a mock EventEmitter for testing events.

```typescript
const emitter = createMockEmitter();
emitter.on("event", (data) => console.log(data));
```

### createMockCache(initialData?)

Creates a mock Cache instance with controllable data.

```typescript
const cache = createMockCache("initial data");
await cache.get(); // Returns 'initial data'
cache.trigger("new data"); // Triggers update event
```

### createSpy()

Creates a spy function to track calls.

```typescript
const spy = createSpy();
spy("arg1", "arg2");
console.log(spy.callCount); // 1
console.log(spy.calls); // [['arg1', 'arg2']]
```

### waitForEvent(emitter, event, timeout?)

Waits for an event to be emitted.

```typescript
const data = await waitForEvent(emitter, "data", 5000);
```

### createMockRssFeedEmitter()

Creates a mock RSS feed emitter.

```typescript
const feeder = createMockRssFeedEmitter();
feeder.add({ url: "https://example.com/feed" });
feeder.trigger("new-item", mockRSSItem);
```

## Mock Data Fixtures

### RSS Fixtures (`test/fixtures/rss.ts`)

- `mockRSSItem`: Complete RSS item with image
- `mockRSSItemWithoutImage`: RSS item without image
- `mockRSSItemWithRelativeImage`: RSS item with relative image URL
- `mockTwitterData`: Mock Twitter data

### Worldstate Fixtures (`test/fixtures/worldstate.ts`)

- `mockWorldstateData`: Complete worldstate object
- `mockWorldstateString`: Raw worldstate JSON string
- `mockKuvaData`: Kuva mission data
- `mockSentientData`: Sentient outpost data

## Test Best Practices

1. **Use Mocks for Unit Tests**: Isolate the component being tested
2. **Test Error Cases**: Always include error handling tests
3. **Keep Tests Fast**: Unit tests should run in milliseconds
4. **Use Descriptive Names**: Test names should clearly describe what's being tested
5. **Follow AAA Pattern**: Arrange, Act, Assert
6. **Avoid Test Interdependence**: Each test should be independent

## Example Test

```typescript
import { expect } from "chai";
import { createMockEmitter } from "../helpers/mocks";
import RSS from "../../handlers/RSS";

describe("RSS Handler", () => {
  it("should emit RSS event when new item is received", (done) => {
    // Arrange
    const emitter = createMockEmitter();
    const rss = new RSS(emitter);

    // Act
    emitter.on("rss", (data) => {
      // Assert
      expect(data).to.have.property("title");
      expect(data).to.have.property("url");
      done();
    });

    // Trigger the event
    rss.feeder.emit("new-item", mockRSSItem);
  });
});
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

### Unit Tests
Run automatically on:
- Every pull request to `master` branch
- After lint and build steps pass
- Timeout: 10 seconds

### Integration Tests  
Run automatically on:
- **Daily Schedule**: Every day at 4am Chicago time (9am UTC)
- **Manual Trigger**: Via GitHub Actions UI
- **Code Changes**: When handlers or integration tests are modified
- Timeout: 30 minutes

**Failure Handling:**
- Integration test failures create a GitHub issue labeled `integration-test-failure`
- If an issue already exists, a comment is added instead of creating duplicates
- Issues include workflow run link, commit SHA, and debugging instructions

## Troubleshooting

### Tests Timeout

Integration tests wait for real data and can timeout. This is normal if the APIs are slow or unavailable.

### Mock Data Out of Date

If the real API structure changes, update the mock fixtures in `test/fixtures/`.

### Type Errors

Ensure all test files have proper TypeScript types. Run `npm run build` to check for type errors.
