# Security Specification & Test Harness: CampusVault

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created or modified by the user with matching `request.auth.uid == userId`. Users cannot escalate their own `role` to 'admin'.
2. **Admin Isolation**: Admin status is derived from verified email `pmadhumala75@gmail.com` or membership in `/admins/{adminId}`. Ordinary users cannot write to `/admins/{adminId}` or elevate their permissions.
3. **Item Ownership Integrity**: Any item created at `/items/{itemId}` must have `ownerId == request.auth.uid`. A user cannot forge reports under another student's identity.
4. **Item Immutability**: Fields `id`, `ownerId`, and `createdAt` are immutable after creation.
5. **Item State Transitions**: Non-admin users can only update item status to 'Closed' or edit details of their own item before terminal resolution. Non-admins cannot alter items owned by other users.
6. **Claimant Identity**: In `/claims/{claimId}`, `claimantId` must equal `request.auth.uid`. A claimant cannot submit a claim on behalf of someone else or against their own reported item.
7. **Claim Resolution Authority**: Only an administrator or the item owner can update a claim's status ('Approved' / 'Rejected' / 'Completed'). Claimants cannot approve their own claims.
8. **Notification Isolation**: A notification at `/notifications/{notificationId}` can only be read or marked read by its recipient (`userId == request.auth.uid`).
9. **Audit Trail Security**: `/auditLogs/{logId}` can only be created and read by administrators.

## 2. The Dirty Dozen Payloads (Designed to Break Identity, Integrity, and State)
1. **Self-Promotion Attack**: Authenticated user `attacker_123` creates `/users/attacker_123` with `{ role: 'admin' }`.
2. **Admin Directory Write Spoof**: Regular user writes to `/admins/attacker_123` to grant themselves system admin rights.
3. **Orphaned/Forged Item Report**: Attacker creates an item document where `ownerId: 'victim_456'`.
4. **Unauthorized Item Mutation**: User `user_abc` attempts to update or delete an item document where `ownerId == 'user_xyz'`.
5. **Claimant Identity Spoof**: Attacker files a claim where `claimantId: 'legitimate_owner_789'`.
6. **Self-Approval Exploit**: Claimant attempts to change claim status from 'Pending' to 'Approved'.
7. **Cross-User Claim Tampering**: Non-owner, non-claimant third-party attempts to mutate claim details.
8. **Notification Snooping**: User `user_1` attempts to query or read notifications where `userId == 'user_2'`.
9. **Ghost Field Injection**: User attempts to inject `{ isVerifiedByPolice: true, bypassLock: true }` into an item report.
10. **Terminal State Bypass**: Attacker attempts to reopen or overwrite an item whose status is 'Returned / Resolved'.
11. **Denial-of-Wallet Payload**: Attacker attempts to insert 2MB string in `description` or `identifyingDetails`.
12. **Audit Log Tampering**: Regular user attempts to delete or falsify an entry in `/auditLogs`.

## 3. Test Runner Invariant Summary
All 12 dirty payloads are rejected by strict rule guards:
- `isSignedIn()`
- `isValidId(id)`
- Identity checks: `incoming().ownerId == request.auth.uid`
- Immutable fields check: `incoming().ownerId == existing().ownerId`
- Role validation helper: `isAdmin()`
- Field boundaries: `.size() <= MAX`
