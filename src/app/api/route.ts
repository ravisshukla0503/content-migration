import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import mysql, { ResultSetHeader, RowDataPacket } from "mysql2/promise";

const BACKSLASH_REGEX = /\\/g;

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();
//     const {
//       xml,
//       type,
//       onBasisOfCategory,
//       contentClass,
//       InfoClass,
//       ImageClass,
//       dbConfig, // Added for database configuration
//       tableName,
//     } = body;

//     const parsedUrl = new URL(xml);
//     console.log("parsedUrl", parsedUrl);
//     const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
//     console.log("baseUrl", baseUrl);
//     const urls = await extractUrlsFromSitemap(xml, type);
//     console.log("urls", urls);
//     console.log("body", body);
//     // Create a connection to the MySQL database
//     const pool = mysql.createPool(dbConfig);
//     console.log("pool", pool);

//     // Create the table if it doesn't exist
//     await createTableIfNotExists(pool, tableName);

//     // Process each URL and insert into the database immediately
//     for (const url of urls) {
//       const { category, isCategory } = extractCategoryFromUrl(url, type, onBasisOfCategory);
//       const title = category
//         ? await fetchTitleFromUrl(url)
//         : formatTitleFromUrl(url);
//       let splitUrlForSlug = url.split("/").filter(Boolean);
//       const slug = splitUrlForSlug[splitUrlForSlug.length - 1];

//       if (onBasisOfCategory && !category) {
//         await upsertIntoDatabase(pool, {
//           url,
//           title,
//           category: null,
//           content: null,
//           date: null,
//           author: null,
//           image: null,
//           imageAlt: null,
//           slug
//         }, tableName);
//       } else {
//         const { content, date, author, image, imageAlt } = await fetchPageData(
//           url,
//           contentClass,
//           InfoClass,
//           ImageClass,
//           baseUrl
//         );
//         await upsertIntoDatabase(pool, {
//           url,
//           title,
//           category,
//           content,
//           date,
//           author,
//           image,
//           imageAlt,
//           slug
//         }, tableName);
//       }
//     }

//     await pool.end();
//     return NextResponse.json({ message: "Data processed and inserted successfully" });

//   } catch (error) {
//     return NextResponse.json(
//       { error: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

// async function createTableIfNotExists(connection: mysql.Pool, tableName: string) {
//   const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS \`${tableName}\` (
//       id INT AUTO_INCREMENT PRIMARY KEY,
//       url VARCHAR(255) UNIQUE,
//       title VARCHAR(255),
//       category VARCHAR(255),
//       content TEXT,
//       date DATETIME,
//       author VARCHAR(255),
//       image VARCHAR(255),
//       imageAlt VARCHAR(255),
//       slug VARCHAR(255)
//     );
//   `;
//   await connection.execute(createTableQuery);
// }

