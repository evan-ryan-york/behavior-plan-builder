"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plan, Student } from "@/lib/types";
import { functionInfo, BehaviorFunction, implementerOptions } from "@/lib/assessment-questions";

function formatFrequency(frequency: string | null) {
  if (!frequency) return "Not specified";
  const map: Record<string, string> = {
    multiple_daily: "Multiple times per day",
    once_daily: "About once per day",
    few_weekly: "A few times per week",
    once_weekly: "About once per week",
    less_weekly: "Less than once per week",
  };
  return map[frequency] || frequency;
}

function formatIntensity(intensity: string | null) {
  if (!intensity) return "Not specified";
  const map: Record<string, string> = {
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    safety_concern: "Safety concern",
  };
  return map[intensity] || intensity;
}

function formatFullDate(dateString: string | null) {
  if (!dateString) return "Not specified";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatImplementers(implementer: string | null): string[] {
  if (!implementer) return [];
  try {
    const parsed = JSON.parse(implementer);
    if (Array.isArray(parsed)) {
      return parsed.map((imp: string) => {
        const option = implementerOptions.find((o) => o.value === imp);
        return option?.label || imp;
      });
    }
  } catch {
    const option = implementerOptions.find((o) => o.value === implementer);
    return [option?.label || implementer];
  }
  return [];
}

// Simple markdown processor for print view
function processMarkdown(text: string | null): string {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");
}

export default function PrintPage() {
  const params = useParams();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("plans")
        .select(
          `
          *,
          students (*)
        `
        )
        .eq("id", params.id)
        .single();

      if (!error && data) {
        setPlan(data as Plan);
        setStudent(data.students as Student);
      }
      setLoading(false);
    }
    fetchData();
  }, [params.id]);

  useEffect(() => {
    if (!loading && plan) {
      // Small delay to ensure styles are loaded
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, plan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Plan not found</div>
      </div>
    );
  }

  const determinedFunction = plan.determined_function as BehaviorFunction | null;
  const secondaryFunction = plan.secondary_function as BehaviorFunction | null;

  // Parse prevention strategies
  let preventionStrategies: string[] = [];
  try {
    const parsed = JSON.parse(plan.current_prevention_strategies || "[]");
    preventionStrategies = Array.isArray(parsed) ? parsed : [];
  } catch {
    preventionStrategies = [];
  }

  const implementers = formatImplementers(plan.implementer);

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            margin: 0.75in;
            size: letter;
          }
        }
        body {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.5;
          color: #333;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 1rem;
        }
        .print-header {
          text-align: center;
          margin-bottom: 1.5rem;
          border-bottom: 2px solid #333;
          padding-bottom: 1rem;
        }
        .print-title {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }
        .print-subtitle {
          font-size: 0.9rem;
          color: #666;
        }
        .print-section {
          margin-bottom: 1.25rem;
          page-break-inside: avoid;
        }
        .print-section-title {
          font-size: 0.875rem;
          font-weight: bold;
          text-transform: uppercase;
          border-bottom: 1px solid #ccc;
          padding-bottom: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .print-section-content {
          font-size: 0.875rem;
        }
        .print-info-row {
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        .print-label {
          font-weight: 600;
        }
        .print-notes {
          margin-top: 1.5rem;
          page-break-inside: avoid;
        }
        .print-notes-line {
          border-bottom: 1px solid #ccc;
          height: 1.5rem;
          margin-bottom: 0.5rem;
        }
        .print-footer {
          margin-top: 2rem;
          padding-top: 0.5rem;
          border-top: 1px solid #ccc;
          font-size: 0.75rem;
          color: #999;
          text-align: center;
        }
        .no-print {
          margin-bottom: 1rem;
          padding: 0.5rem 1rem;
          background: #f5f5f5;
          border-radius: 0.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
        .print-button {
          padding: 0.5rem 1rem;
          background: #333;
          color: white;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        .print-button:hover {
          background: #555;
        }
      `}</style>

      <div className="no-print">
        <span>Print preview for: {student?.name || "Unknown Student"}</span>
        <button className="print-button" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="print-header">
        <div className="print-title">BEHAVIOR INTERVENTION PLAN</div>
        <div className="print-subtitle">
          Student: {student?.name || "Unknown Student"}
          {student?.grade_level ? ` | Grade: ${student.grade_level}` : ""}
          {plan.finalized_at ? ` | Date: ${formatFullDate(plan.finalized_at)}` : ""}
        </div>
      </div>

      <div className="print-section">
        <div className="print-section-title">Target Behavior</div>
        <div className="print-section-content">
          {plan.target_behavior || "Not specified"}
        </div>
        <div className="print-info-row" style={{ marginTop: "0.5rem" }}>
          <span className="print-label">Frequency:</span>{" "}
          {formatFrequency(plan.behavior_frequency)} |{" "}
          <span className="print-label">Intensity:</span>{" "}
          {formatIntensity(plan.behavior_intensity)}
        </div>
      </div>

      {(determinedFunction || plan.current_function_summary) && (
        <div className="print-section">
          <div className="print-section-title">Function of Behavior</div>
          {determinedFunction && (
            <div className="print-info-row">
              <span className="print-label">Primary Function:</span>{" "}
              {functionInfo[determinedFunction]?.label}
              {secondaryFunction && (
                <>
                  {" "}| <span className="print-label">Secondary:</span>{" "}
                  {functionInfo[secondaryFunction]?.label}
                </>
              )}
            </div>
          )}
          {plan.current_function_summary && (
            <div
              className="print-section-content"
              dangerouslySetInnerHTML={{
                __html: processMarkdown(plan.current_function_summary),
              }}
            />
          )}
        </div>
      )}

      {plan.current_replacement_behavior && (
        <div className="print-section">
          <div className="print-section-title">Replacement Behavior</div>
          <div
            className="print-section-content"
            dangerouslySetInnerHTML={{
              __html: processMarkdown(plan.current_replacement_behavior),
            }}
          />
        </div>
      )}

      {preventionStrategies.length > 0 && (
        <div className="print-section">
          <div className="print-section-title">Prevention Strategies</div>
          {preventionStrategies.map((strategy, index) => (
            <div
              key={index}
              className="print-section-content"
              style={{ marginBottom: "0.5rem" }}
              dangerouslySetInnerHTML={{
                __html: `&bull; ${processMarkdown(strategy)}`,
              }}
            />
          ))}
        </div>
      )}

      {plan.current_reinforcement_plan && (
        <div className="print-section">
          <div className="print-section-title">Reinforcement Plan</div>
          <div
            className="print-section-content"
            dangerouslySetInnerHTML={{
              __html: processMarkdown(plan.current_reinforcement_plan),
            }}
          />
        </div>
      )}

      {plan.current_response_to_behavior && (
        <div className="print-section">
          <div className="print-section-title">Response to Target Behavior</div>
          <div
            className="print-section-content"
            dangerouslySetInnerHTML={{
              __html: processMarkdown(plan.current_response_to_behavior),
            }}
          />
        </div>
      )}

      <div className="print-section">
        <div className="print-section-title">Plan Details</div>
        <div className="print-info-row">
          <span className="print-label">Created:</span>{" "}
          {formatFullDate(plan.created_at)}
          {plan.finalized_at && (
            <>
              {" "}| <span className="print-label">Finalized:</span>{" "}
              {formatFullDate(plan.finalized_at)}
            </>
          )}
        </div>
        {implementers.length > 0 && (
          <div className="print-info-row">
            <span className="print-label">Implementers:</span>{" "}
            {implementers.join(", ")}
          </div>
        )}
        {plan.whats_been_tried && (
          <div className="print-info-row">
            <span className="print-label">Previously Tried:</span>{" "}
            {plan.whats_been_tried}
          </div>
        )}
      </div>

      <div className="print-notes">
        <div className="print-section-title">Notes</div>
        <div className="print-notes-line" />
        <div className="print-notes-line" />
        <div className="print-notes-line" />
        <div className="print-notes-line" />
      </div>

      <div className="print-footer">
        Generated with Behavior Plan Builder |{" "}
        {new Date().toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </div>
    </>
  );
}
