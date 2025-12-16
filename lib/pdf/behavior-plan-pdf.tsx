import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Define styles for the PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 20,
    textAlign: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },
  section: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fafafa",
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    color: "#333",
    textTransform: "uppercase",
  },
  sectionContent: {
    fontSize: 10,
    color: "#444",
    lineHeight: 1.6,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
  },
  infoValue: {
    color: "#666",
  },
  bulletPoint: {
    marginBottom: 6,
    paddingLeft: 12,
  },
  notesSection: {
    marginTop: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  notesLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    height: 24,
    marginBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
  },
  pageNumber: {
    textAlign: "right",
  },
});

interface BehaviorPlanPdfProps {
  studentName: string;
  gradeLevel: string | null;
  targetBehavior: string | null;
  frequency: string | null;
  intensity: string | null;
  primaryFunction: string | null;
  secondaryFunction: string | null;
  functionSummary: string | null;
  replacementBehavior: string | null;
  preventionStrategies: string[];
  reinforcementPlan: string | null;
  responseToBehavior: string | null;
  implementers: string[];
  whatsTried: string | null;
  createdAt: string;
  finalizedAt: string | null;
}

function formatFrequency(frequency: string | null): string {
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

function formatIntensity(intensity: string | null): string {
  if (!intensity) return "Not specified";
  const map: Record<string, string> = {
    mild: "Mild",
    moderate: "Moderate",
    severe: "Severe",
    safety_concern: "Safety concern",
  };
  return map[intensity] || intensity;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not specified";
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Simple markdown-like text processor for PDF
function processText(text: string | null): string {
  if (!text) return "";
  // Remove markdown formatting like **bold**, *italic*, etc.
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function BehaviorPlanPdf({
  studentName,
  gradeLevel,
  targetBehavior,
  frequency,
  intensity,
  primaryFunction,
  secondaryFunction,
  functionSummary,
  replacementBehavior,
  preventionStrategies,
  reinforcementPlan,
  responseToBehavior,
  implementers,
  whatsTried,
  createdAt,
  finalizedAt,
}: BehaviorPlanPdfProps) {
  const generatedDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>BEHAVIOR INTERVENTION PLAN</Text>
          <Text style={styles.subtitle}>
            Student: {studentName}
            {gradeLevel ? ` | Grade: ${gradeLevel}` : ""}
            {finalizedAt ? ` | Date: ${formatDate(finalizedAt)}` : ""}
          </Text>
        </View>

        {/* Target Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Target Behavior</Text>
          <Text style={styles.sectionContent}>
            {targetBehavior || "Not specified"}
          </Text>
          <View style={{ marginTop: 8, flexDirection: "row", gap: 16 }}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Frequency:</Text>
              <Text style={styles.infoValue}>{formatFrequency(frequency)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Intensity:</Text>
              <Text style={styles.infoValue}>{formatIntensity(intensity)}</Text>
            </View>
          </View>
        </View>

        {/* Function of Behavior */}
        {(primaryFunction || functionSummary) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Function of Behavior</Text>
            {primaryFunction && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Primary Function:</Text>
                <Text style={styles.infoValue}>
                  {primaryFunction}
                  {secondaryFunction ? ` | Secondary: ${secondaryFunction}` : ""}
                </Text>
              </View>
            )}
            {functionSummary && (
              <Text style={[styles.sectionContent, { marginTop: 8 }]}>
                {processText(functionSummary)}
              </Text>
            )}
          </View>
        )}

        {/* Replacement Behavior */}
        {replacementBehavior && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Replacement Behavior</Text>
            <Text style={styles.sectionContent}>
              {processText(replacementBehavior)}
            </Text>
          </View>
        )}

        {/* Prevention Strategies */}
        {preventionStrategies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Prevention Strategies</Text>
            {preventionStrategies.map((strategy, index) => (
              <Text key={index} style={styles.bulletPoint}>
                {"\u2022 "}{processText(strategy)}
              </Text>
            ))}
          </View>
        )}

        {/* Reinforcement Plan */}
        {reinforcementPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reinforcement Plan</Text>
            <Text style={styles.sectionContent}>
              {processText(reinforcementPlan)}
            </Text>
          </View>
        )}

        {/* Response to Target Behavior */}
        {responseToBehavior && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Response to Target Behavior</Text>
            <Text style={styles.sectionContent}>
              {processText(responseToBehavior)}
            </Text>
          </View>
        )}

        {/* Plan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(createdAt)}</Text>
          </View>
          {finalizedAt && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Finalized:</Text>
              <Text style={styles.infoValue}>{formatDate(finalizedAt)}</Text>
            </View>
          )}
          {implementers.length > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Implementers:</Text>
              <Text style={styles.infoValue}>{implementers.join(", ")}</Text>
            </View>
          )}
          {whatsTried && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Previously Tried:</Text>
              <Text style={styles.infoValue}>{whatsTried}</Text>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <View style={styles.notesLine} />
          <View style={styles.notesLine} />
          <View style={styles.notesLine} />
          <View style={styles.notesLine} />
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated with Behavior Plan Builder | {generatedDate}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
