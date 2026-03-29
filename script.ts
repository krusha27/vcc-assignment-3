import * as compute from "@google-cloud/compute";
import { execSync } from "child_process";
import { scaleDown, scaleUp } from "./scaling-operation";

const SCALE_UP_THRESHOLD = 75;
const SCALE_DOWN_THRESHOLD = 25;
const COOLOFF = 300000;
const MONITOR_TIME = 5000;

const client = new compute.InstancesClient();
let isGCPEnabled = false;
let scalingTime = Date.now();

async function monitor() {
  try {
    const topData = execSync("top -bn1").toString();

    const cpuMatch = topData.match(/(\d+\.\d+)\s+id/);
    let cpu: number = 0;

    if (cpuMatch) {
      cpu = 100 - (parseFloat(cpuMatch[1]!) || 0);
      console.log(`Cpu usage:  ${cpu.toFixed(1)}%`);
    } else {
      console.log("No idle field found...");
    }

    const memMatch = topData.match(
      /MiB Mem\s*:\s*(\d+\.?\d+)\s*total, \s*(\d+\.?\d+)\s*free/,
    );
    let mem: number = 0;
    if (memMatch) {
      const total = parseFloat(memMatch[1]!);
      const free = parseFloat(memMatch[2]!) || 0;
      mem = ((total - free) / total) * 100;
      console.log(`Mem usage: ${mem.toFixed(1)}%`);
    } else {
      console.log("No total & free memory field found");
    }
    await scale(cpu, mem);
  } catch (err) {
    console.log("Error encountered: ", err);
  }
}

async function scale(cpu: number, mem: number) {
  const now = Date.now();

  console.log(
    cpu,
    mem,
    isGCPEnabled,
    now - scalingTime > COOLOFF,
    scalingTime,
    now,
  );

  if (
    (cpu > SCALE_UP_THRESHOLD || mem > SCALE_UP_THRESHOLD) &&
    !isGCPEnabled &&
    now - scalingTime > COOLOFF
  ) {
    console.log("Scaling it up...", cpu, mem);
    await scaleUp();
    isGCPEnabled = true;
    scalingTime = Date.now();
  }
  if (
    cpu < SCALE_DOWN_THRESHOLD &&
    mem < SCALE_DOWN_THRESHOLD &&
    isGCPEnabled &&
    now - scalingTime > COOLOFF
  ) {
    console.log("Scaling it down...", cpu, mem);
    await scaleDown();
    isGCPEnabled = false;
    scalingTime = Date.now();
  }
}

setInterval(monitor, MONITOR_TIME);
