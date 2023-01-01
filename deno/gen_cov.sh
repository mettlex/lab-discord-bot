#!/bin/bash

# Collect your coverage profile with deno test --coverage=<output_directory>
deno test --coverage=cov_profile

# Or generate an lcov report
deno coverage cov_profile --lcov --output=cov_profile/cov.lcov

# Which can then be further processed by tools like genhtml
genhtml -o cov_profile/html cov_profile/cov.lcov
