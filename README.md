# dispatch-lib

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.2.20. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

put your google-service json in ./supabase/functions/service-account.json

## Trust Score System
The system is admin-driven with manual and conditional adjustments:
- **Default Trust**: All users start at level 0.
- **Manual Adjustments**: Admins can use `updateTrustScore`, `incrementTrustScore`, or `decrementTrustScore` through the `DispatchClient`.
- **Conditional Decrement**: If a report is marked as 'Cancelled' with the reason 'Prank Call', the reporter's trust score is automatically decremented by 1 (capped at 0).
- **Manual Increment**: When an admin resolves a report, they are prompted to optionally increase the reporter's trust score.

### Manual Verification Test
A dedicated test for trust score operations is available at:
`tests/testManualTrust.ts`
