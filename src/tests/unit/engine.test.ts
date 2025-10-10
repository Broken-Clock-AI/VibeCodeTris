import { TetrisEngine } from '../../logic/engine';
import * as assert from 'assert';

function testEngineInitialization() {
    const seed = 12345;
    const engine = new TetrisEngine(seed);
    
    // The engine should initialize without errors
    assert.ok(engine, 'Engine should initialize.');

    // The initial tick should produce a snapshot
    const snapshot = engine.tick();
    assert.ok(snapshot, 'Initial tick should produce a snapshot.');
    
    console.log('testEngineInitialization passed.');
}


// Run all tests
try {
    testEngineInitialization();
    console.log('All engine tests passed!');
} catch (error) {
    console.error('Engine tests failed:', error);
}
