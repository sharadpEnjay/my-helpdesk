async function globalTeardown(): Promise<void> {
  console.log("[e2e] Teardown complete (database preserved for inspection)");
}

export default globalTeardown;
