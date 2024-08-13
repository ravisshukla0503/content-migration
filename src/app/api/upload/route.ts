// import multer from "multer";
// import { NextRequest, NextResponse } from "next/server";
// import { promisify } from "util";

// const upload = multer({ storage: multer.memoryStorage() });
// const uploadMiddleware = promisify(upload.single("file"));

// export async function POST(req: NextRequest) {
//   const formData = await req.formData();
//   const file = formData.get("file") as File;

//   if (!file) {
//     return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//   }

//   try {
//     const arrayBuffer = await file.arrayBuffer();
//     const content = new TextDecoder().decode(arrayBuffer);
//     const tables = parseSQL(content);
//     return NextResponse.json(tables, { status: 200 });
//   } catch (err) {
//     console.error("Error processing file:", err);
//     return NextResponse.json({ error: "Error processing file" }, { status: 500 });
//   }
// }

// function parseSQL(content: string) {
//     const tables: any[] = [];
//     const lines = content.split("\n");
//     let currentTable: any = null;
  
//     for (const line of lines) {
//       const trimmedLine = line.trim();
//       if (trimmedLine.startsWith("CREATE TABLE")) {
//         currentTable = { name: trimmedLine.split("`")[1], fields: [], data: [] };
//         tables.push(currentTable);
//       } else if (trimmedLine.startsWith("`") && currentTable) {
//         const fieldParts = trimmedLine.split("`");
//         const fieldName = fieldParts[1];
//         currentTable.fields.push(fieldName);
//       } else if (trimmedLine.startsWith("INSERT INTO") && currentTable) {
//         const valuesPart = trimmedLine.split("VALUES")[1].trim();
//         const values = valuesPart
//           .substring(1, valuesPart.length - 2) // Remove the outer parentheses
//           .split("),(") // Split by the record separators
//           .map(record => record.split(",").map(value => value.trim().replace(/^'|'$/g, ""))); // Split each record by commas and trim quotes
//         currentTable.data.push(...values);
//       }
//     }
  
//     return tables;
//   }

//table with content

import multer from "multer";
import { NextRequest, NextResponse } from "next/server";

// Multer setup for handling file uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// Function to handle POST requests
export async function POST(req: NextRequest) {
  try {
    // Retrieve form data
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Read the file content as an array buffer and convert it to a string
    const arrayBuffer = await file.arrayBuffer();
    const content = new TextDecoder().decode(arrayBuffer);
    const tables = parseSQL(content);

    return NextResponse.json(tables, { status: 200 });
  } catch (err) {
    console.error("Error processing file:", err);
    return NextResponse.json({ error: "Error processing file" }, { status: 500 });
  }
}

// Function to handle other HTTP methods
export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}

// Function to parse SQL content
function parseSQL(content: string) {
  const tables: any[] = [];
  const lines = content.split("\n");
  let currentTable: any = null;

  for (const line of lines) {
    if (line.trim().startsWith("CREATE TABLE")) {
      currentTable = { name: line.split("`")[1], fields: [] };
      tables.push(currentTable);
    } else if (line.trim().startsWith("`")) {
      const field = line.split("`")[1];
      if (currentTable) {
        currentTable.fields.push(field);
      }
    }
  }

  return tables;
}