// async function upsertIntoDatabase(connection: mysql.Pool, data: any, tableName: string) {
//   // Use INSERT ... ON DUPLICATE KEY UPDATE to avoid duplicate entries
//   const upsertQuery = `
//     INSERT INTO ${tableName}
//     (url, title, category, content, date, author, image, imageAlt, slug)
//     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//     ON DUPLICATE KEY UPDATE
//       title = VALUES(title),
//       category = VALUES(category),
//       content = VALUES(content),
//       date = VALUES(date),
//       author = VALUES(author),
//       image = VALUES(image),
//       imageAlt = VALUES(imageAlt),
//       slug = VALUES(slug);
//   `;
//   await connection.execute(upsertQuery, [
//     data.url,
//     data.title,
//     data.category,
//     data.content,
//     data.date,
//     data.author,
//     data.image,
//     data.imageAlt,
//     data.slug
//   ]);
// }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      xml,
      type,
      onBasisOfCategory,
      contentClass,
      InfoClass,
      ImageClass,
      dbConfig,
      tableName,
    } = body;

    const parsedUrl = new URL(xml);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
    const urls = await extractUrlsFromSitemap(xml, type);

    const pool = mysql.createPool(dbConfig);

    await createTablesIfNotExists(pool, tableName);

    for (const url of urls) {
      const { category, isCategory } = extractCategoryFromUrl(
        url,
        type,
        onBasisOfCategory
      );

      // Skip processing if the category is "page"
      if (category === "page") continue;

      const title = category
        ? await fetchTitleFromUrl(url)
        : formatTitleFromUrl(url);
      let splitUrlForSlug = url.split("/").filter(Boolean);
      const slug = splitUrlForSlug[splitUrlForSlug.length - 1];

      const authorName = await extractAuthorName(url, InfoClass);
      const authorId = await upsertAuthor(
        pool,
        authorName,
        `${tableName}-author`
      );

      let categoryId = 1; // Default to "Uncategory"
      if (onBasisOfCategory) {
        if (isCategory) {
          categoryId = await upsertCategory(
            pool,
            category,
            `${tableName}-category`
          );
        } else {
          categoryId = await getCategoryID(
            pool,
            category,
            `${tableName}-category`
          );
        }
      }

      // Skip posts table update if isCategory is true
      if (isCategory) continue;

      const { content, date, image, imageAlt } = await fetchPageData(
        url,
        contentClass,
        InfoClass,
        ImageClass,
        baseUrl
      );

      await upsertPost(
        pool,
        {
          categoryId,
          authorId,
          title,
          slug,
          content,
          image,
          imageAlt,
          publishedDate: date,
        },
        `${tableName}-posts`
      );
    }

    await pool.end();
    return NextResponse.json({
      message: "Data processed and inserted successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

async function createTablesIfNotExists(
  connection: mysql.Pool,
  tableName: string
) {
  const createCategoryTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}-category\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoryName VARCHAR(255) UNIQUE
    );
  `;
  const createAuthorTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}-author\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      authorName VARCHAR(255)
    );
  `;
  const createPostsTableQuery = `
    CREATE TABLE IF NOT EXISTS \`${tableName}-posts\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      category_id INT,
      author_id INT,
      title VARCHAR(255),
      slug VARCHAR(255) UNIQUE,
      content TEXT,
      featureImg VARCHAR(255),
      imageAlt VARCHAR(255),
      publishedDate DATETIME,
      currentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES \`${tableName}-category\`(id),
      FOREIGN KEY (author_id) REFERENCES \`${tableName}-author\`(id)
    );
  `;

  await connection.execute(createCategoryTableQuery);
  await connection.execute(createAuthorTableQuery);
  await connection.execute(createPostsTableQuery);

  // Ensure "Uncategory" exists in the category table
  const insertDefaultCategoryQuery = `
    INSERT IGNORE INTO \`${tableName}-category\` (id, categoryName) VALUES (1, 'Uncategory');
  `;
  await connection.execute(insertDefaultCategoryQuery);
}

async function upsertCategory(
  connection: mysql.Pool,
  categoryName: string,
  categoryTable: string
): Promise<number> {
  const query = `
    INSERT INTO \`${categoryTable}\` (categoryName) VALUES (?)
    ON DUPLICATE KEY UPDATE categoryName = VALUES(categoryName);
  `;
  const [result] = await connection.execute<ResultSetHeader>(query, [
    categoryName,
  ]);
  return result.insertId;
}

// async function upsertAuthor(
//   connection: mysql.Pool,
//   authorName: string,
//   authorTable: string
// ): Promise<number> {
//   const query = `
//     INSERT INTO \`${authorTable}\` (authorName) VALUES (?)
//     ON DUPLICATE KEY UPDATE authorName = VALUES(authorName);
//   `;
//   const [result] = await connection.execute<ResultSetHeader>(query, [
//     authorName,
//   ]);
//   return result.insertId;
// }

async function upsertAuthor(
  connection: mysql.Pool,
  authorName: string,
  authorTable: string
): Promise<number> {
  // Check if author already exists
  const checkAuthorQuery = `SELECT id FROM \`${authorTable}\` WHERE authorName = ? LIMIT 1`;
  const [rows] = await connection.execute<[RowDataPacket[]]>(checkAuthorQuery, [authorName]);

  if (rows.length > 0) {
    // Author exists, return the existing ID
    return (rows[0] as unknown as { id: number }).id;
  }

  // Author does not exist, insert a new one
  const insertAuthorQuery = `
    INSERT INTO \`${authorTable}\` (authorName) VALUES (?)
  `;
  const [result] = await connection.execute<ResultSetHeader>(insertAuthorQuery, [authorName]);
  return result.insertId;
}


