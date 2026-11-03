import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArrayFromTextarea } from '../src/utils/employeeArrayText.js';

test('parses employee array entries with empty values', () => {
  const result = parseArrayFromTextarea(
    'Id: 54 | Candidate Id: 14 | Cifid: 14 | Tool Name: SEMrush | Proficiency Level: Good | Deleted At:',
    'softwareTools'
  );

  assert.deepEqual(result, [{
    id: '54',
    candidateId: '14',
    cifid: '14',
    toolName: 'SEMrush',
    proficiencyLevel: 'Good',
    deletedAt: '',
  }]);
});

test('still parses plain text entries and rejects malformed object entries', () => {
  assert.deepEqual(
    parseArrayFromTextarea('JavaScript\nTool Name: VS Code', 'softwareTools'),
    ['JavaScript', { toolName: 'VS Code' }]
  );
  assert.throws(
    () => parseArrayFromTextarea('Tool Name: VS Code | Invalid Entry', 'softwareTools'),
    /softwareTools contains an invalid entry/
  );
});
