"use client";

import { useAppSelector } from "@/lib/hook";
import { useState } from "react";

export default function Map() {
  const postTables = [
    "author_id",
    "title",
    "postType",
    "slug",
    "content",
    "publishedDate",
    "updatedDate",
  ];

  const [targetTableFormData, setTargetTableFormData] = useState({
    host: "",
    user: "",
    password: "",
    database: "",
  });

  const [sourceTableFormData, setSourceTableFormData] = useState({
    host: "",
    user: "",
    password: "",
    database: "",
    tableName: "",
  });

  const isTargetTableFormValid = () =>
    targetTableFormData.host &&
    targetTableFormData.user &&
    targetTableFormData.password &&
    targetTableFormData.database;

  const isSourceTableFormValid = () =>
    sourceTableFormData.host &&
    sourceTableFormData.user &&
    sourceTableFormData.password &&
    sourceTableFormData.database &&
    sourceTableFormData.tableName;

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

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const requestBody = {
      Mapping: mapping,
      TargetTable: targetTableFormData,
      SourceTable: sourceTableFormData,
    }
    try {
      console.log(requestBody);
      const response = await fetch("http://localhost:3000/api/mssqlCreateConnection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      if(response.status === 200) {
        const data = await response.json();
        console.log(data);
      }
    } catch (error) {
      console.error("Error fetching WordPress tables:", error);
    }
  };

  console.log(mapping);
  return (
    <>
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
                        <option
                          key={wpPost}
                          value={wpPost}
                          disabled={selectedValues.includes(wpPost)}
                        >
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-16">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-lg font-semibold mb-2">Target Wordpress Table</h2>
          <form className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Host
              </label>
              <input
                type="text"
                value={targetTableFormData.host}
                onChange={(e) =>
                  setTargetTableFormData({ ...targetTableFormData, host: e.target.value })
                }
                className="mt-1 block w-full p-1 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                User
              </label>
              <input
                type="text"
                value={targetTableFormData.user}
                onChange={(e) =>
                  setTargetTableFormData({ ...targetTableFormData, user: e.target.value })
                }
                className="mt-1 block w-full p-1 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={targetTableFormData.password}
                onChange={(e) =>
                  setTargetTableFormData({ ...targetTableFormData, password: e.target.value })
                }
                className="mt-1 block w-full p-1 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Database
              </label>
              <input
                type="text"
                value={targetTableFormData.database}
                onChange={(e) =>
                  setTargetTableFormData({ ...targetTableFormData, database: e.target.value })
                }
                className="mt-1 block w-full p-1 border border-gray-300 rounded"
              />
            </div>
          </form>
        </div>

        <div className="bg-white p-4 shadow rounded max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Source Table</h2>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Host
                  </label>
                  <input
                    type="text"
                    value={sourceTableFormData.host}
                    onChange={(e) =>
                      setSourceTableFormData({
                        ...sourceTableFormData,
                        host: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    User
                  </label>
                  <input
                    type="text"
                    value={sourceTableFormData.user}
                    onChange={(e) =>
                      setSourceTableFormData({
                        ...sourceTableFormData,
                        user: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    value={sourceTableFormData.password}
                    onChange={(e) =>
                      setSourceTableFormData({
                        ...sourceTableFormData,
                        password: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Database
                  </label>
                  <input
                    type="text"
                    value={sourceTableFormData.database}
                    onChange={(e) =>
                      setSourceTableFormData({
                        ...sourceTableFormData,
                        database: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Table Name
                  </label>
                  <input
                    type="text"
                    value={sourceTableFormData.tableName}
                    onChange={(e) =>
                      setSourceTableFormData({
                        ...sourceTableFormData,
                        tableName: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      <button disabled={!checkAllfieldsFilled() && !isSourceTableFormValid() && !isTargetTableFormValid()} onClick={handleSubmit}>Submit</button>
    </>
  );
}