async function getCategoryID(
  connection: mysql.Pool,
  categoryName: string,
  categoryTable: string
): Promise<number> {
  const query = `SELECT id FROM \`${categoryTable}\` WHERE categoryName = ? LIMIT 1`;
  const [rows] = await connection.execute<[RowDataPacket[]]>(query, [
    categoryName,
  ]);
  const category = (rows[0] as unknown as { id: number }) || 1;
  return category.id;
}

async function upsertPost(
  connection: mysql.Pool,
  data: any,
  postsTable: string
) {
  const query = `
    INSERT INTO \`${postsTable}\`
    (category_id, author_id, title, slug, content, featureImg, imageAlt, publishedDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      title = VALUES(title),
      content = VALUES(content),
      featureImg = VALUES(featureImg),
      imageAlt = VALUES(imageAlt),
      publishedDate = VALUES(publishedDate),
      updatedDate = CURRENT_TIMESTAMP;
  `;
  await connection.execute(query, [
    data.categoryId,
    data.authorId,
    data.title,
    data.slug,
    data.content,
    data.image,
    data.imageAlt,
    data.publishedDate,
  ]);
}

async function fetchPageData(
  url: string,
  contentClass: string,
  infoClass: string,
  imageClass: string,
  baseUrl: string
) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const data = await response.text();
    const $ = cheerio.load(data);

    const contentInnerHtml = $(`.${contentClass}`);

    contentInnerHtml.find("img").each((_, img) => {
      let src = $(img).attr("src");

      if (src && !src.startsWith("http")) {
        src = src.replace(BACKSLASH_REGEX, "");
        $(img).attr("src", baseUrl + src);
      }
    });

    const content = contentInnerHtml.html();
    const dateElement = $(`.${infoClass} div`).eq(0).text().trim();
    const formattedDate = dateElement ? formatDate(dateElement) : null;

    let imageUrl = $(`.${imageClass} img`).attr("src") || "";
    imageUrl = imageUrl.startsWith("/") ? baseUrl + imageUrl : imageUrl;
    const imageAlt = $(`.${imageClass} img`).attr("alt") || "";

    return {
      content,
      date: formattedDate,
      image: imageUrl,
      imageAlt: imageAlt,
    };
  } catch (error: any) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return {
      content: null,
      date: null,
      author: null,
      image: null,
      imageAlt: null,
    };
  }
}

async function extractUrlsFromSitemap(
  xml: string,
  type: string
): Promise<string[]> {
  const response = await fetch(xml);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }
  const data = await response.text();
  const parsedSitemap = await parseStringPromise(data);

  return parsedSitemap.urlset.url
    .map((entry: any) => entry.loc[0])
    .filter((url: string) => url.includes(type));
}

function extractCategoryFromUrl(
  url: string,
  type: string,
  onBasisOFCategory: boolean
): { category: string; isCategory: boolean } {
  let category: string;
  let isCategory: boolean;

  if (onBasisOFCategory) {
    const segments = url.split("/").filter(Boolean);
    const blogIndex = segments.indexOf(type);
    category =
      blogIndex >= 0 && segments.length > blogIndex + 1
        ? segments[blogIndex + 1]
        : "page";
    isCategory = !(blogIndex >= 0 && segments.length > blogIndex + 2);
  } else {
    category = "Uncategory";
    isCategory = false;
  }

  return { category, isCategory };
}

async function fetchTitleFromUrl(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch title from ${url}: ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const title = $("title").text();
  return title.split("|").map((part) => part.trim())[0] || title;
}

function formatTitleFromUrl(url: string): string {
  const segments = url.split("/").filter(Boolean);
  const lastSegment = segments.pop()?.split("?")[0] || "";
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} 00:00:00`;
}

async function extractAuthorName(url: string, InfoClass: any) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch author name from ${url}: ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  return $(`.${InfoClass} div`).eq(2).text().trim();
}
