#!/usr/bin/env node
// Thin launcher that points the existing TBO runner at the 7-failing-case
// collection (Cases 1, 2, 3, 4, 5, 6, 8). Results land in tbo-results-failing/
// so they don't overwrite the original cert run output.
//
// Usage:
//   TBO_USERNAME=xxx TBO_PASSWORD=yyy node run-failing-cases.js [case_number]
//
// case_number: 1..7 (positional in this collection — 7 maps to original Case 8).

"use strict";

const path = require("path");

process.env.TBO_COLLECTION ||= path.join(
  __dirname,
  "test-cases",
  "Failing_Cases.postman_collection.json",
);

process.env.TBO_RESULTS_DIR ||= path.join(__dirname, "tbo-results-failing");

require("./run-tbo-tests.js");
