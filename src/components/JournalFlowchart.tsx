import React from 'react';
import { ArrowDown, ArrowRight, GitBranch } from 'lucide-react';

export interface JournalFlowchartStep {
  stepCode: string;
  titleVi: string;
  titleEn: string;
  detailVi: string;
  detailEn: string;
  targetMetric?: string;
}

export interface JournalFlowchartSpec {
  titleVi: string;
  titleEn: string;
  captionVi: string;
  captionEn: string;
  steps: JournalFlowchartStep[];
}

interface JournalFlowchartProps {
  flowchart: JournalFlowchartSpec;
  articleCode: string;
  lang: 'vi' | 'en';
}

export const JournalFlowchart: React.FC<JournalFlowchartProps> = ({ flowchart, articleCode, lang }) => {
  const isVi = lang === 'vi';
  if (!flowchart?.steps?.length) return null;

  return (
    <figure className="my-6 rounded-xl border border-[#202020]/10 dark:border-white/10 bg-[#F8F5EF]/75 dark:bg-[#0E1512] p-5 space-y-4">
      <figcaption className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-[#00552B] dark:text-[#C6A667] flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span>{isVi ? `Lưu đồ quy trình · ${articleCode}` : `Process Flowchart · ${articleCode}`}</span>
          </p>
          <h4 className="text-sm font-bold text-[#202020] dark:text-[#F1EFEA]">
            {isVi ? flowchart.titleVi : flowchart.titleEn}
          </h4>
        </div>
        <span className="text-[11px] font-mono text-[#202020]/55 dark:text-[#F1EFEA]/55 tabular-nums">
          {flowchart.steps.length} {isVi ? 'chặng kiểm soát' : 'control stages'}
        </span>
      </figcaption>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
        {flowchart.steps.map((step, idx) => {
          const isLast = idx === flowchart.steps.length - 1;
          return (
            <div key={step.stepCode} className="relative flex flex-col md:flex-row items-stretch gap-2">
              <div className="flex-1 rounded-lg bg-white dark:bg-[#16221C] border border-[#202020]/10 dark:border-white/10 p-3.5 space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold text-[#00552B] dark:text-[#C6A667]">
                      {step.stepCode}
                    </span>
                    {step.targetMetric && (
                      <span className="text-[10px] font-mono text-[#202020]/65 dark:text-[#F1EFEA]/65 tabular-nums">
                        {step.targetMetric}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-[#202020] dark:text-[#F1EFEA] leading-snug">
                    {isVi ? step.titleVi : step.titleEn}
                  </p>
                  <p className="text-[11px] text-[#202020]/70 dark:text-[#F1EFEA]/70 leading-relaxed">
                    {isVi ? step.detailVi : step.detailEn}
                  </p>
                </div>
              </div>

              {!isLast && (
                <div className="flex items-center justify-center shrink-0 text-[#00552B]/60 dark:text-[#C6A667]/70 py-0.5 md:py-0">
                  <ArrowDown className="w-4 h-4 md:hidden" />
                  <ArrowRight className="w-4 h-4 hidden md:block" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-[#202020]/55 dark:text-[#F1EFEA]/55">
        {isVi ? flowchart.captionVi : flowchart.captionEn}
      </p>
    </figure>
  );
};
