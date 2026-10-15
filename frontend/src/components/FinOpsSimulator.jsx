import React, { useState } from 'react';
import { DollarSign, Cpu, HardDrive, Database, Clock, Sparkles, TrendingUp, Check } from 'lucide-react';

export default function FinOpsSimulator() {
  const [ec2Instances, setEc2Instances] = useState(4);
  const [ebsStorageGb, setEbsStorageGb] = useState(2500);
  const [s3ColdDataTb, setS3ColdDataTb] = useState(15);
  const [autoShutdownHours, setAutoShutdownHours] = useState(true);

  // Financial calculations
  // m5.4xlarge: $560.64 -> t4g.xlarge: $97.92 => $462.72/mo saved per instance
  const computeSavings = ec2Instances * 462.72;

  // gp2 ($0.10/GB) -> gp3 ($0.08/GB) => $0.02/GB saved
  const storageSavings = ebsStorageGb * 0.02;

  // S3 Standard ($0.023/GB = $23/TB) -> Glacier Deep Archive ($0.00099/GB = $1/TB) => $22/TB saved
  const s3Savings = s3ColdDataTb * 22.00;

  // Off-hours shutdown (65% off remaining dev compute)
  const shutdownMultiplier = autoShutdownHours ? 0.35 : 1.0;
  const devShutdownSavings = autoShutdownHours ? (ec2Instances * 97.92 * 0.65) : 0;

  const totalMonthlySavings = computeSavings + storageSavings + s3Savings + devShutdownSavings;
  const totalAnnualSavings = totalMonthlySavings * 12;

  // Baseline unoptimized monthly spend
  const baselineMonthlySpend = (ec2Instances * 560.64) + (ebsStorageGb * 0.10) + (s3ColdDataTb * 23.00);
  const optimizedMonthlySpend = baselineMonthlySpend - totalMonthlySavings;
  const savingsPercent = Math.min(100, Math.round((totalMonthlySavings / baselineMonthlySpend) * 100));

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Autonomous Cloud FinOps Simulator</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Interactive ROI & Cloud Spend Optimizer
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              Model your team's infrastructure parameters below. See the real-time financial impact of AWS Graviton compute rightsizing, gp3 storage upgrades, and cold S3 lifecycle tiering.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-right min-w-[200px]">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Projected Annual Savings
            </span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-0.5">
              ${totalAnnualSavings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-slate-400">
              Save ${totalMonthlySavings.toFixed(2)} every month ({savingsPercent}% reduction)
            </span>
          </div>
        </div>
      </div>

      {/* Sliders & Spend Bar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders Controls Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Slider 1: EC2 Rightsizing */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    EC2 Compute Rightsizing (m5.4xlarge &rarr; t4g.xlarge Graviton)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saves $462.72/mo per instance with equal memory and higher single-core efficiency
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-cyan-400 font-mono px-2 py-1 bg-slate-800 rounded">
                {ec2Instances} instance{ec2Instances > 1 ? 's' : ''}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={ec2Instances}
              onChange={(e) => setEc2Instances(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>0 instances</span>
              <span>10 instances</span>
              <span>20 instances ($9,254/mo max)</span>
            </div>
          </div>

          {/* Slider 2: EBS Modernization */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    EBS Storage Modernization (gp2 &rarr; gp3)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Direct 20% price cut + 3,000 baseline IOPS and 125 MB/s throughput
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-400 font-mono px-2 py-1 bg-slate-800 rounded">
                {ebsStorageGb.toLocaleString()} GB
              </span>
            </div>

            <input
              type="range"
              min="100"
              max="20000"
              step="100"
              value={ebsStorageGb}
              onChange={(e) => setEbsStorageGb(parseInt(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>100 GB</span>
              <span>10,000 GB</span>
              <span>20,000 GB ($400/mo savings)</span>
            </div>
          </div>

          {/* Slider 3: S3 Lifecycle Tiering */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    S3 Cold Object Lifecycle Tiering (Standard &rarr; Glacier)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Saves $22/TB/mo by auto-transitioning untouched objects past 30 days
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold text-blue-400 font-mono px-2 py-1 bg-slate-800 rounded">
                {s3ColdDataTb} TB
              </span>
            </div>

            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={s3ColdDataTb}
              onChange={(e) => setS3ColdDataTb(parseInt(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>1 TB</span>
              <span>50 TB</span>
              <span>100 TB ($2,200/mo savings)</span>
            </div>
          </div>

          {/* Toggle: Off-hours scheduling */}
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Automated Non-Prod Nightly & Weekend Shutdown
                </h4>
                <p className="text-[11px] text-slate-400">
                  Turns off dev clusters outside 9am-6pm M-F, eliminating 65% of remaining idle compute burn
                </p>
              </div>
            </div>

            <button
              onClick={() => setAutoShutdownHours(!autoShutdownHours)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                autoShutdownHours
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {autoShutdownHours ? 'Active (Enabled)' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Visual ROI Comparison Column */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Spend Breakdown & Burn Comparison
            </span>
            <h3 className="text-lg font-bold text-white mt-1">
              Monthly Infrastructure Run-Rate
            </h3>

            {/* Before vs After Bars */}
            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-rose-400 font-medium">Unoptimized Run-Rate:</span>
                  <span className="font-mono text-white font-bold">
                    ${baselineMonthlySpend.toFixed(2)}/mo
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500/80 w-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-medium">CloudSentinel Optimized:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${optimizedMonthlySpend.toFixed(2)}/mo
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, (optimizedMonthlySpend / baselineMonthlySpend) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Metric pill list */}
            <div className="mt-6 pt-6 border-t border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Compute Waste Cut:</span>
                <span className="text-slate-200 font-mono">${computeSavings.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">EBS gp3 Modernization:</span>
                <span className="text-slate-200 font-mono">${storageSavings.toFixed(2)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">S3 Lifecycle Transitions:</span>
                <span className="text-slate-200 font-mono">${s3Savings.toFixed(2)}/mo</span>
              </div>
              {autoShutdownHours && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Nightly Auto-Shutdown:</span>
                  <span className="text-emerald-400 font-mono">+${devShutdownSavings.toFixed(2)}/mo</span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
            <div className="flex items-center space-x-1.5 font-semibold mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Net ROI: {savingsPercent}% Cloud Budget Recovered</span>
            </div>
            <span>
              By implementing CloudSentinel's autonomous PR patches, this organization unlocks ${totalAnnualSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })} in engineering budget.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
