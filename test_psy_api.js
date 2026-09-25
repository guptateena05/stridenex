async function testApi() {
  const baseUrl = "https://devstridenex.quantcloud.in";
  console.log("1. Fetching tests...");
  const testsRes = await fetch(`${baseUrl}/api/method/nexedu.api.get_tests`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
  });
  const testsData = await testsRes.json();
  
  const testName = testsData.message?.[0]?.name || "Demo psy 1";
  console.log(`\n2. Starting new test for '${testName}'...`);
  
  const startRes = await fetch(`${baseUrl}/api/method/nexedu.api.start_new_test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test_type: testName, email: "test@example.com" })
  });
  
  const startData = await startRes.json();
  console.log("Start Test Response:", JSON.stringify(startData, null, 2));

  const message = startData.message !== undefined ? startData.message : startData;
  const sid = message?.test_screen || message?.name || (typeof message === "string" ? message : null);
  
  if (!sid) {
      console.log("No SID returned. Cannot proceed.");
      return;
  }
  
  console.log(`\n3. Loading questions for sid: ${sid}...`);
  const loadRes = await fetch(`${baseUrl}/api/method/nexedu.api.load_question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ screen_name: sid })
  });
  
  const loadData = await loadRes.json();
  console.log("Load Question Response:", JSON.stringify(loadData, null, 2));
}

testApi().catch(console.error);
