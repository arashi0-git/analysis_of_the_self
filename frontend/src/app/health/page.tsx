import React from "react";

export default async function HealthPage() {
  const apiUrl = process.env.API_INTERNAL_URL || "http://backend:8000";
  let data = null;
  let error = null;

  try {
    const res = await fetch(`${apiUrl}/health`, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Status: ${res.status}`);
    }
    data = await res.json();
  } catch (e) {
    error = String(e);
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Health Check</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold">Backend Status:</h2>
        {data ? (
          <pre className="text-green-600">{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p className="text-red-600">Error: {error}</p>
        )}
      </div>
    </div>
  );
}
