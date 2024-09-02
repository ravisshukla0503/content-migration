import mysql from "mysql2/promise";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log("Request received");
    const body = await req.json();
    const { host, user, password, database } = body;

    try {
        const connection = await mysql.createConnection({
            host: host,
            user: user,
            password: password,
            database: database,
        });
        console.log('MySQL connection established successfully');

        // Query to get table and column names
        const [rows] = await connection.query(`
            SELECT 
                TABLE_NAME, 
                COLUMN_NAME 
            FROM 
                INFORMATION_SCHEMA.COLUMNS 
            WHERE 
                TABLE_SCHEMA = ?
            ORDER BY 
                TABLE_NAME, 
                ORDINAL_POSITION;
        `, [database]);

        await connection.end();

        // Ensure rows are treated as an array of objects
        const tableColumns = (rows as Array<{ TABLE_NAME: string; COLUMN_NAME: string }>).reduce((acc, { TABLE_NAME, COLUMN_NAME }) => {
            if (!acc[TABLE_NAME]) {
                acc[TABLE_NAME] = [];
            }
            acc[TABLE_NAME].push(COLUMN_NAME);
            return acc;
        }, {} as Record<string, string[]>);

        return NextResponse.json({ tables: tableColumns });
    } catch (error: any) {
        console.error('Error connecting to MySQL:', error.message || error);
        return NextResponse.json({ error: "Failed to fetch data from MySQL", details: error.message || error }, { status: 500 });
    }
}

