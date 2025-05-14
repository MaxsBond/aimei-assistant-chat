"use client";

import { MainLayout } from "@/components/layout/main-layout";
import { formatDate } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function FormatTestPage() {
  const [results, setResults] = useState<Array<{input: any; desc: string; output: string}>>([]);
  
  useEffect(() => {
    // Test formatDate with various inputs
    const testCases = [
      { input: new Date(), desc: "Current date" },
      { input: new Date("2023-10-15T10:30:00"), desc: "Valid date string" },
      { input: "2023-10-15T10:30:00", desc: "Date string (not a Date object)" },
      { input: null, desc: "null" },
      { input: undefined, desc: "undefined" },
      { input: {}, desc: "Empty object" },
      { input: { toString() { return "fake date" } }, desc: "Object with toString" },
      { input: new Date("invalid date"), desc: "Invalid Date object" },
    ];
    
    const results = testCases.map(({ input, desc }) => ({
      input: String(input),
      desc,
      output: formatDate(input)
    }));
    
    setResults(results);
  }, []);
  
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Format Date Testing</h1>
        <div className="border rounded-lg p-4">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Input Description</th>
                <th className="text-left p-2">Input Value</th>
                <th className="text-left p-2">Output</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className="border-b">
                  <td className="p-2">{result.desc}</td>
                  <td className="p-2 font-mono text-sm">{result.input}</td>
                  <td className="p-2">{result.output}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
} 