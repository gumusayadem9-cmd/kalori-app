# Security Specification

This security specification documents the data invariants, validation rules, and threat vectors ("Dirty Dozen" payloads) for the NutriPro Firestore database.

## 1. Data Invariants

1. **User Ownership Isolation**: Users can only read, create, update, and delete their own profile data, physical records, weights, and daily food consumption logs. Cross-user reading or writing is strictly blocked.
2. **Valid Document Identifiers**: All user-level sub-documents must be keyed by standardized document IDs (e.g., date formatted as `YYYY-MM-DD` or matching valid alphanumeric IDs `isValidId()`).
3. **Immutability of Key Ownership**: Fields specifying account associations or critical identifiers (like email verification, profile identity, creation stamps) must remain immutable post-creation.
4. **Validation Integrity**: Values like daily calorie targets, nutrient portions, and physical metric measurements must contain correct types and adhere to strict boundaries.

---

## 2. The "Dirty Dozen" Payloads

Here are twelve insecure payloads attempting to violate user identity, data integrity, and state transition laws.

### Payload 1: Spying/Exfiltrating Other Profile Details
An attacker attempts to retrieve `/users/other-user-uid` to steal personal nutrition preferences, gender, age, height, and weight.
*   **Result**: `PERMISSION_DENIED` (Access is structurally restricted to the authenticating user matching `userId`).

### Payload 2: Write Spoofing - Impersonating Another User's Metadata
An attacker attempts to write a user profile at `/users/other-user-uid` with details that change other profiles.
*   **Result**: `PERMISSION_DENIED`.

### Payload 3: Injection of Shadow Role Fields (Self-Admin Escalation)
A malicious user sends profile updates containing `role: "admin"` or `isAdmin: true` during profile initiation.
*   **Result**: `PERMISSION_DENIED`.

### Payload 4: Overwriting Logs with Path Poisoning
An attacker tries to perform log injections by passing a malicious 1MB special character string as `{date}` target ID in `/users/{userId}/logs/{date}`.
*   **Result**: `PERMISSION_DENIED` (`isValidId` or `.size() <= 128` regex gate rejects it).

### Payload 5: Spoofing Owner Association on Logs
An authenticated user attempts to write a log inside another user's subcollection `/users/other-user-uid/logs/2026-06-20`.
*   **Result**: `PERMISSION_DENIED` (Rules verify that resource root path must match `request.auth.uid`).

### Payload 6: Type Poisoning under Carb Targets
An attacker tries to update their profile targets with a string for `calories` or highly negative values (e.g. `calories: -5000` or `calories: "thousand"`).
*   **Result**: `PERMISSION_DENIED` (Schema type validation blocks non-numbers or out-of-bounds target inputs).

### Payload 7: Denial of Wallet via Bloated Food Item Array
A malicious client attempts to save 1,000 blank elements inside a meal category to bloat storage footprint.
*   **Result**: `PERMISSION_DENIED` (Array and string limits block sizes over limits).

### Payload 8: Immutable Field Tampering (`email`)
A user attempts to alter their verified email address field in the database during updates to skip login steps.
*   **Result**: `PERMISSION_DENIED` (`email` comparison gate blocks modification).

### Payload 9: Temporal Integrity Tampering with Malicious Timestamps
An attacker sends a future or static date string to forge logs, skipping server-controlled timestamp boundaries.
*   **Result**: `PERMISSION_DENIED` (Values must sync with server context).

### Payload 10: Unverified User Access
An unverified user attempting to insert logs before fulfilling auth verification (if strict email verification is required).
*   **Result**: `PERMISSION_DENIED`.

### Payload 11: Bulk Harvesting (No-Filter List Query)
A client requests `getDocs(collectionGroup("logs"))` trying to harvest global entries without applying `where("userId", "==", uid)` constraint.
*   **Result**: `PERMISSION_DENIED` (Rule enforces list constraints matching specific authenticated owner).

### Payload 12: Weight Hijacking on Weight Tracking Subcollection
An attacker tries to post high-precision invalid float coordinates (e.g., `weight: 999999`) or negative figures to profile sub-tables.
*   **Result**: `PERMISSION_DENIED`.

---

## 3. Test Runner Definition

The security assertions are validated against `DRAFT_firestore.rules` under local execution or ESLint processing checking for identity, structural isolation, and schema invariants.
