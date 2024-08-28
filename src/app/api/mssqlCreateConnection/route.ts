// app/api/fetchMSSQLData/route.js
import { NextRequest, NextResponse } from "next/server";
import sql from "mssql";

export async function POST(req: NextRequest) {
  let pool;

  try {
    const body = await req.json();
    const { user, password, server, database, table } = body;

    const config = {
      user,
      password,
      server,
      database,
      options: {
        encrypt: true,
        trustServerCertificate: true,
      },
    };

    // Create a new MSSQL connection pool
    pool = await sql.connect(config);

    // Query to fetch all data from the specified table
    const result = await pool.request().query(`SELECT * FROM ${table}`);

    // Return the fetched data
    return NextResponse.json({ data: result.recordset });
  } catch (error: any) {
    // Handle any errors that occur during the connection process
    console.error("Error fetching data from MSSQL:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch data from MSSQL", details: error.message },
      { status: 500 }
    );
  } finally {
    // Close the connection pool
    if (pool) {
      await pool.close();
    }
  }
}
