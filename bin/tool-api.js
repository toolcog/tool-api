#!/usr/bin/env node

import { runMain } from "citty";
import { mainCommand } from "tool-api/cli";

await runMain(mainCommand);
