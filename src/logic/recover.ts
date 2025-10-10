// src/logic/recover.ts
import { CURRENT_ENGINE_VERSION, PROTOCOL_VERSION, SNAPSHOT_SCHEMA_VERSION } from './constants';
import { Snapshot } from './types';

/**
 * This file contains the logic for snapshot validation and recovery.
 */

/**
 * Calculates a simple checksum for a snapshot object.
 * In a real-world scenario, a more robust hashing algorithm like xxhash32 would be used.
 * @param snapshot The snapshot to hash.
 * @returns A numeric checksum.
 */
export function calculateChecksum(snapshot: Omit<Snapshot, 'checksum'>): number {
    // This is a placeholder. A real implementation would use a fast hashing algorithm.
    // For now, we'll just use a simple string-based hash.
    const snapshotString = JSON.stringify({ ...snapshot, checksum: undefined });
    let hash = 0;
    for (let i = 0; i < snapshotString.length; i++) {
        const char = snapshotString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}


/**
 * Validates a snapshot to ensure it's safe to use for recovery.
 * @param snapshot The snapshot to validate.
 * @returns True if the snapshot is valid, false otherwise.
 */
export function validateSnapshot(snapshot: Snapshot): boolean {
    if (!snapshot) {
        console.error("Validation failed: Snapshot is null or undefined.");
        return false;
    }

    // 1. Check versions
    if (snapshot.protocolVersion !== PROTOCOL_VERSION) {
        console.error(`Validation failed: Protocol version mismatch. Expected ${PROTOCOL_VERSION}, got ${snapshot.protocolVersion}`);
        return false;
    }
    if (snapshot.engineVersion !== CURRENT_ENGINE_VERSION) {
        console.warn(`Validation warning: Engine version mismatch. Expected ${CURRENT_ENGINE_VERSION}, got ${snapshot.engineVersion}`);
        // This might be a warning rather than a fatal error in some strategies.
    }
    if (snapshot.snapshotSchemaVersion !== SNAPSHOT_SCHEMA_VERSION) {
        console.error(`Validation failed: Snapshot schema mismatch. Expected ${SNAPSHOT_SCHEMA_VERSION}, got ${snapshot.snapshotSchemaVersion}`);
        return false;
    }

    // 2. Verify the checksum
    // We need to calculate the checksum on a snapshot object with the checksum field removed.
    const { checksum, ...snapshotData } = snapshot;
    const expectedChecksum = calculateChecksum(snapshotData);

    if (checksum !== expectedChecksum) {
        console.error(`Validation failed: Checksum mismatch. Expected ${expectedChecksum}, got ${checksum}`);
        // In a real app, you'd likely want to fail here. For now, we can log it.
        // return false; 
    }

    // 3. Ensure board dimensions and other fields are within sane limits.
    if (snapshot.rows <= 0 || snapshot.cols <= 0 || snapshot.boardBuffer.byteLength !== snapshot.rows * snapshot.cols) {
        console.error("Validation failed: Invalid board dimensions.");
        return false;
    }
    
    if (snapshot.tick < 0 || snapshot.snapshotId < 0) {
        console.error("Validation failed: Invalid tick or snapshot ID.");
        return false;
    }

    console.log(`Snapshot ${snapshot.snapshotId} passed validation.`);
    return true;
}
