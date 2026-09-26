import { runDifferentialTestSuite } from './shadbalaDifferential.test.js';
import { runBhavaFirewallTest } from './bhavaFirewall.test.js';

async function main() {
  console.log('===========================================================');
  console.log('DSSME EVENT ENGINE V1.0 - PHASE 2 DIFFERENTIAL TEST RUNNER');
  console.log('===========================================================');

  console.log('\n[TEST 1] BHAVA BALA FIREWALL TEST');
  const fw = await runBhavaFirewallTest();
  console.log('Status:', fw.passed ? 'PASS' : 'FAIL');
  console.log('Checks:', fw.passedChecks + ' / ' + fw.totalChecks);
  console.log('Details:', fw.details);

  console.log('\n[TEST 2] 18-FIXTURE PYJHORA DIFFERENTIAL AUDIT');
  const rep = await runDifferentialTestSuite();
  console.log('Oracle Repository: naturalstupid/PyJHora');
  console.log('Pinned Commit:', rep.pinnedCommit);
  console.log('Total Fixtures:', rep.fixtureCount);
  console.log('Passed Fixtures:', rep.passedFixtures);
  console.log('Failed Fixtures:', rep.failedFixtures);
  console.log('Overall Status:', rep.overallStatus);

  console.log('\n--- COMPONENT SUMMARY (Checks: 18 fixtures x 7 planets = 126 total) ---');
  for (const [k, v] of Object.entries(rep.componentTotals)) {
    console.log(`  ${k.padEnd(16)}: ${String(v.pass).padStart(3)} PASS | ${String(v.fail).padStart(3)} FAIL`);
  }

  console.log('\n--- FIXTURE INVENTORY & DIAGNOSTIC ROOT CAUSES ---');
  for (const f of rep.fixtures) {
    console.log(`[${f.fixtureId}] ${f.name.padEnd(35)} -> ${f.status} | Root: ${f.rootCause}`);
  }
}

main().catch(err => {
  console.error('Error running differential suite:', err);
  process.exit(1);
});
