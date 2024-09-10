"use client";
import { setTableSlice } from "@/lib/feature/setTableSlice";
import { useAppDispatch } from "@/lib/hook";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function Home() {
  const [wpFormData, setWpFormData] = useState({
    host: "",
    user: "",
    password: "",
    database: "",
  });
  const [isGetWpTables, setIsGetWpTables] = useState(false);
  const [isCreatedMysqlTable, setIsCreatedMysqlTable] = useState(false);

  const dispatch = useAppDispatch();

  const [mysqlFormData, setMysqlFormData] = useState({
    xml: "",
    type: "",
    onBasisOfCategory: false,
    contentClass: "",
    InfoClass: "",
    ImageClass: "",
    dbConfig: {
      host: "",
      user: "",
      password: "",
      database: "",
    },
    tableName: "",
  });

  const [loadingWp, setLoadingWp] = useState(false);
  const [loadingMysql, setLoadingMysql] = useState(false);

  const router = useRouter();

  const handleWpSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoadingWp(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/mysqlCreateConnection",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(wpFormData),
        }
      );
      if (response.status === 200) {
        setIsGetWpTables(true);
        const data = await response.json();
        dispatch(setTableSlice.actions.setTable(data));
        console.log("WordPress Tables:", data);
      }
    } catch (error) {
      console.error("Error fetching WordPress tables:", error);
    }
    setLoadingWp(false);
    // Reset the form
    setWpFormData({ host: "", user: "", password: "", database: "" });
  };

  const handleMysqlSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoadingMysql(true);
    try {
      const response = await fetch("http://localhost:3000/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mysqlFormData),
      });
      if (response.status === 200) {
        const data = await response.json();
        setIsCreatedMysqlTable(true);
        console.log("MySQL Table Creation:", data);
      }
    } catch (error) {
      console.error("Error creating MySQL table:", error);
    }
    setLoadingMysql(false);
    // Reset the form
    setMysqlFormData({
      xml: "",
      type: "",
      onBasisOfCategory: false,
      contentClass: "",
      InfoClass: "",
      ImageClass: "",
      dbConfig: {
        host: "",
        user: "",
        password: "",
        database: "",
      },
      tableName: "",
    });
  };

  const redirectToMapPage = () => {
    router.push("/map");
  };

  const isWpFormValid = () =>
    wpFormData.host &&
    wpFormData.user &&
    wpFormData.password &&
    wpFormData.database;

  const isMysqlFormValid = () =>
    mysqlFormData.xml &&
    mysqlFormData.type &&
    mysqlFormData.dbConfig.host &&
    mysqlFormData.dbConfig.user &&
    mysqlFormData.dbConfig.password &&
    mysqlFormData.dbConfig.database &&
    mysqlFormData.tableName &&
    mysqlFormData.contentClass &&
    mysqlFormData.InfoClass &&
    mysqlFormData.ImageClass;

  console.log("main page");
  return (
    <div className="min-h-screen bg-gray-100 p-4">  
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="text-lg font-semibold mb-2">Fetch WordPress Tables</h2>
          <form onSubmit={handleWpSubmit} className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Host
              </label>
              <input
                type="text"
                value={wpFormData.host}
                onChange={(e) =>
                  setWpFormData({ ...wpFormData, host: e.target.value })
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
                value={wpFormData.user}
                onChange={(e) =>
                  setWpFormData({ ...wpFormData, user: e.target.value })
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
                value={wpFormData.password}
                onChange={(e) =>
                  setWpFormData({ ...wpFormData, password: e.target.value })
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
                value={wpFormData.database}
                onChange={(e) =>
                  setWpFormData({ ...wpFormData, database: e.target.value })
                }
                className="mt-1 block w-full p-1 border border-gray-300 rounded"
              />
            </div>
            <button
              type="submit"
              className={`w-full bg-[#009790] text-white py-2 rounded mt-2 ${
                loadingWp || !isWpFormValid()
                  ? "opacity-50 cursor-not-allowed"
                  : "opacity-100"
              }`}
              disabled={loadingWp || !isWpFormValid()}
            >
              {loadingWp ? "Fetching..." : "Fetch Tables"}
            </button>
          </form>
        </div>

        <div className="bg-white p-4 shadow rounded max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Create MySQL Table</h2>
          <form onSubmit={handleMysqlSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  XML URL
                </label>
                <input
                  type="text"
                  value={mysqlFormData.xml}
                  onChange={(e) =>
                    setMysqlFormData({
                      ...mysqlFormData,
                      xml: e.target.value,
                    })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <input
                  type="text"
                  value={mysqlFormData.type}
                  onChange={(e) =>
                    setMysqlFormData({
                      ...mysqlFormData,
                      type: e.target.value,
                    })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Host
                  </label>
                  <input
                    type="text"
                    value={mysqlFormData.dbConfig.host}
                    onChange={(e) =>
                      setMysqlFormData({
                        ...mysqlFormData,
                        dbConfig: {
                          ...mysqlFormData.dbConfig,
                          host: e.target.value,
                        },
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
                    value={mysqlFormData.dbConfig.user}
                    onChange={(e) =>
                      setMysqlFormData({
                        ...mysqlFormData,
                        dbConfig: {
                          ...mysqlFormData.dbConfig,
                          user: e.target.value,
                        },
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
                    value={mysqlFormData.dbConfig.password}
                    onChange={(e) =>
                      setMysqlFormData({
                        ...mysqlFormData,
                        dbConfig: {
                          ...mysqlFormData.dbConfig,
                          password: e.target.value,
                        },
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
                    value={mysqlFormData.dbConfig.database}
                    onChange={(e) =>
                      setMysqlFormData({
                        ...mysqlFormData,
                        dbConfig: {
                          ...mysqlFormData.dbConfig,
                          database: e.target.value,
                        },
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Table Prefix
                  </label>
                  <input
                    type="text"
                    value={mysqlFormData.tableName}
                    onChange={(e) =>
                      setMysqlFormData({
                        ...mysqlFormData,
                        tableName: e.target.value,
                      })
                    }
                    className="mt-1 block w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Content Class
                </label>
                <input
                  type="text"
                  value={mysqlFormData.contentClass}
                  onChange={(e) =>
                    setMysqlFormData({
                      ...mysqlFormData,
                      contentClass: e.target.value,
                    })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Info Class
                </label>
                <input
                  type="text"
                  value={mysqlFormData.InfoClass}
                  onChange={(e) =>
                    setMysqlFormData({
                      ...mysqlFormData,
                      InfoClass: e.target.value,
                    })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Image Class
                </label>
                <input
                  type="text"
                  value={mysqlFormData.ImageClass}
                  onChange={(e) =>
                    setMysqlFormData({
                      ...mysqlFormData,
                      ImageClass: e.target.value,
                    })
                  }
                  className="mt-1 block w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={mysqlFormData.onBasisOfCategory}
                onChange={(e) =>
                  setMysqlFormData({
                    ...mysqlFormData,
                    onBasisOfCategory: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">
                On Basis of Category
              </label>
            </div>
            <button
              type="submit"
              className={`w-full bg-[#009790] text-white py-2 rounded mt-2 ${
                loadingMysql || !isMysqlFormValid()
                  ? "opacity-50 cursor-not-allowed"
                  : "opacity-100"
              }`}
              disabled={loadingMysql || !isMysqlFormValid()}
            >
              {loadingMysql ? "Creating..." : "Create Table"}
            </button>
          </form>
        </div>
      </div>
      <button
        className={`mt-8 w-1/6 py-2 text-white text-center bg-[#009790] rounded ${
          isGetWpTables && isCreatedMysqlTable
            ? "opacity-100"
            : "opacity-50 cursor-not-allowed"
        } mx-auto block`}
        aria-disabled={!isGetWpTables && !isCreatedMysqlTable}
        onClick={redirectToMapPage}
      >
        Map Wp Tables
      </button>
    </div>
  );
}
