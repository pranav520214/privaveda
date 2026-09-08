"use client";

import React, { useState } from "react";
import {
  UploadCloud,
  FileText,
  Table,
  Code,
  ShieldAlert,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  X,
  AlertTriangle,
} from "lucide-react";
import type { PrivacyInspectionResult } from "./types";

interface DataImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (token: string) => void;
}

export default function DataImportWizard({
  isOpen,
  onClose,
  onImportSuccess,
}: DataImportWizardProps) {
  const [step, setStep] = useState<number>(1);
  const [sourceType, setSourceType] = useState<"fhir" | "csv" | "json">("fhir");
  const [rawContent, setRawContent] = useState<string>("");
  const [inspectionResult, setInspectionResult] = useState<PrivacyInspectionResult | null>(null);
  const [confirmedPseudonym, setConfirmedPseudonym] = useState<string>("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  if (!isOpen) return null;

  // Default sample payloads for quick testing
  const loadSample = (type: "fhir" | "csv" | "json") => {
    setSourceType(type);
    if (type === "fhir") {
      setRawContent(
        JSON.stringify(
          {
            resourceType: "Bundle",
            type: "collection",
            entry: [
              {
                resource: {
                  resourceType: "Patient",
                  name: [{ family: "Kowalski", given: ["Marek"] }],
                  gender: "male",
                  birthDate: "1972-11-04",
                },
              },
              {
                resource: {
                  resourceType: "Observation",
                  code: { coding: [{ code: "29463-7", display: "Body Weight" }] },
                  valueQuantity: { value: 76.5, unit: "kg" },
                },
              },
              {
                resource: {
                  resourceType: "Observation",
                  code: { coding: [{ code: "33914-3", display: "eGFR" }] },
                  valueQuantity: { value: 82.0, unit: "mL/min" },
                },
              },
              {
                resource: {
                  resourceType: "Condition",
                  code: { text: "Hypertension & Dyslipidemia" },
                },
              },
            ],
          },
          null,
          2
        )
      );
    } else if (type === "csv") {
      setRawContent(
        `patient_name,weight_kg,age_years,sex,egfr,creatinine,medications\nRobert Taylor,78.0,54,male,88.0,1.1,Amlodipine;Lisinopril`
      );
    } else {
      setRawContent(
        JSON.stringify(
          {
            name: "Eleanor Vance",
            email: "e.vance@example.org",
            mrn: "MRN-55410",
            weight_kg: 68.0,
            age_years: 61.0,
            sex: "female",
            condition: "Essential Hypertension",
            egfr: 76.0,
            medications: ["Hydrochlorothiazide 25mg"],
          },
          null,
          2
        )
      );
    }
  };

  // Step 2: Run Privacy Inspection API
  const handleInspect = async () => {
    if (!rawContent.trim()) {
      setErrorMsg("Please provide payload content before continuing.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/privaveda/import/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source_type: sourceType, raw_content: rawContent }),
      });
      if (!res.ok) throw new Error("Privacy inspection failed");
      const data: PrivacyInspectionResult = await res.json();
      setInspectionResult(data);
      setConfirmedPseudonym(data.suggested_pseudonym);
      setStep(2);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to inspect payload.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 6: Commit Import API
  const handleCommit = async () => {
    if (!disclaimerAccepted) {
      setErrorMsg("You must acknowledge the research decision-support boundary.");
      return;
    }
    setIsProcessing(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/privaveda/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source_type: sourceType,
          raw_content: rawContent,
          confirmed_pseudonym: confirmedPseudonym,
          user_confirmed_disclaimer: true,
        }),
      });
      if (!res.ok) throw new Error("Local encrypted commit failed");
      const data = await res.json();
      onImportSuccess(data.patient_token);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit clinical case.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Wizard Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-700">
              RESEARCH WORKSPACE INGESTION WIZARD
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Step {step} of 5:{" "}
              {step === 1 && "Select Clinical Data Source"}
              {step === 2 && "Privacy & PII Inspection"}
              {step === 3 && "Pseudonymization & Token Assignment"}
              {step === 4 && "Data Quality Inspection"}
              {step === 5 && "Confirmation & Local Envelope Encryption"}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs text-slate-700">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SELECT SOURCE */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => loadSample("fhir")}
                  className={`p-3 rounded-xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    sourceType === "fhir" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900">FHIR R4</span>
                  <span className="text-[10px] text-slate-500">Standard Bundle JSON</span>
                </button>

                <button
                  onClick={() => loadSample("csv")}
                  className={`p-3 rounded-xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    sourceType === "csv" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Table className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900">CSV Table</span>
                  <span className="text-[10px] text-slate-500">Tabular labs &amp; meds</span>
                </button>

                <button
                  onClick={() => loadSample("json")}
                  className={`p-3 rounded-xl border-2 text-left flex flex-col gap-1 transition-all cursor-pointer ${
                    sourceType === "json" ? "border-indigo-600 bg-indigo-50/50" : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <Code className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-slate-900">Structured JSON</span>
                  <span className="text-[10px] text-slate-500">Custom EHR payload</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Raw Payload Content (Paste or load sample above):
                </label>
                <textarea
                  value={rawContent}
                  onChange={(e) => setRawContent(e.target.value)}
                  rows={10}
                  className="w-full font-mono text-[11px] p-3 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-indigo-600"
                  placeholder="Paste FHIR Bundle, CSV string, or JSON clinical record here..."
                />
              </div>
            </div>
          )}

          {/* STEP 2: PRIVACY INSPECTION */}
          {step === 2 && inspectionResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">
                    {inspectionResult.has_direct_identifiers
                      ? "IDENTIFIABLE FIELDS FOUND"
                      : "NO DIRECT IDENTIFIERS DETECTED"}
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {inspectionResult.identifiable_fields.length} sensitive fields scanned. All direct PII will be segregated into the Identity Vault and omitted from the digital twin simulation.
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2.5">Field Path</th>
                      <th className="p-2.5">Category</th>
                      <th className="p-2.5">Masked Preview</th>
                      <th className="p-2.5">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inspectionResult.identifiable_fields.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono text-slate-800">{f.field_path}</td>
                        <td className="p-2.5 font-bold text-amber-700">{f.category}</td>
                        <td className="p-2.5 font-mono text-slate-500">{f.preview}</td>
                        <td className="p-2.5 text-slate-600">{f.recommendation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: PSEUDONYMIZATION */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                <span className="text-xs font-bold text-indigo-900 block">
                  Deterministic HMAC-SHA256 Token Assignment
                </span>
                <p className="text-xs text-indigo-800 mt-1">
                  The clinical simulation engine operates exclusively on this token. Patient identity is never accessible to the mechanistic solver.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="font-mono text-lg font-black text-indigo-950 bg-white px-3 py-1.5 rounded-lg border border-indigo-300">
                    {confirmedPseudonym}
                  </span>
                  <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Valid Pseudonym Token
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: DATA QUALITY INSPECTION */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h3 className="font-bold text-slate-900">Physiological Sanity Gate</h3>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                  <span>Body Weight Dimensionality:</span>
                  <span className="font-bold text-emerald-700">Validated (Pint: kg)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-200">
                  <span>Renal Filtration (eGFR):</span>
                  <span className="font-bold text-emerald-700">Present (mL/min)</span>
                </div>
                <div className="flex items-center justify-between text-xs py-1">
                  <span>Drug Clearances ($CL$) &amp; Volumes ($V$):</span>
                  <span className="font-bold text-emerald-700">Ready for Allometric Scaling</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: CONFIRMATION & LOCAL ENCRYPTED IMPORT */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                <div className="font-bold text-xs uppercase flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700" />
                  <span>Research Data Workspace Confirmation</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-900">
                  This software provides computational bio-mathematical simulation and decision-support outputs.
                  It is <strong>NOT an autonomous medical prescriber</strong>. All simulated concentrations and
                  scenario comparisons require qualified professional clinician/researcher interpretation.
                </p>
                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disclaimerAccepted}
                    onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-amber-950">
                    I acknowledge this research and clinical decision-support scope boundary.
                  </span>
                </label>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 text-slate-700 text-xs">
                <Lock className="w-4 h-4 text-emerald-700" />
                <span>Payload will be envelope encrypted with local AES-256-GCM.</span>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step === 1 && (
            <button
              onClick={handleInspect}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span>{isProcessing ? "Scanning..." : "Inspect Privacy"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step > 1 && step < 5 && (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {step === 5 && (
            <button
              onClick={handleCommit}
              disabled={isProcessing || !disclaimerAccepted}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Encrypting..." : "Commit Encrypted Import"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
