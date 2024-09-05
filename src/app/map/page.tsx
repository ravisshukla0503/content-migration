"use client";

import { useAppSelector } from "@/lib/hook";
import { useState } from "react";

export default function Map() {
  const postTables = [
    "category_id",
    "author_id",
    "title",
    "postType",
    "slug",
    "content",
    "featureImg",
    "imageAlt",
    "publishedDate",
  ];

  let wpTables = useAppSelector((state) => state.wpTableState.tables);
  let wpPostTables = wpTables["wp_posts"];

  const [mapping, setMapping] = useState<{ [key: string]: string }>(
    postTables.reduce((acc, item) => ({ ...acc, [item]: "" }), {})
  );

  const selectedValues = Object.values(mapping);

  const handleChange = (key: string, value: string) => {
    setMapping({ ...mapping, [key]: value });
  };

  const checkAllfieldsFilled = () => {
    return Object.values(mapping).every((val) => val !== "");
  };

  console.log(mapping);
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Map Columns</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200 shadow-lg">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-4 text-left text-gray-600 uppercase font-semibold text-sm border-b">
                Post Table
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase font-semibold text-sm border-b">
                WP Post Table
              </th>
            </tr>
          </thead>
          <tbody>
            {postTables.map((postTable, idx) => (
              <tr
                key={postTable}
                className={idx % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="py-3 px-4 border-b">{postTable}</td>
                <td className="py-3 px-4 border-b">
                  <select
                    value={mapping[postTable]}
                    onChange={(e) => handleChange(postTable, e.target.value)}
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select...</option>
                    {wpPostTables.map((wpPost: string) => (
                      <option key={wpPost} value={wpPost}  disabled={selectedValues.includes(wpPost)}>
                        {wpPost}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button disabled={!checkAllfieldsFilled()}>Submit</button>
    </div>
  );
}
